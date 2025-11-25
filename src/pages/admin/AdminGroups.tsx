import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Group {
  id: string;
  name: string;
  color: string;
  created_at: string;
  created_by: string | null;
}

interface User {
  id: string;
  name: string;
  username: string;
  designation: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  joined_at: string;
  users?: User;
}

export default function AdminGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [membersDialog, setMembersDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({ name: "", color: "hsl(173, 80%, 40%)" });
  const [users, setUsers] = useState<User[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
    fetchUsers();

    const channel = supabase
      .channel('groups-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
        fetchGroups();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => {
        if (membersDialog && selectedGroup) {
          fetchGroupMembers(selectedGroup.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [membersDialog, selectedGroup]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      // Fetch user details for each member
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', userIds);

        if (usersError) throw usersError;

        // Combine members with user data
        const membersWithUsers = membersData.map(member => ({
          ...member,
          users: usersData?.find(u => u.id === member.user_id)
        }));

        setGroupMembers(membersWithUsers);
      } else {
        setGroupMembers([]);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedGroup) {
        const { error } = await supabase
          .from('groups')
          .update(formData)
          .eq('id', selectedGroup.id);
        if (error) throw error;
        toast({ title: "Success", description: "Group updated successfully" });
      } else {
        const { error } = await supabase
          .from('groups')
          .insert([formData]);
        if (error) throw error;
        toast({ title: "Success", description: "Group created successfully" });
      }
      setShowDialog(false);
      setFormData({ name: "", color: "hsl(173, 80%, 40%)" });
      setSelectedGroup(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', selectedGroup.id);
      if (error) throw error;
      toast({ title: "Success", description: "Group deleted successfully" });
      setDeleteDialog(false);
      setSelectedGroup(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (group: Group) => {
    setSelectedGroup(group);
    setFormData({ name: group.name, color: group.color });
    setShowDialog(true);
  };

  const openAddDialog = () => {
    setSelectedGroup(null);
    setFormData({ name: "", color: "hsl(173, 80%, 40%)" });
    setShowDialog(true);
  };

  const openMembersDialog = async (group: Group) => {
    setSelectedGroup(group);
    await fetchGroupMembers(group.id);
    setMembersDialog(true);
  };

  const addMemberToGroup = async () => {
    if (!selectedGroup || !selectedUserId) return;
    
    try {
      const { error } = await supabase
        .from('group_members')
        .insert([{ group_id: selectedGroup.id, user_id: selectedUserId }]);
      
      if (error) throw error;
      
      toast({ title: "Success", description: "User added to group" });
      setSelectedUserId("");
      await fetchGroupMembers(selectedGroup.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const removeMemberFromGroup = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      
      toast({ title: "Success", description: "User removed from group" });
      if (selectedGroup) {
        await fetchGroupMembers(selectedGroup.id);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getAvailableUsers = () => {
    const memberUserIds = groupMembers.map(m => m.user_id);
    return users.filter(u => !memberUserIds.includes(u.id));
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Groups Management</h1>
          <p className="text-sm text-muted-foreground">Manage all chat groups</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Group
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No groups found</TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: group.color }} />
                      {group.color}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(group.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openMembersDialog(group)} className="gap-2">
                      <Users className="h-4 w-4" />
                      Manage
                    </Button>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(group)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedGroup(group); setDeleteDialog(true); }}>
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
            <DialogTitle>{selectedGroup ? "Edit Group" : "Add Group"}</DialogTitle>
            <DialogDescription>
              {selectedGroup ? "Update group information" : "Create a new group"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Group Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input id="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
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
              This will permanently delete the group and all its messages. This action cannot be undone.
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

      <Dialog open={membersDialog} onOpenChange={setMembersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Group Members - {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              Add or remove users from this group
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a user to add" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableUsers().map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addMemberToGroup} disabled={!selectedUserId}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="border rounded-lg">
              <div className="p-4">
                <h3 className="font-semibold mb-3">Current Members ({groupMembers.length})</h3>
                {groupMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members in this group yet</p>
                ) : (
                  <div className="space-y-2">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{member.users?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              @{member.users?.username} • {member.users?.designation}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMemberFromGroup(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
