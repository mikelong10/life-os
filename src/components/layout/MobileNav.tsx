import { Link } from "@tanstack/react-router";
import { CalendarDays, BarChart3, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/log", label: "Log", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/planning", label: "Planning", icon: Target },
] as const;

export function MobileNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-card">
      {NAV_ITEMS.map((item) => {
        const isActive = currentPath === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-mono transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
