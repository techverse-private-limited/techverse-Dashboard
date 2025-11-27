import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Copy, Edit, Trash2, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  name: string;
}

interface ProjectCredential {
  id: string;
  project_id: string;
  username: string;
  password: string;
  description: string | null;
  created_at: string;
}

interface GroupedCredentials {
  project: Project;
  credentials: ProjectCredential[];
}

export default function Settings() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [credentials, setCredentials] = useState<ProjectCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<ProjectCredential | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    description: ""
  });
  const navigate = useNavigate();

  const fetchData = async () => {
    const [projectsResult, credentialsResult] = await Promise.all([
      supabase.from("projects").select("id, name").order("name"),
      supabase.from("project_credentials").select("*").order("created_at", { ascending: false })
    ]);

    if (projectsResult.error) {
      toast.error("Failed to load projects");
    }

    if (credentialsResult.error) {
      toast.error("Failed to load credentials");
    }

    setProjects(projectsResult.data || []);
    setCredentials(credentialsResult.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("credentials-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_credentials",
        },
        () => {
          fetchData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProjectId || !formData.username.trim() || !formData.password.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingCredential) {
      const { error } = await supabase
        .from("project_credentials")
        .update({
          project_id: selectedProjectId,
          username: formData.username,
          password: formData.password,
          description: formData.description || null,
        })
        .eq("id", editingCredential.id);

      if (error) {
        toast.error("Failed to update credential");
        return;
      }

      toast.success("Credential updated successfully");
    } else {
      const { error } = await supabase
        .from("project_credentials")
        .insert({
          project_id: selectedProjectId,
          username: formData.username,
          password: formData.password,
          description: formData.description || null,
        });

      if (error) {
        toast.error("Failed to create credential");
        return;
      }

      toast.success("Credential added successfully");
    }
    
    setIsCredentialDialogOpen(false);
    resetForm();
  };

  const handleEdit = (credential: ProjectCredential) => {
    setEditingCredential(credential);
    setSelectedProjectId(credential.project_id);
    setFormData({
      username: credential.username,
      password: credential.password,
      description: credential.description || ""
    });
    setIsCredentialDialogOpen(true);
  };

  const handleDelete = async (credentialId: string) => {
    const { error } = await supabase
      .from("project_credentials")
      .delete()
      .eq("id", credentialId);

    if (error) {
      toast.error("Failed to delete credential");
      return;
    }

    toast.success("Credential removed successfully");
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      description: ""
    });
    setEditingCredential(null);
    setSelectedProjectId("");
  };

  // Group credentials by project
  const groupedCredentials: GroupedCredentials[] = projects
    .map(project => ({
      project,
      credentials: credentials.filter(c => c.project_id === project.id)
    }))
    .filter(group => group.credentials.length > 0);

  const filteredGroups = groupedCredentials.filter(group =>
    group.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.credentials.some(c => 
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6 flex-col sm:flex-row">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Password Manager</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Securely store and manage project login credentials
          </p>
        </div>
        <Button 
          className="gap-2 font-bold flex-shrink-0" 
          size="sm"
          onClick={() => {
            resetForm();
            setIsCredentialDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Credential</span>
        </Button>
      </div>

      <Dialog open={isCredentialDialogOpen} onOpenChange={(open) => {
        setIsCredentialDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCredential ? "Edit" : "Add"} Credential</DialogTitle>
            <DialogDescription>
              {editingCredential ? "Update" : "Add"} login credentials for a project
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="project">Project *</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No projects available. Create a project first.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username/Email *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCredentialDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={projects.length === 0}>
                {editingCredential ? "Update" : "Add"} Credential
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="w-full space-y-4 sm:space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No credentials found matching your search" : "No credentials saved yet"}
              </p>
              {!searchQuery && projects.length > 0 && (
                <Button onClick={() => setIsCredentialDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Credential
                </Button>
              )}
              {!searchQuery && projects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Create a project first to add credentials.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-3 sm:space-y-4">
            {filteredGroups.map((group) => (
              <AccordionItem 
                key={group.project.id} 
                value={group.project.id}
                className="border rounded-lg bg-card hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="px-3 sm:px-6 py-3 sm:py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2 sm:pr-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-left">
                        <h3 className="text-base sm:text-lg font-bold">{group.project.name}</h3>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2 sm:ml-4 text-xs">
                      {group.credentials.length} {group.credentials.length === 1 ? 'credential' : 'credentials'}
                    </Badge>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-3 sm:px-6 pb-3 sm:pb-4">
                  <div className="space-y-3 pt-2">
                    {group.credentials.map((credential) => (
                      <Card key={credential.id} className="bg-muted/50">
                        <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                          <div className="flex items-start justify-between">
                            {credential.description && (
                              <Badge variant="outline" className="mb-2 text-xs">
                                {credential.description}
                              </Badge>
                            )}
                            <div className="flex gap-1 sm:gap-2 ml-auto">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => handleEdit(credential)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => handleDelete(credential.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-2 sm:p-3 bg-background rounded-lg gap-2">
                            <div className="space-y-1 flex-1 min-w-0">
                              <Label className="text-xs text-muted-foreground">Username</Label>
                              <p className="font-mono text-xs sm:text-sm truncate">{credential.username}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={() => copyToClipboard(credential.username, "Username")}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between p-2 sm:p-3 bg-background rounded-lg gap-2">
                            <div className="space-y-1 flex-1 min-w-0">
                              <Label className="text-xs text-muted-foreground">Password</Label>
                              <p className="font-mono text-xs sm:text-sm truncate">
                                {visiblePasswords.has(credential.id) ? credential.password : "••••••••••••"}
                              </p>
                            </div>
                            <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => togglePasswordVisibility(credential.id)}
                              >
                                {visiblePasswords.has(credential.id) ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyToClipboard(credential.password, "Password")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </>
  );
}
