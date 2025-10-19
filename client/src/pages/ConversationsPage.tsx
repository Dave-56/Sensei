import { useState } from "react";
import { ConversationsTable } from "@/components/ConversationsTable";
import { ConversationDetailModal } from "@/components/ConversationDetailModal";

export default function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRowClick = (id: string) => {
    setSelectedConversation(id);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Conversations</h1>
        <p className="text-sm text-muted-foreground">
          View and analyze all conversation interactions
        </p>
      </div>

      <ConversationsTable onRowClick={handleRowClick} />

      <ConversationDetailModal
        conversationId={selectedConversation}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
