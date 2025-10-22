import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { LiveDataProvider, useLiveDataFlag } from "./contexts/LiveDataContext";
import { Switch as UISwitch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import NotFound from "@/pages/not-found";
import OverviewPage from "@/pages/OverviewPage";
import ConversationsPage from "@/pages/ConversationsPage";
import PatternsPage from "@/pages/PatternsPage";
import FailuresPage from "@/pages/FailuresPage";
import SettingsPage from "@/pages/SettingsPage";
import AuthPage from "@/pages/AuthPage";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function AuthenticatedDashboard() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </div>
          <div className="flex items-center gap-2">
            <LiveToggle />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  data-testid="button-profile-menu"
                  aria-label="Open profile menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {user?.user_metadata?.full_name
                        ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                        : user?.email?.[0].toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {user?.user_metadata?.full_name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email || ''}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild data-testid="menu-settings">
                  <Link href="/settings">
                    <span className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-logout" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Router />
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={OverviewPage} />
      <Route path="/conversations" component={ConversationsPage} />
      <Route path="/patterns" component={PatternsPage} />
      <Route path="/failures" component={FailuresPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function LiveToggle() {
  const { enabled, setEnabled } = useLiveDataFlag();
  return (
    <div className="flex items-center gap-2 mr-2">
      <span className="text-xs text-muted-foreground">Live Data</span>
      <UISwitch checked={enabled} onCheckedChange={(v) => setEnabled(Boolean(v))} data-testid="toggle-live-data" />
    </div>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <LiveDataProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <Switch>
                <Route path="/auth" component={AuthPage} />
                <Route>
                  <ProtectedRoute>
                    <AuthenticatedDashboard />
                  </ProtectedRoute>
                </Route>
              </Switch>
            </SidebarProvider>
          </LiveDataProvider>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
