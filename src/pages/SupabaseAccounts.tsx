import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CreateSupabaseAccountDialog } from "@/components/CreateSupabaseAccountDialog";
import { EditSupabaseAccountDialog } from "@/components/EditSupabaseAccountDialog";
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
}

const SupabaseAccounts = () => {
  const [accounts, setAccounts] = useState<SupabaseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SupabaseAccount | null>(null);

  const fetchAccounts = async () => {
    // Get user from localStorage (custom auth)
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const user = JSON.parse(userStr);

    const { data, error } = await supabase
      .from("supabase_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
      return;
    }

    setAccounts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();

    const channel = supabase
      .channel("supabase-accounts-changes")
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

  const handleDelete = async () => {
    if (!selectedAccount) return;

    const { error } = await supabase
      .from("supabase_accounts")
      .delete()
      .eq("id", selectedAccount.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Account deleted successfully",
    });

    setDeleteDialogOpen(false);
    setSelectedAccount(null);
  };

  const handleEdit = (account: SupabaseAccount) => {
    setSelectedAccount(account);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (account: SupabaseAccount) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Tabs defaultValue="accounts" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <Button onClick={() => setCreateDialogOpen(true)}>
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
                          onClick={() => handleDeleteClick(account)}
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

      <CreateSupabaseAccountDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onAccountCreated={fetchAccounts}
      />

      {selectedAccount && (
        <EditSupabaseAccountDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          accountId={selectedAccount.id}
          currentName={selectedAccount.name}
          currentEmail={selectedAccount.email}
          currentPassword={selectedAccount.password}
          onAccountUpdated={fetchAccounts}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedAccount?.name}". This action cannot be undone.
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
    </>
  );
};

export default SupabaseAccounts;
