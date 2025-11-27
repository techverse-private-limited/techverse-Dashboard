import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, MoreVertical, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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

interface GitHubLink {
  id: string;
  name: string;
  url: string;
  description: string | null;
  user_id: string | null;
  created_at: string;
}

const GitHubLinks = () => {
  const [links, setLinks] = useState<GitHubLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<GitHubLink | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<GitHubLink | null>(null);
  const [formData, setFormData] = useState({ name: "", url: "", description: "" });

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from("github_links")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load GitHub links",
        variant: "destructive",
      });
      return;
    }

    setLinks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();

    const channel = supabase
      .channel("github-links-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "github_links",
        },
        () => {
          fetchLinks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.url.trim()) {
      toast({
        title: "Error",
        description: "Please fill in name and URL",
        variant: "destructive",
      });
      return;
    }

    const userStr = localStorage.getItem("user");
    const userId = userStr ? JSON.parse(userStr).id : null;

    if (editingLink) {
      const { error } = await supabase
        .from("github_links")
        .update({
          name: formData.name,
          url: formData.url,
          description: formData.description || null,
        })
        .eq("id", editingLink.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update link",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Link updated successfully",
      });
    } else {
      const { error } = await supabase.from("github_links").insert({
        name: formData.name,
        url: formData.url,
        description: formData.description || null,
        user_id: userId,
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create link",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Link created successfully",
      });
    }

    setIsDialogOpen(false);
    setEditingLink(null);
    setFormData({ name: "", url: "", description: "" });
  };

  const handleEdit = (link: GitHubLink) => {
    setEditingLink(link);
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!linkToDelete) return;

    const { error } = await supabase
      .from("github_links")
      .delete()
      .eq("id", linkToDelete.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Link deleted successfully",
    });

    setDeleteDialogOpen(false);
    setLinkToDelete(null);
  };

  return (
    <>
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6 flex-col sm:flex-row">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">GitHub Links</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Connect and manage your GitHub repositories
          </p>
        </div>
      </div>
      <Tabs defaultValue="repositories" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="repositories">Repositories</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <Button
            onClick={() => {
              setEditingLink(null);
              setFormData({ name: "", url: "", description: "" });
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>

        <TabsContent value="repositories" className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading links...</p>
          ) : links.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No GitHub links yet. Click "Add Link" to create one.
                </p>
              </CardContent>
            </Card>
          ) : (
            links.map((link) => (
              <Card key={link.id} className="hover:shadow-lg transition-all hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Github className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <CardTitle className="font-bold text-base sm:text-lg">{link.name}</CardTitle>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">GitHub Link</p>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline truncate flex items-center gap-1"
                        >
                          {link.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {link.description && (
                        <p className="text-sm text-muted-foreground">{link.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(link)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setLinkToDelete(link);
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
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>View recent commits and repository activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Activity feed coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Edit GitHub Link" : "Add GitHub Link"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Repository Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., frontend-app"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">GitHub URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://github.com/username/repo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the repository"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingLink ? "Update" : "Add"}
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
              This will permanently delete "{linkToDelete?.name}". This action cannot be undone.
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
    </>
  );
};

export default GitHubLinks;
