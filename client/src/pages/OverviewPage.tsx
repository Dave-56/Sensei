import { HealthScoreCard } from "@/components/HealthScoreCard";
import { HealthScoreTrend } from "@/components/HealthScoreTrend";
import { AlertFeed } from "@/components/AlertFeed";
import { PatternSparkline } from "@/components/PatternSparkline";
import { useQuery } from "@tanstack/react-query";
import { useLiveDataFlag } from "@/contexts/LiveDataContext";

//todo: remove mock functionality
const topPatterns = [
  { name: "Product Questions", count: 142, trend: "up" as const, data: [10, 15, 13, 17, 20, 18, 22] },
  { name: "Billing Issues", count: 38, trend: "down" as const, data: [15, 12, 14, 10, 8, 7, 5] },
  { name: "Feature Requests", count: 76, trend: "up" as const, data: [5, 8, 10, 12, 15, 14, 18] },
  { name: "Technical Support", count: 64, trend: "up" as const, data: [8, 9, 11, 10, 13, 15, 16] },
  { name: "Account Management", count: 52, trend: "down" as const, data: [12, 11, 10, 9, 8, 7, 6] },
];

export default function OverviewPage() {
  const { enabled } = useLiveDataFlag();
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ["/api/v1/analytics/summary?timeframe=7d"],
    enabled,
  });

  const live = enabled && summary && !isLoading && !error;
  const s = (summary || {}) as any;
  const healthTitle = live ? "Avg Health (7d)" : "Current Health Score";
  const activeTitle = live ? "Active Conversations (7d)" : "Active Conversations";
  const failuresTitle = live ? "Failures (7d)" : "Failures";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Monitor your conversation health metrics and recent activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthScoreCard
          title={healthTitle}
          value={live ? s.health_score_avg_7d : 87}
          trend={{ value: 5.2, direction: "up" }}
          onClick={() => console.log('Health score clicked')}
        />
        <HealthScoreCard
          title={activeTitle}
          value={live ? s.active_conversations : 234}
          trend={{ value: 12, direction: "up" }}
        />
        <HealthScoreCard
          title={failuresTitle}
          value={live ? s.failures_today : "3.2%"}
          trend={{ value: 0.8, direction: "down" }}
        />
        <HealthScoreCard
          title="Avg Response Time"
          value="1.2s"
          trend={{ value: 0.3, direction: "neutral" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthScoreTrend />
        <AlertFeed />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Top 5 Usage Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {topPatterns.map((pattern) => (
            <PatternSparkline
              key={pattern.name}
              name={pattern.name}
              count={pattern.count}
              trend={pattern.trend}
              data={pattern.data}
              onClick={() => console.log('Pattern clicked:', pattern.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
