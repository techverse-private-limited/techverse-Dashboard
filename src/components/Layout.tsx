import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/groups": "Groups",
  "/projects": "Projects",
  "/supabase-accounts": "Supabase Accounts",
  "/github-links": "GitHub Links",
  "/settings": "Password Manager",
};

export function Layout({ children, noPadding = false }: LayoutProps) {
  const [userName, setUserName] = useState<string>("");
  const location = useLocation();
  
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUserName(parsedUser.name || "User");
    }
  }, []);

  const getPageTitle = () => {
    const basePath = "/" + location.pathname.split("/")[1];
    const pageTitle = pageTitles[basePath] || pageTitles[location.pathname] || "Dashboard";
    
    if (location.pathname === "/") {
      return userName ? `${userName} Dashboard` : "Dashboard";
    }
    return pageTitle;
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case "/":
        return "Welcome back! Here's your overview.";
      case "/groups":
        return "Manage your team groups";
      case "/projects":
        return "Track and manage your projects";
      case "/supabase-accounts":
        return "Manage your database connections";
      case "/github-links":
        return "Connect and manage your repositories";
      case "/settings":
        return "Manage your credentials securely";
      default:
        return "";
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col pl-4">
          <header className="sticky top-0 z-10 flex h-auto min-h-16 items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-6 py-3 shrink-0">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">{getPageTitle()}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
                {getPageDescription()}
              </p>
            </div>
          </header>
          <main className={`flex-1 flex flex-col overflow-hidden ${noPadding ? "" : "p-4 sm:p-6 lg:p-8"}`}>
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
