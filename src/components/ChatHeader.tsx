import { Users, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const ChatHeader = () => {
  return (
    <header className="bg-chat-header text-primary-foreground px-6 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border-2 border-primary-foreground/20">
          <AvatarImage src="https://api.dicebear.com/7.x/shapes/svg?seed=group" />
          <AvatarFallback className="bg-primary-foreground/20">
            <Users className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-lg font-semibold">Team Chat</h1>
          <p className="text-xs text-primary-foreground/80">Online now</p>
        </div>
      </div>
      <button className="p-2 hover:bg-primary-foreground/10 rounded-full transition-colors">
        <MoreVertical className="h-5 w-5" />
      </button>
    </header>
  );
};
