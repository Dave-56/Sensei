import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  hasIssue?: boolean;
}

//todo: remove mock functionality
const mockMessages: Message[] = [
  { id: "1", role: "user", content: "How do I reset my password?", timestamp: new Date(), hasIssue: false },
  { id: "2", role: "ai", content: "You can reset your password by clicking on the 'Forgot Password' link on the login page.", timestamp: new Date(), hasIssue: false },
  { id: "3", role: "user", content: "I don't see that link anywhere", timestamp: new Date(), hasIssue: false },
  { id: "4", role: "ai", content: "The link should be below the login button. Can you tell me what you see?", timestamp: new Date(), hasIssue: false },
  { id: "5", role: "user", content: "How do I reset my password?", timestamp: new Date(), hasIssue: true },
  { id: "6", role: "ai", content: "You can reset your password by clicking on the 'Forgot Password' link on the login page.", timestamp: new Date(), hasIssue: true },
];

const mockSentimentData = [
  { message: 1, sentiment: 70 },
  { message: 2, sentiment: 75 },
  { message: 3, sentiment: 60 },
  { message: 4, sentiment: 65 },
  { message: 5, sentiment: 40 },
  { message: 6, sentiment: 35 },
];

const mockSimilarConversations = [
  { id: "C-4510", healthScore: 52, preview: "Password reset issues..." },
  { id: "C-4498", healthScore: 68, preview: "Cannot access account..." },
  { id: "C-4487", healthScore: 45, preview: "Login problems..." },
];

interface ConversationDetailModalProps {
  conversationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversationDetailModal({
  conversationId,
  open,
  onOpenChange,
}: ConversationDetailModalProps) {
  if (!conversationId) return null;

  const healthScore = 45;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="modal-conversation-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-lg">{conversationId}</span>
            <Badge variant="outline" className="bg-health-critical/20 text-health-critical border-health-critical/40">
              Health: {healthScore}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Message Thread</h4>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {mockMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "p-3 rounded-md border",
                        message.hasIssue && "border-health-critical bg-health-critical/5"
                      )}
                      data-testid={`message-${message.id}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {message.role === "user" ? (
                          <User className="w-4 h-4 text-primary" />
                        ) : (
                          <Bot className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-xs font-medium">
                          {message.role === "user" ? "User" : "AI Assistant"}
                        </span>
                        {message.hasIssue && (
                          <AlertTriangle className="w-3 h-3 text-health-critical ml-auto" />
                        )}
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-3">Sentiment Over Time</h4>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={mockSentimentData}>
                  <XAxis dataKey="message" fontSize={11} />
                  <YAxis fontSize={11} domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sentiment"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Health Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Quality</span>
                  <span className="font-medium">-20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loop Detected</span>
                  <span className="font-medium text-health-critical">-25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sentiment Drop</span>
                  <span className="font-medium">-10</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Final Score</span>
                  <span className="font-bold text-health-critical">{healthScore}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-3">Similar Conversations</h4>
              <div className="space-y-2">
                {mockSimilarConversations.map((conv) => (
                  <button
                    key={conv.id}
                    className="w-full text-left p-2 rounded-md hover-elevate border border-transparent transition-all"
                    onClick={() => console.log('Similar conversation clicked:', conv.id)}
                    data-testid={`similar-${conv.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-medium">{conv.id}</span>
                      <Badge variant="outline" className="text-xs">
                        {conv.healthScore}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.preview}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
