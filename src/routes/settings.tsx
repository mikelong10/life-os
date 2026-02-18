import { createFileRoute } from "@tanstack/react-router";
import { CategoryManager } from "@/components/categories/CategoryManager";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-mono font-semibold text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your time tracking preferences.
      </p>
      <div className="mt-6">
        <h2 className="text-sm font-mono font-medium text-foreground mb-3">Categories</h2>
        <CategoryManager />
      </div>
    </div>
  );
}
