import { Home, Users, MessageSquare, FolderKanban, Database, Github, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const items = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: Home
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users
  },
  {
    title: "Groups",
    url: "/admin/groups",
    icon: MessageSquare
  },
  {
    title: "Projects",
    url: "/admin/projects",
    icon: FolderKanban
  },
  {
    title: "Supabase Accounts",
    url: "/admin/supabase-accounts",
    icon: Database
  },
  {
    title: "GitHub Links",
    url: "/admin/github-links",
    icon: Github
  }
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [admin, setAdmin] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (adminData) {
      const parsedAdmin = JSON.parse(adminData);
      setAdmin({
        name: parsedAdmin.name
      });
    }
  }, []);

  const isActive = (path: string) => currentPath === path;

  const handleLogout = () => {
    localStorage.removeItem("admin");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate("/admin");
  };

  return (
    <>
      <Sidebar className={`${collapsed ? "w-20" : "w-72"} z-20`} collapsible="icon">
        <SidebarContent className="flex flex-col h-full p-3">
          {!collapsed && admin && (
            <div className="mx-3 mb-6 p-6 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-border/50 backdrop-blur-sm shadow-lg">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">{admin.name}</h2>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Administrator</p>
              </div>
            </div>
          )}
          
          <SidebarGroup className="flex-1 flex flex-col">
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-5 py-3 text-muted-foreground">
              {!collapsed && "Admin Menu"}
            </SidebarGroupLabel>

            <SidebarGroupContent className="flex flex-col">
              <SidebarMenu className="space-y-4">
                {items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={`flex items-center gap-4 px-5 py-4 rounded-lg transition-colors ${
                          active ? "bg-foreground text-background font-bold" : "hover:bg-sidebar-accent"
                        }`}
                      >
                        <NavLink to={item.url} end>
                          <item.icon className="h-6 w-6" />
                          {!collapsed && <span className="font-semibold text-base">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-auto pb-4">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setShowLogoutDialog(true)}
                    className="flex items-center gap-4 px-5 py-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors font-semibold rounded"
                  >
                    <LogOut className="h-6 w-6" />
                    {!collapsed && <span className="text-base">Logout</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to sign in again to access the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
