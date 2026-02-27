import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";

import { authClient } from "@/lib/auth-client";

import { routeTree } from "./routeTree.gen";

import "./index.css";

export interface AuthContext {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string, {
  expectAuth: true,
});

const router = createRouter({
  routeTree,
  context: {
    auth: undefined! as AuthContext,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const auth = useConvexAuth();

  useEffect(() => {
    router.invalidate();
  }, [auth.isAuthenticated, auth.isLoading]);

  return <RouterProvider router={router} context={{ auth }} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <InnerApp />
    </ConvexBetterAuthProvider>
  </React.StrictMode>,
);
