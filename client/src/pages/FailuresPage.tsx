import { FailureTrendsChart } from "@/components/FailureTrendsChart";
import { FailureKanbanBoard } from "@/components/FailureKanbanBoard";

export default function FailuresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Failures</h1>
        <p className="text-sm text-muted-foreground">
          Track and manage conversation failures across different categories
        </p>
      </div>

      <FailureTrendsChart />

      <div>
        <h2 className="text-lg font-semibold mb-4">Failure Board</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Drag cards to "Resolved" column after fixing the underlying issues
        </p>
        <FailureKanbanBoard />
      </div>
    </div>
  );
}
