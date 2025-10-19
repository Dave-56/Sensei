import { HealthScoreCard } from '../HealthScoreCard';

export default function HealthScoreCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
      <HealthScoreCard
        title="Current Health Score"
        value={87}
        trend={{ value: 5.2, direction: "up" }}
        onClick={() => console.log('Health score clicked')}
      />
      <HealthScoreCard
        title="Active Conversations"
        value={234}
        trend={{ value: 12, direction: "up" }}
      />
      <HealthScoreCard
        title="Failure Rate Today"
        value="3.2%"
        trend={{ value: 0.8, direction: "down" }}
      />
    </div>
  );
}
