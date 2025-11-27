import { useState, useRef } from "react";
import { Send, Image, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";

interface MessageInputProps {
  onSendMessage: (text: string, image?: string) => void;
  groupId?: string;
}

export const MessageInput = ({ onSendMessage, groupId }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${groupId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('chat-images')
        .getPublicUrl(data.path);

      return publicUrl.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !imageFile) return;

    setUploading(true);
    
    try {
      let imageUrl: string | undefined;
      
      if (imageFile && groupId) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      } else if (imagePreview) {
        // For static groups without real storage
        imageUrl = imagePreview;
      }

      onSendMessage(message.trim(), imageUrl);
      setMessage("");
      setImagePreview(null);
      setImageFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setUploading(false);
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
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
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
            disabled={uploading}
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
          disabled={uploading}
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
          disabled={uploading}
        />

        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !imagePreview) || uploading}
          size="icon"
          className="flex-shrink-0 bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 h-9 w-9 sm:h-10 sm:w-10"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          ) : (
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};