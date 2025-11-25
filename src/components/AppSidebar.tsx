import { Home, Users, FolderKanban, Database, Github, LogOut, KeyRound } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
const items = [{
  title: "Dashboard",
  url: "/",
  icon: Home
}, {
  title: "Groups",
  url: "/groups",
  icon: Users
}, {
  title: "Projects",
  url: "/projects",
  icon: FolderKanban
}, {
  title: "Supabase Accounts",
  url: "/supabase-accounts",
  icon: Database
}, {
  title: "GitHub Links",
  url: "/github-links",
  icon: Github
}, {
  title: "Password Manager",
  url: "/settings",
  icon: KeyRound
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    designation: string;
  } | null>(null);
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        name: parsedUser.name,
        designation: parsedUser.designation
      });
    }
  }, []);
  const isActive = (path: string) => currentPath === path;
  const handleLogout = () => {
    localStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate("/login");
  };
  return <>
      <Sidebar className={`${collapsed ? "w-20" : "w-72"} z-20`} collapsible="icon">
        <SidebarContent className="flex flex-col h-full p-3">
          {!collapsed && user && <div className="mx-3 mb-6 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border/50 backdrop-blur-sm shadow-lg">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">{user.designation}</p>
              </div>
            </div>}
          
          <SidebarGroup className="flex-1 flex flex-col">
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-5 py-3 text-muted-foreground">
              {!collapsed && "Main Menu"}
            </SidebarGroupLabel>

          <SidebarGroupContent className="flex flex-col">
            <SidebarMenu className="space-y-4">
              {items.map(item => {
                const active = isActive(item.url);
                return <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} className={`flex items-center gap-4 px-5 py-4 rounded-lg transition-colors ${active ? "bg-foreground text-background font-bold" : "hover:bg-sidebar-accent"}`}>
                      <NavLink to={item.url} end>
                        <item.icon className="h-6 w-6" />
                        {!collapsed && <span className="font-semibold text-base">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto pb-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setShowLogoutDialog(true)} className="flex items-center gap-4 px-5 py-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors font-semibold rounded">
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
            Are you sure you want to logout? You will need to sign in again to access the dashboard.
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
    </>;
}