import { createFileRoute } from "@tanstack/react-router";
import { CategoryManager } from "@/components/categories/CategoryManager";

export const Route = createFileRoute("/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-mono font-semibold text-foreground">Categories</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your time tracking categories.
      </p>
      <div className="mt-6">
        <CategoryManager />
      </div>
    </div>
  );
}
