import { useState } from 'react';
import { ConversationDetailModal } from '../ConversationDetailModal';
import { Button } from '@/components/ui/button';

export default function ConversationDetailModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)} data-testid="button-open-modal">
        Open Conversation Detail
      </Button>
      <ConversationDetailModal
        conversationId="C-4520"
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
