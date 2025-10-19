import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthScoreCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  onClick?: () => void;
}

export function HealthScoreCard({ title, value, trend, onClick }: HealthScoreCardProps) {
  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.direction === "up") return "text-health-excellent";
    if (trend.direction === "down") return "text-health-critical";
    return "text-muted-foreground";
  };

  const TrendIcon = trend?.direction === "up" ? ArrowUp : trend?.direction === "down" ? ArrowDown : Minus;

  return (
    <Card
      className={cn(
        "p-6 hover-elevate transition-all",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
      data-testid={`card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-baseline justify-between">
          <p className="text-4xl font-bold" data-testid={`value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
          {trend && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
