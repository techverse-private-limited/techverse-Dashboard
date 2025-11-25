import { useState } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { MessageType } from "@/components/Message";

const Index = () => {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: "1",
      text: "Hey everyone! Welcome to the team chat 👋",
      sender: "Alex",
      timestamp: new Date(Date.now() - 3600000),
      isSent: false,
    },
    {
      id: "2",
      text: "Hi Alex! Great to be here!",
      sender: "You",
      timestamp: new Date(Date.now() - 3500000),
      isSent: true,
    },
    {
      id: "3",
      text: "Looking forward to collaborating with everyone!",
      sender: "Sarah",
      timestamp: new Date(Date.now() - 3400000),
      isSent: false,
    },
  ]);

  const handleSendMessage = (text: string, image?: string) => {
    const newMessage: MessageType = {
      id: Date.now().toString(),
      text,
      sender: "You",
      timestamp: new Date(),
      isSent: true,
      image,
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="flex flex-col h-screen bg-chat-bg">
      <ChatHeader />
      <MessageList messages={messages} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Index;
