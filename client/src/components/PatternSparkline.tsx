import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Sparklines, SparklinesLine } from "react-sparklines";

interface PatternSparklineProps {
  name: string;
  count: number;
  trend: "up" | "down";
  data: number[];
  onClick?: () => void;
}

export function PatternSparkline({ name, count, trend, data, onClick }: PatternSparklineProps) {
  return (
    <Card
      className="p-4 hover-elevate cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`pattern-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{name}</h4>
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3 text-health-excellent flex-shrink-0" />
            ) : (
              <TrendingDown className="w-3 h-3 text-health-critical flex-shrink-0" />
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {count} occurrences
          </Badge>
        </div>
        <div className="w-20 h-8">
          <Sparklines data={data} width={80} height={32}>
            <SparklinesLine
              color={trend === "up" ? "hsl(var(--chart-2))" : "hsl(var(--chart-4))"}
              style={{ strokeWidth: 2, fill: "none" }}
            />
          </Sparklines>
        </div>
      </div>
    </Card>
  );
}
