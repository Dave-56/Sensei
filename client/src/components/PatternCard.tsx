import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PatternCardProps {
  name: string;
  example: string;
  count: number;
  trend: "up" | "down";
  isEmerging?: boolean;
  onClick?: () => void;
}

export function PatternCard({ name, example, count, trend, isEmerging, onClick }: PatternCardProps) {
  return (
    <Card
      className="p-6 hover-elevate cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`pattern-card-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg">{name}</h3>
          {trend === "up" ? (
            <TrendingUp className="w-5 h-5 text-health-excellent flex-shrink-0" />
          ) : (
            <TrendingDown className="w-5 h-5 text-health-critical flex-shrink-0" />
          )}
        </div>
        
        <p className="text-sm text-muted-foreground italic line-clamp-2">
          "{example}"
        </p>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {count} occurrences
          </Badge>
          {isEmerging && (
            <Badge className="bg-primary/20 text-primary border-primary/40">
              Emerging
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
