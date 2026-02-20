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
    <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <div className="group-data-[collapsible=icon]:hidden">
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
      </div>
      <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
        <span className="truncate text-sm font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {user.email}
        </span>
      </div>
      <button
        onClick={() => authClient.signOut()}
        className="ml-auto shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:ml-0"
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
      <div className="flex min-h-svh min-w-[384px] flex-col bg-background">
        <header className="flex h-10 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 36 36" className="shrink-0">
              <path fill="#77b255" d="M22.911 14.398a17.5 17.5 0 0 0-2.88 2.422c-.127-4.245-1.147-9.735-6.772-12.423C12.146-1.658-.833 1.418.328 2.006c2.314 1.17 3.545 4.148 5.034 5.715c2.653 2.792 5.603 2.964 7.071.778c3.468 2.254 3.696 6.529 3.59 11.099c-.012.505-.023.975-.023 1.402v14c0 1.104 4 1.104 4 0V23.51c.542-.954 2.122-3.505 4.43-5.294c1.586 1.393 4.142.948 6.463-1.495c1.489-1.567 2.293-4.544 4.607-5.715c1.221-.618-12.801-3.994-12.589 3.392"/>
            </svg>
            <span className="font-mono text-base font-bold text-primary">
              life os
            </span>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </main>
        <MobileNav currentPath={currentPath} />
      </div>
    );
  }

  return (
    <SidebarProvider className="min-w-[384px] max-h-svh">
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 36 36" className="shrink-0">
              <path fill="#77b255" d="M22.911 14.398a17.5 17.5 0 0 0-2.88 2.422c-.127-4.245-1.147-9.735-6.772-12.423C12.146-1.658-.833 1.418.328 2.006c2.314 1.17 3.545 4.148 5.034 5.715c2.653 2.792 5.603 2.964 7.071.778c3.468 2.254 3.696 6.529 3.59 11.099c-.012.505-.023.975-.023 1.402v14c0 1.104 4 1.104 4 0V23.51c.542-.954 2.122-3.505 4.43-5.294c1.586 1.393 4.142.948 6.463-1.495c1.489-1.567 2.293-4.544 4.607-5.715c1.221-.618-12.801-3.994-12.589 3.392"/>
            </svg>
            <span className="font-mono text-base font-bold text-primary group-data-[collapsible=icon]:hidden">
              life os
            </span>
          </div>
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
        <main className="flex-1 overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
