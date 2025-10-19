import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

//todo: remove mock functionality
const mockData = [
  { day: "Mon", loops: 3, frustration: 5, nonsense: 2, abrupt: 4 },
  { day: "Tue", loops: 4, frustration: 3, nonsense: 1, abrupt: 3 },
  { day: "Wed", loops: 2, frustration: 6, nonsense: 3, abrupt: 2 },
  { day: "Thu", loops: 5, frustration: 4, nonsense: 2, abrupt: 5 },
  { day: "Fri", loops: 3, frustration: 2, nonsense: 1, abrupt: 3 },
  { day: "Sat", loops: 2, frustration: 3, nonsense: 2, abrupt: 2 },
  { day: "Sun", loops: 1, frustration: 2, nonsense: 1, abrupt: 1 },
];

export function FailureTrendsChart() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Failure Trends (7 Days)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={mockData}>
          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="loops" fill="hsl(var(--chart-3))" name="Loops" />
          <Bar dataKey="frustration" fill="hsl(var(--chart-4))" name="Frustration" />
          <Bar dataKey="nonsense" fill="hsl(20 90% 55%)" name="Nonsense" />
          <Bar dataKey="abrupt" fill="hsl(var(--chart-1))" name="Abrupt" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
