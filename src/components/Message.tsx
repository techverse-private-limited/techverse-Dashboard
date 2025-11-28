import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, X, Check, Download, Eye } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { MessageSeenByDialog } from "./MessageSeenByDialog";

export interface MessageType {
  id: string;
  text: string;
  sender: string;
  senderPhoto?: string;
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
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showSeenByDialog, setShowSeenByDialog] = useState(false);
  const [currentUserPhoto, setCurrentUserPhoto] = useState<string | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user's profile photo for sent messages
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserPhoto(user.profile_photo || null);
    }
  }, []);

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

  const handleDownloadImage = async () => {
    if (!message.image) return;
    
    try {
      const response = await fetch(message.image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${message.id}.${blob.type.split('/')[1] || 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      // Fallback: open in new tab
      window.open(message.image, '_blank');
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowImageDialog(true);
  };

  return (
    <div
      ref={messageRef}
      className={cn(
        "flex gap-2 sm:gap-3 mb-3 sm:mb-4 message-enter",
        message.isSent ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Delete Confirmation Dialog */}
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

      {/* Image Preview Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden" aria-describedby={undefined}>
          <div className="relative">
            <img
              src={message.image}
              alt="Full size"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <Button
                onClick={handleDownloadImage}
                className="bg-primary hover:bg-primary/90 shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Seen By Dialog */}
      <MessageSeenByDialog
        open={showSeenByDialog}
        onOpenChange={setShowSeenByDialog}
        messageId={message.id}
        readByIds={message.readBy || []}
      />

      {/* Avatar for received messages (left side) */}
      {!message.isSent && (
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-primary/20">
          <AvatarImage src={message.senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender}`} />
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            {message.sender[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={cn(
          "flex flex-col max-w-[70%] sm:max-w-[65%]",
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
              <div 
                className="relative group/image cursor-pointer"
                onClick={handleImageClick}
              >
                <img
                  src={message.image}
                  alt="Uploaded content"
                  className="rounded-lg mb-2 max-w-full h-auto max-h-64 object-cover image-preview-enter hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity bg-black/30 rounded-lg">
                  <span className="text-white text-sm font-medium">Click to view</span>
                </div>
              </div>
            )}
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 h-8 text-sm bg-background text-foreground border-background/50"
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
          {message.isSent && (
            message.readBy && message.readBy.length > 0 ? (
              <button
                onClick={() => setShowSeenByDialog(true)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <Eye className="h-3 w-3" />
                <span>Seen by {message.readBy.length}</span>
              </button>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                ✓ Delivered
              </span>
            )
          )}
        </div>
      </div>

      {/* Avatar for sent messages (right side, due to flex-row-reverse) */}
      {message.isSent && (
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-primary/20">
          <AvatarImage src={currentUserPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=You`} />
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            Y
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};