import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  conversationId: string;
  type: "loop" | "frustration" | "nonsense" | "abrupt";
  timestamp: Date;
  preview: string;
}

//todo: remove mock functionality
const mockAlerts: Alert[] = [
  { id: "1", conversationId: "C-4521", type: "loop", timestamp: new Date(Date.now() - 1000 * 60 * 5), preview: "User keeps asking about the same feature..." },
  { id: "2", conversationId: "C-4518", type: "frustration", timestamp: new Date(Date.now() - 1000 * 60 * 15), preview: "This is getting ridiculous, I've asked three times..." },
  { id: "3", conversationId: "C-4512", type: "abrupt", timestamp: new Date(Date.now() - 1000 * 60 * 32), preview: "Conversation ended without resolution" },
  { id: "4", conversationId: "C-4503", type: "nonsense", timestamp: new Date(Date.now() - 1000 * 60 * 45), preview: "AI response was completely off-topic..." },
];

const typeConfig = {
  loop: { label: "Loop", color: "bg-health-warning/20 text-health-warning border-health-warning/40" },
  frustration: { label: "Frustration", color: "bg-health-critical/20 text-health-critical border-health-critical/40" },
  nonsense: { label: "Nonsense", color: "bg-health-poor/20 text-health-poor border-health-poor/40" },
  abrupt: { label: "Abrupt End", color: "bg-health-critical/20 text-health-critical border-health-critical/40" },
};

export function AlertFeed() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-health-critical" />
        <h3 className="text-lg font-semibold">Recent Failures</h3>
      </div>
      <div className="space-y-3">
        {mockAlerts.map((alert) => (
          <button
            key={alert.id}
            className="w-full text-left p-3 rounded-md hover-elevate border border-transparent transition-all"
            onClick={() => console.log('Alert clicked:', alert.conversationId)}
            data-testid={`alert-${alert.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-medium" data-testid={`text-conversation-id-${alert.id}`}>
                    {alert.conversationId}
                  </span>
                  <Badge variant="outline" className={typeConfig[alert.type].color}>
                    {typeConfig[alert.type].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{alert.preview}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
              </span>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
