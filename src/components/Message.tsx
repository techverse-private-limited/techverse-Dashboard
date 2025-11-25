import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface MessageType {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isSent: boolean;
  image?: string;
  readBy?: string[];
}

interface MessageProps {
  message: MessageType;
  onEdit?: (messageId: string, newText: string) => void;
  onDelete?: (messageId: string) => void;
}

export const Message = ({ message, onEdit, onDelete }: MessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActions]);
  const formattedTime = message.timestamp.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(message.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(message.text);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
    setShowActions(false);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <div
      ref={messageRef}
      className={cn(
        "flex gap-2 sm:gap-3 mb-3 sm:mb-4 message-enter",
        message.isSent ? "flex-row-reverse" : "flex-row"
      )}
    >
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!message.isSent && (
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender}`} />
          <AvatarFallback>{message.sender[0]}</AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={cn(
          "flex flex-col max-w-[80%] sm:max-w-[70%]",
          message.isSent ? "items-end" : "items-start"
        )}
      >
        {!message.isSent && (
          <span className="text-xs font-medium text-muted-foreground mb-1 px-2">
            {message.sender}
          </span>
        )}
        
        <div className="relative group">
          <div
            className={cn(
              "rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm transition-all hover:shadow-md cursor-pointer",
              message.isSent
                ? "bg-chat-sent text-primary-foreground rounded-tr-sm"
                : "bg-chat-received text-foreground rounded-tl-sm border border-border"
            )}
            onClick={() => message.isSent && setShowActions(!showActions)}
          >
            {message.image && (
              <img
                src={message.image}
                alt="Uploaded content"
                className="rounded-lg mb-2 max-w-full h-auto image-preview-enter"
              />
            )}
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveEdit}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              message.text && <p className="text-sm sm:text-base leading-relaxed break-words">{message.text}</p>
            )}
          </div>
          
          {message.isSent && showActions && !isEditing && (
            <div className="absolute -top-8 right-0 flex gap-1 bg-background border border-border rounded-md shadow-lg p-1 z-10">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => {
                  setIsEditing(true);
                  setShowActions(false);
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-muted-foreground">
            {formattedTime}
          </span>
          {message.isSent && message.readBy && message.readBy.length > 0 && (
            <span className="text-xs text-primary">
              ✓✓ {message.readBy.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
