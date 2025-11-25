import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, EyeOff, Copy, Edit, Trash2, Plus, Search, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface LoginCredential {
  id: string;
  username: string;
  password: string;
  notes?: string;
  label?: string;
}

interface WebsitePassword {
  id: string;
  website: string;
  url: string;
  logins: LoginCredential[];
}

export default function Settings() {
  const [websites, setWebsites] = useState<WebsitePassword[]>([
    {
      id: "1",
      website: "GitHub",
      url: "https://github.com",
      logins: [
        {
          id: "1-1",
          username: "user@example.com",
          password: "MySecurePass123!",
          label: "Work Account",
          notes: "Main work GitHub account"
        },
        {
          id: "1-2",
          username: "personal@gmail.com",
          password: "PersonalGH2024!",
          label: "Personal Account",
          notes: "Personal projects"
        }
      ]
    },
    {
      id: "2",
      website: "Gmail",
      url: "https://mail.google.com",
      logins: [
        {
          id: "2-1",
          username: "myemail@gmail.com",
          password: "Gmail2024Secure",
          label: "Personal Email",
          notes: "Main email account"
        }
      ]
    },
    {
      id: "3",
      website: "Supabase",
      url: "https://supabase.com",
      logins: [
        {
          id: "3-1",
          username: "dev@company.com",
          password: "Supabase!2024",
          label: "Production",
          notes: "Production database access"
        },
        {
          id: "3-2",
          username: "dev-staging@company.com",
          password: "SupabaseStaging24!",
          label: "Staging",
          notes: "Staging environment"
        }
      ]
    }
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [isWebsiteDialogOpen, setIsWebsiteDialogOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [editingWebsiteId, setEditingWebsiteId] = useState<string | null>(null);
  const [editingLoginId, setEditingLoginId] = useState<string | null>(null);
  const [currentWebsiteId, setCurrentWebsiteId] = useState<string | null>(null);
  const [websiteFormData, setWebsiteFormData] = useState({
    website: "",
    url: ""
  });
  const [loginFormData, setLoginFormData] = useState({
    username: "",
    password: "",
    label: "",
    notes: ""
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
    }
  }, [navigate]);

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
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleWebsiteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingWebsiteId) {
      setWebsites(prev => prev.map(w => 
        w.id === editingWebsiteId 
          ? { ...w, website: websiteFormData.website, url: websiteFormData.url }
          : w
      ));
      toast({
        title: "Updated!",
        description: "Website updated successfully",
      });
    } else {
      const newWebsite: WebsitePassword = {
        id: Date.now().toString(),
        website: websiteFormData.website,
        url: websiteFormData.url,
        logins: []
      };
      setWebsites(prev => [...prev, newWebsite]);
      toast({
        title: "Added!",
        description: "New website added successfully",
      });
    }
    
    setIsWebsiteDialogOpen(false);
    resetWebsiteForm();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWebsiteId) return;

    if (editingLoginId) {
      setWebsites(prev => prev.map(w => 
        w.id === currentWebsiteId
          ? {
              ...w,
              logins: w.logins.map(l =>
                l.id === editingLoginId ? { ...loginFormData, id: editingLoginId } : l
              )
            }
          : w
      ));
      toast({
        title: "Updated!",
        description: "Login credentials updated successfully",
      });
    } else {
      const newLogin: LoginCredential = {
        id: `${currentWebsiteId}-${Date.now()}`,
        ...loginFormData
      };
      setWebsites(prev => prev.map(w =>
        w.id === currentWebsiteId
          ? { ...w, logins: [...w.logins, newLogin] }
          : w
      ));
      toast({
        title: "Added!",
        description: "New login added successfully",
      });
    }
    
    setIsLoginDialogOpen(false);
    resetLoginForm();
  };

  const handleEditWebsite = (website: WebsitePassword) => {
    setEditingWebsiteId(website.id);
    setWebsiteFormData({
      website: website.website,
      url: website.url
    });
    setIsWebsiteDialogOpen(true);
  };

  const handleEditLogin = (websiteId: string, login: LoginCredential) => {
    setCurrentWebsiteId(websiteId);
    setEditingLoginId(login.id);
    setLoginFormData({
      username: login.username,
      password: login.password,
      label: login.label || "",
      notes: login.notes || ""
    });
    setIsLoginDialogOpen(true);
  };

  const handleAddLogin = (websiteId: string) => {
    setCurrentWebsiteId(websiteId);
    setEditingLoginId(null);
    resetLoginForm();
    setIsLoginDialogOpen(true);
  };

  const handleDeleteWebsite = (id: string) => {
    setWebsites(prev => prev.filter(w => w.id !== id));
    toast({
      title: "Deleted",
      description: "Website and all logins removed",
      variant: "destructive",
    });
  };

  const handleDeleteLogin = (websiteId: string, loginId: string) => {
    setWebsites(prev => prev.map(w =>
      w.id === websiteId
        ? { ...w, logins: w.logins.filter(l => l.id !== loginId) }
        : w
    ));
    toast({
      title: "Deleted",
      description: "Login removed successfully",
      variant: "destructive",
    });
  };

  const resetWebsiteForm = () => {
    setWebsiteFormData({
      website: "",
      url: ""
    });
    setEditingWebsiteId(null);
  };

  const resetLoginForm = () => {
    setLoginFormData({
      username: "",
      password: "",
      label: "",
      notes: ""
    });
    setEditingLoginId(null);
  };

  const filteredWebsites = websites.filter(w =>
    w.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.logins.some(l => 
      l.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.label?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <>
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6 flex-col sm:flex-row">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Password Manager</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Securely store and manage website login credentials
          </p>
        </div>
        <Button 
          className="gap-2 font-bold flex-shrink-0" 
          size="sm"
          onClick={() => setIsWebsiteDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Website</span>
        </Button>
      </div>

      <Dialog open={isWebsiteDialogOpen} onOpenChange={(open) => {
        setIsWebsiteDialogOpen(open);
        if (!open) resetWebsiteForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingWebsiteId ? "Edit" : "Add"} Website</DialogTitle>
            <DialogDescription>
              {editingWebsiteId ? "Update" : "Add a new"} website to store login credentials
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWebsiteSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="website">Website Name *</Label>
              <Input
                id="website"
                value={websiteFormData.website}
                onChange={(e) => setWebsiteFormData({ ...websiteFormData, website: e.target.value })}
                placeholder="e.g., GitHub, Gmail"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">Website URL *</Label>
              <Input
                id="url"
                type="url"
                value={websiteFormData.url}
                onChange={(e) => setWebsiteFormData({ ...websiteFormData, url: e.target.value })}
                placeholder="https://example.com"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsWebsiteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingWebsiteId ? "Update" : "Add"} Website
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoginDialogOpen} onOpenChange={(open) => {
        setIsLoginDialogOpen(open);
        if (!open) resetLoginForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingLoginId ? "Edit" : "Add"} Login</DialogTitle>
            <DialogDescription>
              {editingLoginId ? "Update" : "Add"} login credentials for this website
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Account Label</Label>
              <Input
                id="label"
                value={loginFormData.label}
                onChange={(e) => setLoginFormData({ ...loginFormData, label: e.target.value })}
                placeholder="e.g., Work Account, Personal"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-username">Username/Email *</Label>
              <Input
                id="login-username"
                value={loginFormData.username}
                onChange={(e) => setLoginFormData({ ...loginFormData, username: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-password">Password *</Label>
              <Input
                id="login-password"
                type="password"
                value={loginFormData.password}
                onChange={(e) => setLoginFormData({ ...loginFormData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-notes">Notes (Optional)</Label>
              <Input
                id="login-notes"
                value={loginFormData.notes}
                onChange={(e) => setLoginFormData({ ...loginFormData, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsLoginDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingLoginId ? "Update" : "Add"} Login
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by website, username, or label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredWebsites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No websites found matching your search" : "No websites saved yet"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsWebsiteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Website
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {filteredWebsites.map((website) => (
              <AccordionItem 
                key={website.id} 
                value={website.id}
                className="border rounded-lg bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 pr-4">
                  <AccordionTrigger className="flex-1 px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <h3 className="text-lg font-bold">{website.website}</h3>
                          <a 
                            href={website.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {website.url}
                          </a>
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-4">
                        {website.logins.length} {website.logins.length === 1 ? 'login' : 'logins'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditWebsite(website)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteWebsite(website.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddLogin(website.id)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Login
                      </Button>
                    </div>

                    {website.logins.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No logins added yet
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {website.logins.map((login) => (
                          <Card key={login.id} className="bg-muted/50">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                {login.label && (
                                  <Badge variant="outline" className="mb-2">
                                    {login.label}
                                  </Badge>
                                )}
                                <div className="flex gap-2 ml-auto">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditLogin(website.id, login)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleDeleteLogin(website.id, login.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <Label className="text-xs text-muted-foreground">Username</Label>
                                  <p className="font-mono text-sm truncate">{login.username}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(login.username, "Username")}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <Label className="text-xs text-muted-foreground">Password</Label>
                                  <p className="font-mono text-sm truncate">
                                    {visiblePasswords.has(login.id) ? login.password : "••••••••••••"}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => togglePasswordVisibility(login.id)}
                                  >
                                    {visiblePasswords.has(login.id) ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyToClipboard(login.password, "Password")}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {login.notes && (
                                <div className="pt-2 border-t">
                                  <Label className="text-xs text-muted-foreground">Notes</Label>
                                  <p className="text-sm mt-1">{login.notes}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
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
