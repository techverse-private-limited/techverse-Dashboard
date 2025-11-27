import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, FolderKanban, TrendingUp, MessageSquare, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalGroups: number;
  activeProjects: number;
  githubRepos: number;
  totalUsers: number;
  totalMessages: number;
  supabaseAccounts: number;
}

interface RecentActivity {
  id: string;
  type: 'project' | 'group' | 'github' | 'message';
  text: string;
  color: string;
  created_at: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalGroups: 0,
    activeProjects: 0,
    githubRepos: 0,
    totalUsers: 0,
    totalMessages: 0,
    supabaseAccounts: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch counts from all tables in parallel
        const [
          { count: groupsCount },
          { count: projectsCount },
          { count: githubCount },
          { count: usersCount },
          { count: messagesCount },
          { count: supabaseCount },
        ] = await Promise.all([
          supabase.from("groups").select("*", { count: "exact", head: true }),
          supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "ongoing"),
          supabase.from("github_links").select("*", { count: "exact", head: true }),
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("messages").select("*", { count: "exact", head: true }),
          supabase.from("supabase_accounts").select("*", { count: "exact", head: true }),
        ]);

        setStats({
          totalGroups: groupsCount || 0,
          activeProjects: projectsCount || 0,
          githubRepos: githubCount || 0,
          totalUsers: usersCount || 0,
          totalMessages: messagesCount || 0,
          supabaseAccounts: supabaseCount || 0,
        });

        // Fetch recent activity from various tables
        const [
          { data: recentProjects },
          { data: recentGroups },
          { data: recentGithub },
        ] = await Promise.all([
          supabase.from("projects").select("id, name, created_at").order("created_at", { ascending: false }).limit(2),
          supabase.from("groups").select("id, name, created_at").order("created_at", { ascending: false }).limit(2),
          supabase.from("github_links").select("id, name, created_at").order("created_at", { ascending: false }).limit(2),
        ]);

        const activities: RecentActivity[] = [];

        recentProjects?.forEach((p) => {
          activities.push({
            id: p.id,
            type: 'project',
            text: `New project created: ${p.name}`,
            color: 'bg-green-500',
            created_at: p.created_at,
          });
        });

        recentGroups?.forEach((g) => {
          activities.push({
            id: g.id,
            type: 'group',
            text: `Group created: ${g.name}`,
            color: 'bg-blue-500',
            created_at: g.created_at,
          });
        });

        recentGithub?.forEach((gh) => {
          activities.push({
            id: gh.id,
            type: 'github',
            text: `GitHub repo connected: ${gh.name}`,
            color: 'bg-purple-500',
            created_at: gh.created_at,
          });
        });

        // Sort by created_at and take top 5
        activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentActivity(activities.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Set up realtime subscriptions for live updates
    const channels = [
      supabase.channel('dashboard-groups').on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, fetchStats).subscribe(),
      supabase.channel('dashboard-projects').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchStats).subscribe(),
      supabase.channel('dashboard-github').on('postgres_changes', { event: '*', schema: 'public', table: 'github_links' }, fetchStats).subscribe(),
      supabase.channel('dashboard-messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchStats).subscribe(),
    ];

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, []);

  const statCards = [
    { title: "Total Groups", value: stats.totalGroups.toString(), icon: Users, color: "text-blue-600" },
    { title: "Active Projects", value: stats.activeProjects.toString(), icon: FolderKanban, color: "text-green-600" },
    { title: "GitHub Repos", value: stats.githubRepos.toString(), icon: BarChart3, color: "text-purple-600" },
    { title: "Total Users", value: stats.totalUsers.toString(), icon: TrendingUp, color: "text-orange-600" },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-5 w-5 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-bold">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-bold text-base sm:text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                  <div className={`h-2 w-2 rounded-full ${activity.color}`} />
                  <p className="text-xs sm:text-sm font-semibold truncate">{activity.text}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-bold text-base sm:text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Total Users
              </span>
              <span className="text-lg sm:text-2xl font-bold">{stats.totalUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Total Messages
              </span>
              <span className="text-lg sm:text-2xl font-bold">{stats.totalMessages}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Database className="h-4 w-4" /> Supabase Accounts
              </span>
              <span className="text-lg sm:text-2xl font-bold">{stats.supabaseAccounts}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
