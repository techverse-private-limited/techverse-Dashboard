import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, User, Lock, Eye, EyeOff, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";

interface UserData {
  id: string;
  name: string;
  username: string;
  designation: string;
  password: string;
  profile_photo?: string;
}

const Profile = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    profile_photo: ""
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        setLoading(false);
        return;
      }

      const localUser = JSON.parse(userStr);
      
      // Fetch fresh data from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', localUser.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUser(data as UserData);
        setFormData({
          name: data.name,
          username: data.username,
          password: data.password,
          profile_photo: data.profile_photo || ""
        });
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const photoUrl = urlData.publicUrl;

      // Auto-save photo to database
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_photo: photoUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state and localStorage
      setFormData(prev => ({ ...prev, profile_photo: photoUrl }));
      const updatedUser = { ...user, profile_photo: photoUrl };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Photo uploaded successfully");
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user || !formData.profile_photo) return;

    setUploading(true);
    try {
      // Update database to remove photo
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_photo: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state and localStorage
      setFormData(prev => ({ ...prev, profile_photo: "" }));
      const updatedUser = { ...user, profile_photo: null };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Photo removed successfully");
    } catch (error: any) {
      console.error('Error removing photo:', error);
      toast.error("Failed to remove photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.username.trim()) {
      toast.error("Username is required");
      return;
    }
    if (!formData.password.trim()) {
      toast.error("Password is required");
      return;
    }
    if (formData.password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    setSaving(true);
    try {
      // Check if username is taken by another user
      if (formData.username !== user.username) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', formData.username)
          .neq('id', user.id)
          .maybeSingle();

        if (existingUser) {
          toast.error("Username is already taken");
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name.trim(),
          username: formData.username.trim(),
          password: formData.password,
          profile_photo: formData.profile_photo || null
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local storage
      const updatedUser = {
        ...user,
        name: formData.name.trim(),
        username: formData.username.trim(),
        password: formData.password,
        profile_photo: formData.profile_photo || null
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please login to view your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Profile</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Photo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Photo</CardTitle>
          <CardDescription>Click on the avatar to upload a new photo</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar className="h-32 w-32 border-4 border-primary/20">
              <AvatarImage src={formData.profile_photo} alt={formData.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {formData.name?.charAt(0)?.toUpperCase() || <User className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : (
                <Camera className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Max file size: 2MB</p>
            {formData.profile_photo && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeletePhoto}
                disabled={uploading}
                className="h-7 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username"
            />
          </div>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>Change your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter new password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="w-full gap-2"
        size="lg"
      >
        {saving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Changes
          </>
        )}
      </Button>
    </div>
  );
};

export default Profile;