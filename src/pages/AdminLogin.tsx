import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .eq("designation", "admin");

      if (error) throw error;

      if (users && users.length > 0) {
        const user = users[0];
        localStorage.setItem("admin", JSON.stringify(user));
        toast.success("Welcome to admin dashboard");
        navigate("/admin/dashboard");
      } else {
        toast.error("Invalid admin credentials");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'hsl(var(--admin-background))',
      color: 'hsl(var(--admin-foreground))'
    }}>
      <Card className="w-full max-w-md" style={{
        background: 'hsl(var(--admin-card))',
        borderColor: 'hsl(var(--admin-border))',
        color: 'hsl(var(--admin-card-foreground))'
      }}>
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{
            background: 'hsl(var(--admin-primary) / 0.2)'
          }}>
            <Shield className="w-8 h-8" style={{ color: 'hsl(var(--admin-primary))' }} />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
            <CardDescription style={{ color: 'hsl(var(--admin-muted-foreground))' }}>
              Enter your admin credentials to continue
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  background: 'hsl(var(--admin-input))',
                  borderColor: 'hsl(var(--admin-border))',
                  color: 'hsl(var(--admin-foreground))'
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  background: 'hsl(var(--admin-input))',
                  borderColor: 'hsl(var(--admin-border))',
                  color: 'hsl(var(--admin-foreground))'
                }}
              />
            </div>
            <Button
              type="submit"
              className="w-full font-bold"
              disabled={isLoading}
              style={{
                background: 'hsl(var(--admin-primary))',
                color: 'hsl(var(--admin-primary-foreground))'
              }}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
