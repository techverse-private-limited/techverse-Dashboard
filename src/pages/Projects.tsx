import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { MessageType } from "@/components/Message";
import { FolderKanban, MoreVertical } from "lucide-react";

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);

  const handleProjectClick = (projectName: string) => {
    setSelectedProject(projectName);
    setMessages([
      {
        id: "1",
        text: `Welcome to ${projectName} chat! Ask me anything about this project.`,
        sender: "Project Assistant",
        timestamp: new Date(),
        isSent: false,
      },
    ]);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setMessages([]);
  };

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

    // Simulate bot response
    setTimeout(() => {
      const botResponse: MessageType = {
        id: (Date.now() + 1).toString(),
        text: "I received your message about the project. How can I help you further?",
        sender: "Project Assistant",
        timestamp: new Date(),
        isSent: false,
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };
  const projects = [
    { name: "Website Redesign", status: "In Progress", team: "Design Team", progress: 65 },
    { name: "Mobile App", status: "Planning", team: "Development", progress: 20 },
    { name: "Marketing Campaign", status: "In Progress", team: "Marketing", progress: 80 },
    { name: "API Integration", status: "Completed", team: "Development", progress: 100 },
    { name: "Customer Portal", status: "In Progress", team: "Product", progress: 45 },
    { name: "Analytics Dashboard", status: "Planning", team: "Development", progress: 10 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/10 text-green-700 hover:bg-green-500/20";
      case "In Progress":
        return "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20";
      case "Planning":
        return "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20";
    }
  };

  if (selectedProject) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBackToProjects}>
          ← Back to Projects
        </Button>
        <div className="h-[calc(100vh-12rem)] flex flex-col border rounded-lg bg-card">
          <div className="border-b p-4">
            <h2 className="text-xl font-bold">{selectedProject}</h2>
            <p className="text-sm text-muted-foreground">Project Chat</p>
          </div>
          <MessageList messages={messages} />
          <MessageInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card 
          key={project.name} 
          className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50"
          onClick={() => handleProjectClick(project.name)}
        >
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                    <CardTitle className="font-bold text-base sm:text-lg truncate">{project.name}</CardTitle>
                    <Badge className={`${getStatusColor(project.status)} font-bold w-fit text-xs`}>
                      {project.status}
                    </Badge>
                  </div>
                  <CardDescription className="font-semibold text-sm">{project.team}</CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
                <div className="space-y-1 flex-1 sm:min-w-[180px] lg:min-w-[200px]">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-muted-foreground">Progress</span>
                    <span className="font-bold">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

export default Projects;
