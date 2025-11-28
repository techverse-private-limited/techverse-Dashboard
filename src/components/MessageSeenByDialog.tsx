import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Check, CheckCheck } from "lucide-react";

interface SeenByUser {
  id: string;
  username: string;
  read_at: string;
}

interface MessageSeenByDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  readByIds: string[];
}

export const MessageSeenByDialog = ({
  open,
  onOpenChange,
  messageId,
  readByIds,
}: MessageSeenByDialogProps) => {
  const [seenByUsers, setSeenByUsers] = useState<SeenByUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && readByIds.length > 0) {
      fetchSeenByUsers();
    }
  }, [open, readByIds]);

  const fetchSeenByUsers = async () => {
    setLoading(true);
    try {
      // Get user details for each reader
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username')
        .in('id', readByIds);

      if (usersError) throw usersError;

      // Get read timestamps
      const { data: reads, error: readsError } = await supabase
        .from('message_reads')
        .select('user_id, read_at')
        .eq('message_id', messageId);

      if (readsError) throw readsError;

      const seenBy: SeenByUser[] = (users || []).map(user => {
        const readInfo = reads?.find(r => r.user_id === user.id);
        return {
          id: user.id,
          username: user.username,
          read_at: readInfo?.read_at || '',
        };
      });

      setSeenByUsers(seenBy);
    } catch (error) {
      console.error('Error fetching seen by users:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatReadTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCheck className="h-5 w-5 text-primary" />
            Seen by
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : seenByUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No one has seen this message yet
            </p>
          ) : (
            seenByUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  />
                  <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatReadTime(user.read_at)}
                  </p>
                </div>
                <Check className="h-4 w-4 text-primary" />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
