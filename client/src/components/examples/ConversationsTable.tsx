import { ConversationsTable } from '../ConversationsTable';

export default function ConversationsTableExample() {
  return (
    <div className="p-6">
      <ConversationsTable onRowClick={(id) => console.log('Row clicked:', id)} />
    </div>
  );
}
