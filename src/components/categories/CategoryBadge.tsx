import { cn } from "@/lib/utils";

export function CategoryBadge({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono",
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      <span
        className={cn("shrink-0 rounded-sm", size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")}
        style={{ backgroundColor: color }}
      />
      <span className="truncate">{name}</span>
    </span>
  );
}
