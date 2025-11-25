import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface GitHubLink {
  id: string;
  name: string;
  url: string;
  description: string | null;
  user_id: string | null;
  created_at: string;
}

export default function AdminGitHubLinks() {
  const [links, setLinks] = useState<GitHubLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedLink, setSelectedLink] = useState<GitHubLink | null>(null);
  const [formData, setFormData] = useState({ name: "", url: "", description: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();

    const channel = supabase
      .channel('github-links-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'github_links' }, () => {
        fetchLinks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('github_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedLink) {
        const { error } = await supabase
          .from('github_links')
          .update(formData)
          .eq('id', selectedLink.id);
        if (error) throw error;
        toast({ title: "Success", description: "Link updated successfully" });
        await fetchLinks();
      } else {
        const { error } = await supabase
          .from('github_links')
          .insert([formData]);
        if (error) throw error;
        toast({ title: "Success", description: "Link created successfully" });
        await fetchLinks();
      }
      setShowDialog(false);
      setFormData({ name: "", url: "", description: "" });
      setSelectedLink(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedLink) return;
    try {
      const { error } = await supabase
        .from('github_links')
        .delete()
        .eq('id', selectedLink.id);
      if (error) throw error;
      toast({ title: "Success", description: "Link deleted successfully" });
      await fetchLinks();
      setDeleteDialog(false);
      setSelectedLink(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (link: GitHubLink) => {
    setSelectedLink(link);
    setFormData({ name: link.name, url: link.url, description: link.description });
    setShowDialog(true);
  };

  const openAddDialog = () => {
    setSelectedLink(null);
    setFormData({ name: "", url: "", description: "" });
    setShowDialog(true);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">GitHub Links Management</h1>
          <p className="text-sm text-muted-foreground">Manage GitHub repository links</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Link
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No GitHub links found</TableCell>
              </TableRow>
            ) : (
              links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.name}</TableCell>
                  <TableCell>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      {link.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>{link.description || "—"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(link)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedLink(link); setDeleteDialog(true); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLink ? "Edit GitHub Link" : "Add GitHub Link"}</DialogTitle>
            <DialogDescription>
              {selectedLink ? "Update link information" : "Create a new GitHub repository link"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Repository Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="my-awesome-project" />
            </div>
            <div>
              <Label htmlFor="url">GitHub URL</Label>
              <Input id="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://github.com/username/repo" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Project description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the GitHub link. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
