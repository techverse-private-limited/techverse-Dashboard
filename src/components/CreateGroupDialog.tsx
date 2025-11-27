import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: () => void;
}

const colorOptions = [
  { name: "Teal", value: "hsl(173, 80%, 40%)" },
  { name: "Blue", value: "hsl(210, 100%, 50%)" },
  { name: "Purple", value: "hsl(280, 80%, 50%)" },
  { name: "Orange", value: "hsl(30, 90%, 50%)" },
  { name: "Green", value: "hsl(140, 80%, 40%)" },
  { name: "Red", value: "hsl(0, 80%, 55%)" },
  { name: "Pink", value: "hsl(330, 80%, 60%)" },
  { name: "Yellow", value: "hsl(45, 100%, 50%)" },
];

export function CreateGroupDialog({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user from localStorage (custom auth)
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        toast.error("You must be logged in to create a group");
        return;
      }
      
      const user = JSON.parse(userStr);

      // Create the group
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName.trim(),
          color: selectedColor,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the creator as a member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: user.id
        });

      if (memberError) throw memberError;

      toast.success(`Group "${groupName}" created successfully!`);

      // Reset form
      setGroupName("");
      setSelectedColor(colorOptions[0].value);
      onOpenChange(false);
      
      // Notify parent to refresh
      if (onGroupCreated) {
        onGroupCreated();
      }
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error("Failed to create group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a new group to start collaborating with your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label>Group Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      selectedColor === color.value
                        ? "border-primary scale-105 shadow-lg"
                        : "border-border hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
