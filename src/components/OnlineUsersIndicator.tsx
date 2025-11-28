import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Circle } from "lucide-react";

interface OnlineUser {
  id: string;
  username: string;
  online_at: string;
}

interface OnlineUsersIndicatorProps {
  groupId: string;
}

export const OnlineUsersIndicator = ({ groupId }: OnlineUsersIndicatorProps) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr || !groupId) return;

    const user = JSON.parse(userStr);
    setCurrentUserId(user.id);

    // Create presence channel for this group
    const channel = supabase.channel(`presence-${groupId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          presences.forEach(presence => {
            users.push({
              id: presence.user_id,
              username: presence.username,
              online_at: presence.online_at,
            });
          });
        });
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            user_id: user.id,
            username: user.username || user.name,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const otherOnlineUsers = onlineUsers.filter(u => u.id !== currentUserId);
  const onlineCount = otherOnlineUsers.length;

  if (onlineCount === 0) {
    return (
      <span className="text-xs opacity-90">No one else online</span>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
          <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
          <span className="text-xs opacity-90">
            {onlineCount} {onlineCount === 1 ? 'member' : 'members'} online
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">
            Online Now
          </p>
          {otherOnlineUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  />
                  <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500 border-2 border-background rounded-full" />
              </div>
              <span className="text-sm font-medium truncate">{user.username}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
