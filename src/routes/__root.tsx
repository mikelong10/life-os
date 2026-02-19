import { useEffect } from "react";
import {
  createRootRouteWithContext,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Loader } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "../../convex/_generated/api";
import type { AuthContext } from "../main";

function SeedCategories() {
  const categories = useQuery(api.categories.list);
  const seed = useMutation(api.categories.seed);

  useEffect(() => {
    if (categories && categories.length === 0) {
      seed();
    }
  }, [categories, seed]);

  return null;
}

function RootComponent() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Show loading during cross-domain token exchange (OAuth callback)
  const isExchangingToken =
    !isAuthenticated &&
    typeof window !== "undefined" &&
    window.location.search.includes("ott=");

  if (isLoading || isExchangingToken) {
    return (
      <ThemeProvider defaultTheme="system">
        <div className="flex h-svh items-center justify-center">
          <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <Outlet />
        </TooltipProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <SeedCategories />
        <AppShell>
          <Outlet />
        </AppShell>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export const Route = createRootRouteWithContext<{ auth: AuthContext }>()({
  component: RootComponent,
  beforeLoad: ({ context, location }) => {
    if (context.auth.isLoading) return;
    // Don't redirect during cross-domain token exchange (OAuth callback)
    if (location.searchStr?.includes("ott=")) return;
    if (
      !context.auth.isAuthenticated &&
      location.pathname !== "/login"
    ) {
      throw redirect({ to: "/login" });
    }
  },
});
