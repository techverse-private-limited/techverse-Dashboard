import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, FolderKanban, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const stats = [
    { title: "Total Groups", value: "12", icon: Users, color: "text-blue-600" },
    { title: "Active Projects", value: "8", icon: FolderKanban, color: "text-green-600" },
    { title: "GitHub Repos", value: "24", icon: BarChart3, color: "text-purple-600" },
    { title: "Growth", value: "+23%", icon: TrendingUp, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <p className="text-sm font-semibold">New project created: Website Redesign</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <p className="text-sm font-semibold">Group updated: Design Team</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <p className="text-sm font-semibold">GitHub repo connected: frontend-app</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-bold">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-muted-foreground">Active Members</span>
              <span className="text-2xl font-bold">48</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-muted-foreground">Completed Tasks</span>
              <span className="text-2xl font-bold">156</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-muted-foreground">Pending Reviews</span>
              <span className="text-2xl font-bold">7</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
