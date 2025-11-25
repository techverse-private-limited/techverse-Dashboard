import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import GroupChat from "./pages/GroupChat";
import Projects from "./pages/Projects";
import SupabaseAccounts from "./pages/SupabaseAccounts";
import GitHubLinks from "./pages/GitHubLinks";
import Settings from "./pages/Settings";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminGroups from "./pages/admin/AdminGroups";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminSupabaseAccounts from "./pages/admin/AdminSupabaseAccounts";
import AdminGitHubLinks from "./pages/admin/AdminGitHubLinks";
const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const user = localStorage.getItem("user");
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Main Layout wrapper for protected routes
const MainLayout = ({
  children,
  noPadding = false
}: {
  children: React.ReactNode;
  noPadding?: boolean;
}) => {
  return <ProtectedRoute>
      <Layout noPadding={noPadding}>
        {children}
      </Layout>
    </ProtectedRoute>;
};
const App = () => <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/chat" element={<Index />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/groups" element={<AdminGroups />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/supabase-accounts" element={<AdminSupabaseAccounts />} />
          <Route path="/admin/github-links" element={<AdminGitHubLinks />} />
          
          {/* Protected routes with persistent sidebar */}
          <Route path="/" element={<MainLayout>
              <div className="space-y-2 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Welcome back! Here's your overview.</p>
              </div>
              <Dashboard />
            </MainLayout>} />
          
          <Route path="/groups" element={<MainLayout>
              <Groups />
            </MainLayout>} />
          
          <Route path="/groups/:groupName" element={<MainLayout noPadding>
              <GroupChat />
            </MainLayout>} />
          
          <Route path="/projects" element={<MainLayout>
              <div className="flex items-start sm:items-center justify-between gap-4 mb-6 flex-col sm:flex-row">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold">Projects</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Track and manage your projects.</p>
                </div>
                <Button className="gap-2 font-bold flex-shrink-0" size="sm">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">New Project</span>
                </Button>
              </div>
              <Projects />
            </MainLayout>} />
          
          <Route path="/supabase-accounts" element={<MainLayout>
              <div className="flex items-start sm:items-center justify-between gap-4 mb-6 flex-col sm:flex-row">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold">Supabase Accounts</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Manage your database connections and accounts.</p>
                </div>
                
              </div>
              <SupabaseAccounts />
            </MainLayout>} />
          
          <Route path="/github-links" element={<MainLayout>
              <div className="flex items-start sm:items-center justify-between gap-4 mb-6 flex-col sm:flex-row">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold">GitHub Links</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Connect and manage your GitHub repositories.</p>
                </div>
                <Button className="gap-2 font-bold flex-shrink-0" size="sm">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Add Repository</span>
                </Button>
              </div>
              <GitHubLinks />
            </MainLayout>} />
          
          <Route path="/settings" element={<MainLayout>
              <Settings />
            </MainLayout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;
export default App;