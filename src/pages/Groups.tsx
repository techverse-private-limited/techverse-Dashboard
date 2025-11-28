import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";

interface Group {
  id: string;
  name: string;
  color: string;
  members: number;
  lastMessage?: string;
  lastMessageTime?: string;
  time?: string;
  unread?: number;
}

const Groups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchGroups();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups'
        },
        () => {
          fetchGroups();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchGroups();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reads'
        },
        () => {
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGroups = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        setGroups([]);
        return;
      }
      const user = JSON.parse(userStr);

      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (membersError) throw membersError;

      if (!groupMembers || groupMembers.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = groupMembers.map(gm => gm.group_id);

      // Fetch all data in parallel for better performance
      const [groupsResult, memberCountsResult, lastMessagesResult, unreadMessagesResult, readsResult] = await Promise.all([
        supabase.from('groups').select('*').in('id', groupIds).order('created_at', { ascending: false }),
        supabase.from('group_members').select('group_id').in('group_id', groupIds),
        supabase.from('messages').select('group_id, text, created_at').in('group_id', groupIds).order('created_at', { ascending: false }),
        supabase.from('messages').select('id, group_id').in('group_id', groupIds).neq('sender_id', user.id),
        supabase.from('message_reads').select('message_id').eq('user_id', user.id)
      ]);

      if (groupsResult.error) throw groupsResult.error;

      // Process data efficiently
      const memberCounts = new Map<string, number>();
      memberCountsResult.data?.forEach(m => {
        memberCounts.set(m.group_id, (memberCounts.get(m.group_id) || 0) + 1);
      });

      const lastMessages = new Map<string, { text: string; created_at: string }>();
      lastMessagesResult.data?.forEach(m => {
        if (!lastMessages.has(m.group_id)) {
          lastMessages.set(m.group_id, { text: m.text || '', created_at: m.created_at });
        }
      });

      const readMessageIds = new Set(readsResult.data?.map(r => r.message_id) || []);
      const unreadCounts = new Map<string, number>();
      unreadMessagesResult.data?.forEach(m => {
        if (!readMessageIds.has(m.id)) {
          unreadCounts.set(m.group_id, (unreadCounts.get(m.group_id) || 0) + 1);
        }
      });

      const groupsWithDetails = (groupsResult.data || []).map(group => ({
        id: group.id,
        name: group.name,
        color: group.color,
        members: memberCounts.get(group.id) || 0,
        lastMessage: lastMessages.get(group.id)?.text,
        lastMessageTime: lastMessages.get(group.id)?.created_at,
        unread: unreadCounts.get(group.id) || 0
      }));

      setGroups(groupsWithDetails);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      toast.error("Failed to load groups");
      setGroups([]);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6 flex-col sm:flex-row">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Groups</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Your team conversations</p>
        </div>
        <Button 
          className="gap-2 font-bold flex-shrink-0" 
          size="sm"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Group</span>
        </Button>
      </div>

      <CreateGroupDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onGroupCreated={fetchGroups}
      />
      
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 h-[calc(100vh-10rem)]">
          <div className="divide-y">
            {groups.map((group) => (
            <div 
              key={group.id} 
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-message-hover transition-colors cursor-pointer"
              onClick={() => navigate(`/groups/${encodeURIComponent(group.name)}`, { state: { group } })}
            >
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0" style={{ backgroundColor: group.color }}>
                <AvatarFallback className="bg-transparent text-white">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm sm:text-base truncate">{group.name}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(group.lastMessageTime || group.time)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate flex-1">
                    {group.lastMessage}
                  </p>
                  {group.unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center flex-shrink-0">
                      {group.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{group.members} members</p>
              </div>
            </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default Groups;
