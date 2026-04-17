import { cn, scoreBgColor } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreBadge({ score, size = "md", className }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: "text-sm px-1.5 py-0.5 min-w-[28px]",
    md: "text-lg px-2 py-0.5 min-w-[36px]",
    lg: "text-3xl px-3 py-1 min-w-[48px]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-display font-normal tabular-nums",
        scoreBgColor(score),
        sizeClasses[size],
        className
      )}
    >
      {score}
    </span>
  );
}
