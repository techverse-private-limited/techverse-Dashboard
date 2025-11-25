import { useEffect, useRef } from "react";
import { Message, MessageType } from "./Message";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: MessageType[];
  onEditMessage?: (messageId: string, newText: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export const MessageList = ({ messages, onEditMessage, onDeleteMessage }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 px-3 sm:px-6 py-3 sm:py-4">
      <div className="space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-center text-sm sm:text-base px-4">
              No messages yet. Start a conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <Message 
              key={message.id} 
              message={message}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};
