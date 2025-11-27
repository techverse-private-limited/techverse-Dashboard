import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, MoreVertical, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
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
      toast.error("Failed to load GitHub links");
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
      toast.error("Please fill in name and URL");
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
        toast.error("Failed to update link");
        return;
      }

      toast.success("Link updated successfully");
    } else {
      const { error } = await supabase.from("github_links").insert({
        name: formData.name,
        url: formData.url,
        description: formData.description || null,
        user_id: userId,
      });

      if (error) {
        toast.error("Failed to create link");
        return;
      }

      toast.success("Link created successfully");
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
      toast.error("Failed to delete link");
      return;
    }

    toast.success("Link deleted successfully");

    setDeleteDialogOpen(false);
    setLinkToDelete(null);
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="repositories" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="repositories" className="flex-1 sm:flex-none text-xs sm:text-sm">
              Repositories
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 sm:flex-none text-xs sm:text-sm">
              Activity
            </TabsTrigger>
          </TabsList>
          <Button
            size="sm"
            className="w-full sm:w-auto"
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

        <TabsContent value="repositories" className="space-y-3 sm:space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading links...</p>
          ) : links.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground text-sm">
                  No GitHub links yet. Click "Add Link" to create one.
                </p>
              </CardContent>
            </Card>
          ) : (
            links.map((link) => (
              <Card key={link.id} className="hover:shadow-lg transition-all hover:border-primary/50">
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex items-start gap-2 sm:gap-4">
                    <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Github className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                      <CardTitle className="font-bold text-sm sm:text-lg truncate">{link.name}</CardTitle>
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">GitHub Link</p>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm font-medium text-primary hover:underline flex items-center gap-1 truncate max-w-[150px] sm:max-w-none"
                        >
                          <span className="truncate">{link.url}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                      {link.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{link.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border z-50">
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
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
              <CardDescription className="text-xs sm:text-sm">View recent commits and repository activity.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-muted-foreground text-sm">Activity feed coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingLink ? "Edit GitHub Link" : "Add GitHub Link"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-sm">Repository Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., frontend-app"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="url" className="text-sm">GitHub URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://github.com/username/repo"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="description" className="text-sm">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the repository"
                  className="text-sm min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingLink ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently delete "{linkToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GitHubLinks;
