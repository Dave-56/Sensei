import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useLiveDataFlag } from "@/contexts/LiveDataContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useMemo } from "react";

//todo: remove mock functionality
const mockData = [
  { day: "Mon", score: 82 },
  { day: "Tue", score: 85 },
  { day: "Wed", score: 83 },
  { day: "Thu", score: 88 },
  { day: "Fri", score: 86 },
  { day: "Sat", score: 89 },
  { day: "Sun", score: 87 },
];

export function HealthScoreTrend() {
  const { enabled } = useLiveDataFlag();

  type ConvItem = { id: string; health_score: number | null };
  type Page = { items: ConvItem[] };
  const trendQuery = useQuery<{ day: string; score: number }[]>({
    queryKey: ["health-trend-7d"],
    enabled,
    queryFn: async () => {
      const today = new Date();
      const days = 7;
      const results: { day: string; score: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const from = new Date(today.getTime() - i * 86400_000);
        const to = new Date(from.getTime() + 86400_000 - 1);
        const fromIso = from.toISOString();
        const toIso = to.toISOString();
        const url = `/api/v1/conversations?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}&page=1&page_size=500`;
        const res = await apiRequest("GET", url);
        const page: Page = await res.json();
        const vals = (page.items || []).map((it) => it.health_score).filter((v): v is number => typeof v === "number");
        const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
        const label = from.toLocaleDateString(undefined, { weekday: "short" });
        results.push({ day: label, score: avg });
      }
      return results;
    },
  });

  const data = useMemo(() => (enabled && trendQuery.data ? trendQuery.data : mockData), [enabled, trendQuery.data]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Health Score Trend (7 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} />
          <XAxis
            dataKey="day"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
