import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, MoreVertical } from "lucide-react";

const GitHubLinks = () => {
  const repositories = [
    { name: "frontend-app", link: "https://github.com/user/frontend-app" },
    { name: "backend-api", link: "https://github.com/user/backend-api" },
    { name: "mobile-app", link: "https://github.com/user/mobile-app" },
    { name: "design-system", link: "https://github.com/user/design-system" },
    { name: "analytics-tool", link: "https://github.com/user/analytics-tool" },
    { name: "documentation", link: "https://github.com/user/documentation" },
  ];

  return (
    <Tabs defaultValue="repositories" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="repositories">Repositories</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="repositories" className="space-y-4">
        {repositories.map((repo) => (
          <Card key={repo.name} className="hover:shadow-lg transition-all hover:border-primary/50">
            <CardHeader>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Github className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <CardTitle className="font-bold text-base sm:text-lg">{repo.name}</CardTitle>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">GitHub Link</p>
                    <a 
                      href={repo.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline truncate block"
                    >
                      {repo.link}
                    </a>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="activity">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>View recent commits and repository activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Activity feed coming soon...</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default GitHubLinks;
