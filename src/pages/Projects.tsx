import { useState, useEffect } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { MessageType } from "@/components/Message";
import { FolderKanban, MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  user_id: string;
  created_at: string;
}

const DEFAULT_USER_ID = "73a85202-b748-4af6-b67a-b8e2c4256116";

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load projects");
      return;
    }

    setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel("projects-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    const userStr = localStorage.getItem("user");
    const userId = userStr ? JSON.parse(userStr).id : DEFAULT_USER_ID;

    if (editingProject) {
      const { error } = await supabase
        .from("projects")
        .update({
          name: formData.name,
          description: formData.description || null,
        })
        .eq("id", editingProject.id);

      if (error) {
        toast.error("Failed to update project");
        return;
      }

      toast.success("Project updated successfully");
    } else {
      const { error } = await supabase.from("projects").insert({
        name: formData.name,
        description: formData.description || null,
        user_id: userId,
        status: "ongoing",
      });

      if (error) {
        toast.error("Failed to create project");
        return;
      }

      toast.success("Project created successfully");
    }

    setIsDialogOpen(false);
    setEditingProject(null);
    setFormData({ name: "", description: "" });
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectToDelete.id);

    if (error) {
      toast.error("Failed to delete project");
      return;
    }

    toast.success("Project deleted successfully");

    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finished":
        return "bg-green-500/10 text-green-700 hover:bg-green-500/20";
      case "ongoing":
        return "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20";
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Projects</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track and manage your projects
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProject(null);
            setFormData({ name: "", description: "" });
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading projects...</p>
      ) : projects.length === 0 ? (
        <Card>
          <CardHeader>
            <p className="text-center text-muted-foreground">
              No projects yet. Click "New Project" to create one.
            </p>
          </CardHeader>
        </Card>
      ) : (
        projects.map((project) => (
          <Card
            key={project.id}
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
                      <CardTitle className="font-bold text-base sm:text-lg truncate">
                        {project.name}
                      </CardTitle>
                      <Badge
                        className={`${getStatusColor(project.status)} font-bold w-fit text-xs capitalize`}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <CardDescription className="font-semibold text-sm">
                      {project.description || "No description"}
                    </CardDescription>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(project);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
          </Card>
        ))
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter project name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter project description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingProject ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{projectToDelete?.name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Projects;