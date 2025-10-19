import { PatternCard } from "@/components/PatternCard";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";

//todo: remove mock functionality
const emergingPatterns = [
  { name: "API Rate Limit Questions", example: "How many requests can I make per hour?", count: 23, trend: "up" as const },
  { name: "Mobile App Issues", example: "The app keeps crashing on iOS", count: 18, trend: "up" as const },
];

const allPatterns = [
  { name: "Product Questions", example: "How do I upgrade my plan?", count: 142, trend: "up" as const },
  { name: "Billing Issues", example: "I was charged twice this month", count: 38, trend: "down" as const },
  { name: "Feature Requests", example: "Can you add dark mode?", count: 76, trend: "up" as const },
  { name: "Technical Support", example: "API returning 500 errors", count: 64, trend: "up" as const },
  { name: "Account Management", example: "How do I delete my account?", count: 52, trend: "down" as const },
  { name: "Integration Help", example: "Setting up Slack integration", count: 45, trend: "up" as const },
  { name: "Password Reset", example: "I forgot my password", count: 34, trend: "down" as const },
  { name: "Pricing Questions", example: "What's included in Pro plan?", count: 28, trend: "up" as const },
];

export default function PatternsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Patterns</h1>
          <p className="text-sm text-muted-foreground">
            Discover recurring conversation patterns and trends
          </p>
        </div>
        <Select defaultValue="frequency">
          <SelectTrigger className="w-48" data-testid="select-sort-patterns">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="frequency">By Frequency</SelectItem>
            <SelectItem value="trend">By Trend</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Emerging Patterns</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergingPatterns.map((pattern) => (
            <PatternCard
              key={pattern.name}
              name={pattern.name}
              example={pattern.example}
              count={pattern.count}
              trend={pattern.trend}
              isEmerging
              onClick={() => console.log('Emerging pattern clicked:', pattern.name)}
            />
          ))}
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">All Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allPatterns.map((pattern) => (
            <PatternCard
              key={pattern.name}
              name={pattern.name}
              example={pattern.example}
              count={pattern.count}
              trend={pattern.trend}
              onClick={() => console.log('Pattern clicked:', pattern.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
