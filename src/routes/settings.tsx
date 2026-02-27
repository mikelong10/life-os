import { createFileRoute } from "@tanstack/react-router";

import { CategoryManager } from "@/components/categories/CategoryManager";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl p-4 md:p-6">
      <h1 className="text-foreground font-mono text-xl font-semibold">Settings</h1>
      <p className="text-muted-foreground mt-1 text-sm">Manage your time tracking preferences.</p>
      <div className="mt-6">
        <h2 className="text-foreground mb-3 font-mono text-sm font-medium">Categories</h2>
        <CategoryManager />
      </div>
    </div>
  );
}
