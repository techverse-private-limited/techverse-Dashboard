import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, FolderGit2, Database } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (!adminData) {
      navigate("/admin");
      return;
    }
    setAdmin(JSON.parse(adminData));
  }, [navigate]);

  if (!admin) return null;

  const stats = [
    { title: "Total Users", value: "0", icon: Users, color: "hsl(var(--admin-primary))" },
    { title: "Groups", value: "0", icon: MessageSquare, color: "hsl(var(--admin-accent))" },
    { title: "Projects", value: "0", icon: FolderGit2, color: "hsl(0 72% 60%)" },
    { title: "Supabase Accounts", value: "0", icon: Database, color: "hsl(0 60% 55%)" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {admin.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Latest system events and user actions</p>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <p className="text-sm text-muted-foreground">Current system health and performance</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Database</span>
                <span className="px-2 py-1 rounded text-sm font-medium bg-primary/20 text-primary">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">API</span>
                <span className="px-2 py-1 rounded text-sm font-medium bg-primary/20 text-primary">
                  Online
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
