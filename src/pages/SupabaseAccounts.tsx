import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";
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

interface SupabaseAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  user_id: string;
  created_at: string;
}

const DEFAULT_USER_ID = "73a85202-b748-4af6-b67a-b8e2c4256116";

const SupabaseAccounts = () => {
  const [accounts, setAccounts] = useState<SupabaseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SupabaseAccount | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<SupabaseAccount | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from("supabase_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load accounts");
      return;
    }

    setAccounts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();

    const channel = supabase
      .channel("supabase-accounts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "supabase_accounts",
        },
        () => {
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const userStr = localStorage.getItem("user");
    const userId = userStr ? JSON.parse(userStr).id : DEFAULT_USER_ID;

    if (editingAccount) {
      const { error } = await supabase
        .from("supabase_accounts")
        .update({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        })
        .eq("id", editingAccount.id);

      if (error) {
        toast.error("Failed to update account");
        return;
      }

      toast.success("Account updated successfully");
    } else {
      const { error } = await supabase.from("supabase_accounts").insert({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        user_id: userId,
      });

      if (error) {
        toast.error("Failed to create account");
        return;
      }

      toast.success("Account created successfully");
    }

    setIsDialogOpen(false);
    setEditingAccount(null);
    setFormData({ name: "", email: "", password: "" });
  };

  const handleEdit = (account: SupabaseAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      email: account.email,
      password: account.password,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;

    const { error } = await supabase
      .from("supabase_accounts")
      .delete()
      .eq("id", accountToDelete.id);

    if (error) {
      toast.error("Failed to delete account");
      return;
    }

    toast.success("Account deleted successfully");

    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  return (
    <>
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6 flex-col sm:flex-row">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Supabase Accounts</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your database connections and accounts
          </p>
        </div>
      </div>
      <Tabs defaultValue="accounts" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <Button
            onClick={() => {
              setEditingAccount(null);
              setFormData({ name: "", email: "", password: "" });
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>

        <TabsContent value="accounts" className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading accounts...</p>
          ) : accounts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No accounts yet. Click "Add Account" to create one.
                </p>
              </CardContent>
            </Card>
          ) : (
            accounts.map((account) => (
              <Card key={account.id} className="hover:shadow-lg transition-all hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Database className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <CardTitle className="font-bold text-base sm:text-lg">{account.name}</CardTitle>
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                          <p className="text-sm font-medium truncate">{account.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Password</p>
                          <p className="text-sm font-medium">••••••••</p>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(account)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setAccountToDelete(account);
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

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your Supabase account settings here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings content coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Edit Account" : "Create New Account"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Production Project"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="prod@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAccount ? "Update" : "Create"}
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
              This will permanently delete "{accountToDelete?.name}". This action cannot be undone.
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

export default SupabaseAccounts;