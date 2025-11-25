import { useState, useRef } from "react";
import { Send, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (text: string, image?: string) => void;
}

export const MessageInput = ({ onSendMessage }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() || imagePreview) {
      onSendMessage(message.trim(), imagePreview || undefined);
      setMessage("");
      setImagePreview(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="sticky bottom-0 border-t border-border bg-card px-3 sm:px-6 py-2 sm:py-4 shrink-0">
      {imagePreview && (
        <div className="mb-2 sm:mb-3 relative inline-block image-preview-enter">
          <img
            src={imagePreview}
            alt="Preview"
            className="rounded-lg max-h-24 sm:max-h-32 object-cover border-2 border-primary"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors shadow-lg"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 hover:bg-muted h-9 w-9 sm:h-10 sm:w-10"
        >
          <Image className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className={cn(
            "flex-1 min-h-[40px] sm:min-h-[44px] max-h-32 resize-none text-sm sm:text-base",
            "focus-visible:ring-primary transition-all"
          )}
          rows={1}
        />

        <Button
          onClick={handleSend}
          disabled={!message.trim() && !imagePreview}
          size="icon"
          className="flex-shrink-0 bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 h-9 w-9 sm:h-10 sm:w-10"
        >
          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  );
};
