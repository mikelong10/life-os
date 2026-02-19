import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  BarChart3,
  Target,
  Settings,
  LogOut,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { authClient } from "@/lib/auth-client";
import { api } from "../../../convex/_generated/api";

const NAV_ITEMS = [
  { to: "/log", label: "Log", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/planning", label: "Planning", icon: Target },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function UserProfileFooter() {
  const user = useQuery(api.auth.getCurrentUser);
  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user.email?.[0]?.toUpperCase() ?? "?");

  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      {user.image ? (
        <img
          src={user.image}
          alt={user.name ?? "User"}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {initials}
        </div>
      )}
      <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
        <span className="truncate text-sm font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {user.email}
        </span>
      </div>
      <button
        onClick={() => authClient.signOut()}
        className="ml-auto shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  if (isMobile) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <header className="flex h-10 shrink-0 items-center justify-between border-b px-4">
          <span className="font-mono text-sm font-bold text-primary">
            life os
          </span>
          <ThemeToggle />
        </header>
        <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </main>
        <MobileNav currentPath={currentPath} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <span className="font-mono text-sm font-bold text-primary group-data-[collapsible=icon]:hidden">
            life os
          </span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath === item.to}
                      tooltip={item.label}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <UserProfileFooter />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-10 shrink-0 items-center justify-between border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
