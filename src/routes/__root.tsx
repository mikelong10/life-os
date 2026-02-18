import { useEffect } from "react";
import {
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  ConvexReactClient,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { authClient } from "@/lib/auth-client";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL as string,
  { expectAuth: true },
);

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

function AuthGate() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const navigate = useNavigate();
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const isLoginPage = currentPath === "/login";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !isLoginPage) {
      navigate({ to: "/login" });
    }
    if (isAuthenticated && isLoginPage) {
      navigate({ to: "/log" });
    }
  }, [isAuthenticated, isLoading, isLoginPage, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="text-muted-foreground text-sm font-mono">
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <>
      <SeedCategories />
      <AppShell>
        <Outlet />
      </AppShell>
    </>
  );
}

function RootComponent() {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <AuthGate />
        </TooltipProvider>
      </ThemeProvider>
    </ConvexBetterAuthProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
