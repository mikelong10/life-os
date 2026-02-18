import { useEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

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
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <SeedCategories />
          <AppShell>
            <Outlet />
          </AppShell>
        </TooltipProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
