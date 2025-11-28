import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { MessageType } from "@/components/Message";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Users, Phone, Video, MoreVertical, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";
import { EditGroupDialog } from "@/components/EditGroupDialog";
import { OnlineUsersIndicator } from "@/components/OnlineUsersIndicator";

const GroupChat = () => {
  const { groupName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group;

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [groupData, setGroupData] = useState(group);

  useEffect(() => {
    initializeChat();
  }, [group?.id]);

  useEffect(() => {
    setGroupData(group);
  }, [group]);

  const handleGroupUpdated = async () => {
    if (!group?.id) return;
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('id', group.id)
      .maybeSingle();
    if (data) {
      setGroupData(data);
    }
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ text: newText })
        .eq('id', messageId);

      if (error) throw error;

      toast.success("Message updated");
    } catch (error: any) {
      console.error('Error updating message:', error);
      toast.error("Failed to update message");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      toast.success("Message deleted");
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast.error("Failed to delete message");
    }
  };

  const initializeChat = async () => {
    try {
      // Get user from localStorage (custom auth)
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        // Show static messages for demo
        setMessages([
          {
            id: "1",
            text: "Welcome to the group chat! 👋",
            sender: "Alex",
            timestamp: new Date(Date.now() - 7200000),
            isSent: false,
          },
          {
            id: "2",
            text: "Hey team! Excited to collaborate here.",
            sender: "You",
            timestamp: new Date(Date.now() - 7000000),
            isSent: true,
          },
        ]);
        setLoading(false);
        return;
      }
      
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);

      if (group?.id && !group.id.startsWith('static-')) {
        await fetchMessages();
        subscribeToMessages();
      } else {
        setMessages([
          {
            id: "1",
            text: "Welcome to the group chat! 👋",
            sender: "Alex",
            timestamp: new Date(Date.now() - 7200000),
            isSent: false,
          },
          {
            id: "2",
            text: "Hey team! Excited to collaborate here.",
            sender: "You",
            timestamp: new Date(Date.now() - 7000000),
            isSent: true,
          },
        ]);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error initializing chat:', error);
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      if (!group?.id) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user from localStorage
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      
      const formattedMessages: MessageType[] = await Promise.all(
        (data || []).map(async (msg) => {
          // Get read receipts for this message
          const { data: reads } = await supabase
            .from('message_reads')
            .select('user_id, read_at')
            .eq('message_id', msg.id);

          const readBy = reads?.map(r => r.user_id) || [];

          // Get sender username from users table
          let senderName = "Member";
          if (msg.sender_id !== user?.id) {
            const { data: userData } = await supabase
              .from('users')
              .select('username')
              .eq('id', msg.sender_id)
              .maybeSingle();
            
            if (userData?.username) {
              senderName = userData.username;
            }
          }

          return {
            id: msg.id,
            text: msg.text || '',
            sender: msg.sender_id === user?.id ? "You" : senderName,
            timestamp: new Date(msg.created_at),
            isSent: msg.sender_id === user?.id,
            image: msg.image,
            readBy
          };
        })
      );

      setMessages(formattedMessages);

      // Mark messages as read
      if (user) {
        const unreadMessages = data?.filter(msg => msg.sender_id !== user.id) || [];
        for (const msg of unreadMessages) {
          await supabase
            .from('message_reads')
            .upsert({
              message_id: msg.id,
              user_id: user.id
            }, {
              onConflict: 'message_id,user_id'
            });
        }
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!group?.id) return;

    const channel = supabase
      .channel(`messages-${group.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${group.id}`
        },
        async (payload) => {
          const newMsg = payload.new;
          
          // Get user from localStorage
          const userStr = localStorage.getItem("user");
          const user = userStr ? JSON.parse(userStr) : null;

          // Skip if this is our own message (already added optimistically)
          if (user && newMsg.sender_id === user.id) {
            // Replace temp message with real one
            setMessages(prev => {
              const withoutTemp = prev.filter(m => !m.id.startsWith('temp-'));
              const alreadyExists = withoutTemp.some(m => m.id === newMsg.id);
              if (alreadyExists) return prev;
              
              const formattedMessage: MessageType = {
                id: newMsg.id,
                text: newMsg.text || '',
                sender: "You",
                timestamp: new Date(newMsg.created_at),
                isSent: true,
                image: newMsg.image,
                readBy: []
              };
              return [...withoutTemp, formattedMessage];
            });
            return;
          }

          // Get sender username from users table
          let senderName = "Member";
          if (newMsg.sender_id !== user?.id) {
            const { data: userData } = await supabase
              .from('users')
              .select('username')
              .eq('id', newMsg.sender_id)
              .maybeSingle();
            
            if (userData?.username) {
              senderName = userData.username;
            }
          }

          const formattedMessage: MessageType = {
            id: newMsg.id,
            text: newMsg.text || '',
            sender: senderName,
            timestamp: new Date(newMsg.created_at),
            isSent: false,
            image: newMsg.image,
            readBy: []
          };

          setMessages(prev => [...prev, formattedMessage]);

          // Mark as read if not sent by current user
          if (user && newMsg.sender_id !== user.id) {
            await supabase
              .from('message_reads')
              .insert({
                message_id: newMsg.id,
                user_id: user.id
              });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads'
        },
        (payload) => {
          const read = payload.new;
          setMessages(prev => prev.map(msg => {
            if (msg.id === read.message_id) {
              return {
                ...msg,
                readBy: [...(msg.readBy || []), read.user_id]
              };
            }
            return msg;
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (text: string, image?: string) => {
    try {
      // Get user from localStorage
      const userStr = localStorage.getItem("user");
      
      if (!userStr) {
        toast.error("Please login to send messages");
        return;
      }
      
      const user = JSON.parse(userStr);
      
      if (!group?.id) {
        toast.error("Invalid group");
        return;
      }

      if (group.id.startsWith('static-')) {
        const newMessage: MessageType = {
          id: Date.now().toString(),
          text,
          sender: "You",
          timestamp: new Date(),
          isSent: true,
          image,
        };
        setMessages(prev => [...prev, newMessage]);
        return;
      }

      // Optimistic update - add message immediately to UI
      const optimisticMessage: MessageType = {
        id: `temp-${Date.now()}`,
        text,
        sender: "You",
        timestamp: new Date(),
        isSent: true,
        image,
        readBy: []
      };
      setMessages(prev => [...prev, optimisticMessage]);

      // Send to database
      const { error } = await supabase
        .from('messages')
        .insert({
          group_id: group.id,
          sender_id: user.id,
          text,
          image
        });

      if (error) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        throw error;
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || "Failed to send message");
    }
  };

  return (
    <div className="flex flex-col h-full sm:h-[calc(100vh-4rem)] bg-chat-bg">
      <EditGroupDialog
        open={isEditGroupOpen}
        onOpenChange={setIsEditGroupOpen}
        groupId={group?.id || ''}
        currentName={groupData?.name || groupName || ''}
        onGroupUpdated={handleGroupUpdated}
      />
      
      <header className="bg-chat-header text-primary-foreground px-3 sm:px-4 py-3 shadow-md flex items-center gap-2 sm:gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary/20 h-8 w-8 sm:h-10 sm:w-10"
          onClick={() => navigate("/groups")}
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        
        <Avatar 
          className="h-8 w-8 sm:h-10 sm:w-10 shrink-0" 
          style={{ backgroundColor: groupData?.color || group?.color || "hsl(173, 80%, 40%)" }}
        >
          <AvatarFallback className="bg-transparent text-white">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <h2 className="font-bold text-sm sm:text-base truncate">{groupData?.name || groupName}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground hover:bg-primary/20"
              onClick={() => setIsEditGroupOpen(true)}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
          {group?.id && !group.id.startsWith('static-') ? (
            <OnlineUsersIndicator groupId={group.id} />
          ) : (
            <p className="text-xs opacity-90">{group?.members || 0} members</p>
          )}
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary/20 h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex"
          >
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary/20 h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex"
          >
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary/20 h-8 w-8 sm:h-10 sm:w-10"
          >
            <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </header>

      <MessageList 
        messages={messages}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
      />
      <MessageInput onSendMessage={handleSendMessage} groupId={group?.id} />
    </div>
  );
};

export default GroupChat;