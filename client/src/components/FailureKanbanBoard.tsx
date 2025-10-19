import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FailureCard {
  id: string;
  conversationId: string;
  healthScore: number;
  preview: string;
  category: "loops" | "frustration" | "nonsense" | "abrupt" | "resolved";
}

//todo: remove mock functionality
const initialCards: FailureCard[] = [
  { id: "1", conversationId: "C-4521", healthScore: 35, preview: "User repeatedly asking same question...", category: "loops" },
  { id: "2", conversationId: "C-4520", healthScore: 42, preview: "This is ridiculous, I've asked three times...", category: "frustration" },
  { id: "3", conversationId: "C-4519", healthScore: 28, preview: "AI response completely off-topic...", category: "nonsense" },
  { id: "4", conversationId: "C-4518", healthScore: 48, preview: "Conversation ended without resolution", category: "abrupt" },
  { id: "5", conversationId: "C-4517", healthScore: 38, preview: "Same answer given multiple times", category: "loops" },
];

const columns = [
  { id: "loops" as const, title: "Loops", count: 0 },
  { id: "frustration" as const, title: "Frustration", count: 0 },
  { id: "nonsense" as const, title: "Nonsense", count: 0 },
  { id: "abrupt" as const, title: "Abrupt Ends", count: 0 },
  { id: "resolved" as const, title: "Resolved", count: 0 },
];

export function FailureKanbanBoard() {
  const [cards, setCards] = useState(initialCards);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  const handleDragStart = (cardId: string) => {
    setDraggedCard(cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (category: FailureCard["category"]) => {
    if (!draggedCard) return;

    setCards(cards.map(card =>
      card.id === draggedCard ? { ...card, category } : card
    ));
    setDraggedCard(null);
    console.log(`Moved card to ${category}`);
  };

  const getColumnCards = (columnId: FailureCard["category"]) => {
    return cards.filter(card => card.category === columnId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {columns.map((column) => {
        const columnCards = getColumnCards(column.id);
        return (
          <div
            key={column.id}
            className="space-y-3"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {columnCards.length}
              </Badge>
            </div>
            <div className="space-y-2 min-h-[400px] p-2 rounded-md border-2 border-dashed border-border">
              {columnCards.map((card) => (
                <Card
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card.id)}
                  className={cn(
                    "p-4 cursor-move hover-elevate transition-all",
                    draggedCard === card.id && "opacity-50"
                  )}
                  data-testid={`failure-card-${card.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-medium">{card.conversationId}</span>
                      <Badge variant="outline" className="bg-health-critical/20 text-health-critical border-health-critical/40 text-xs">
                        {card.healthScore}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {card.preview}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
