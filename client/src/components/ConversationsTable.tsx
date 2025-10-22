import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useLiveDataFlag } from "@/contexts/LiveDataContext";
import { useQuery } from "@tanstack/react-query";

interface ConversationRow {
  id: string; // internal UUID used for actions
  displayId: string; // shown in UI (external_id or id)
  healthScore: number;
  duration: string;
  status: "active" | "completed" | "failed";
  timestamp: Date;
  hasFailures: boolean;
}

//todo: remove mock functionality
const mockConversations: ConversationRow[] = [
  { id: "C-4521", healthScore: 92, duration: "5m 32s", status: "completed", timestamp: new Date(Date.now() - 1000 * 60 * 5), hasFailures: false },
  { id: "C-4520", healthScore: 45, duration: "12m 15s", status: "failed", timestamp: new Date(Date.now() - 1000 * 60 * 15), hasFailures: true },
  { id: "C-4519", healthScore: 88, duration: "3m 45s", status: "completed", timestamp: new Date(Date.now() - 1000 * 60 * 22), hasFailures: false },
  { id: "C-4518", healthScore: 62, duration: "8m 20s", status: "completed", timestamp: new Date(Date.now() - 1000 * 60 * 35), hasFailures: true },
  { id: "C-4517", healthScore: 95, duration: "2m 10s", status: "completed", timestamp: new Date(Date.now() - 1000 * 60 * 48), hasFailures: false },
];

export function ConversationsTable({ onRowClick }: { onRowClick?: (id: string) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const { enabled } = useLiveDataFlag();

  // Helper to format seconds into a short human-readable duration
  const formatDuration = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "-";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      return `${h}h ${mm}m`;
    }
    return `${m}m ${s}s`;
  };

  // Fetch live conversations when toggle is ON
  const { data: apiData } = useQuery<{ items: Array<{ id: string; external_id: string | null; health_score: number | null; status: string; updated_at: string; duration_seconds: number }>; total: number }>(
    {
      queryKey: ["/api/v1/conversations?page=1&page_size=20"],
      enabled,
    },
  );

  const rows: ConversationRow[] = useMemo(() => {
    if (enabled && apiData?.items) {
      return apiData.items.map((it) => ({
        id: it.id,
        displayId: it.external_id || it.id,
        healthScore: (it.health_score ?? 0) as number,
        duration: formatDuration(it.duration_seconds ?? 0),
        status: (it.status as ConversationRow["status"]) || "completed",
        timestamp: new Date(it.updated_at),
        hasFailures: false,
      }));
    }
    return mockConversations.map((m) => ({ ...m, displayId: m.id }));
  }, [enabled, apiData]);

  const getHealthColor = (score: number) => {
    if (score >= 85) return "text-health-excellent";
    if (score >= 70) return "text-health-good";
    if (score >= 50) return "text-health-warning";
    return "text-health-critical";
  };

  const getHealthBadgeColor = (score: number) => {
    if (score >= 85) return "bg-health-excellent/20 text-health-excellent border-health-excellent/40";
    if (score >= 70) return "bg-health-good/20 text-health-good border-health-good/40";
    if (score >= 50) return "bg-health-warning/20 text-health-warning border-health-warning/40";
    return "bg-health-critical/20 text-health-critical border-health-critical/40";
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((c) => c.id)));
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-conversations"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-40" data-testid="select-filter-score">
              <SelectValue placeholder="Health Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="excellent">85-100</SelectItem>
              <SelectItem value="good">70-84</SelectItem>
              <SelectItem value="warning">50-69</SelectItem>
              <SelectItem value="critical">0-49</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" disabled={selected.size === 0} data-testid="button-export">
          <Download className="w-4 h-4 mr-2" />
          Export ({selected.size})
        </Button>
      </div>

      <div className="border rounded-md">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 w-12">
                <Checkbox
                  checked={selected.size === mockConversations.length}
                  onCheckedChange={toggleSelectAll}
                  data-testid="checkbox-select-all"
                />
              </th>
              <th className="text-left p-3 font-medium text-sm">ID</th>
              <th className="text-left p-3 font-medium text-sm">Health Score</th>
              <th className="text-left p-3 font-medium text-sm">Duration</th>
              <th className="text-left p-3 font-medium text-sm">Status</th>
              <th className="text-left p-3 font-medium text-sm">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((conv) =>
                searchQuery.trim() ? conv.displayId.toLowerCase().includes(searchQuery.trim().toLowerCase()) : true,
              )
              .map((conv) => (
              <tr
                key={conv.id}
                className="border-b last:border-b-0 hover-elevate cursor-pointer transition-all"
                onClick={() => onRowClick?.(conv.id)}
                data-testid={`row-conversation-${conv.id}`}
              >
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(conv.id)}
                    onCheckedChange={() => toggleSelect(conv.id)}
                    data-testid={`checkbox-${conv.id}`}
                  />
                </td>
                <td className="p-3 font-mono text-sm font-medium">{conv.displayId}</td>
                <td className="p-3">
                  <Badge variant="outline" className={getHealthBadgeColor(conv.healthScore)}>
                    <span className={cn("font-semibold", getHealthColor(conv.healthScore))}>
                      {conv.healthScore}
                    </span>
                  </Badge>
                </td>
                <td className="p-3 text-sm text-muted-foreground">{conv.duration}</td>
                <td className="p-3">
                  <Badge variant={conv.status === "failed" ? "destructive" : "secondary"}>
                    {conv.status}
                  </Badge>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {formatDistanceToNow(conv.timestamp, { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
