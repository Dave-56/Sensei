// Lightweight queue wrapper. If BullMQ is available and REDIS_URL is set,
// it uses a Redis-backed queue; otherwise it falls back to immediate processing.
import { processConversation } from "../workers/processing";
import { ingestConversation } from "../workers/ingestion";

type AddJobFn = (conversationId: string) => Promise<void>;
type AddIngestJobFn = (data: any) => Promise<void>;

let addJobImpl: AddJobFn | null = null;
let addIngestJobImpl: AddIngestJobFn | null = null;

export async function addProcessConversationJob(conversationId: string) {
  if (!addJobImpl) {
    addJobImpl = await initProcessQueue();
  }
  return addJobImpl(conversationId);
}

export async function addIngestConversationJob(data: any) {
  if (!addIngestJobImpl) {
    addIngestJobImpl = await initIngestQueue();
  }
  return addIngestJobImpl(data);
}

async function initProcessQueue(): Promise<AddJobFn> {
  const url = process.env.REDIS_URL;
  if (!url) {
    // No Redis: inline processing
    return async (conversationId: string) => {
      await processConversation(conversationId);
    };
  }

  try {
    // Dynamically import bullmq if available
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { Queue, Worker } = await import('bullmq');
    
    const connection = { 
      url,
      tls: url.startsWith('rediss://') ? {
        rejectUnauthorized: false
      } : undefined
    } as any;
    const queueName = 'process-conversation';
    const queue = new Queue(queueName, { connection });

    new Worker(
      queueName,
      async (job) => {
        const id = job.data.conversationId as string;
        await processConversation(id);
      },
      { connection },
    );

    return async (conversationId: string) => {
      await queue.add('process', { conversationId }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
    };
  } catch (err) {
    console.warn('BullMQ not installed or failed to initialize; falling back to inline processing.');
    return async (conversationId: string) => {
      await processConversation(conversationId);
    };
  }
}

async function initIngestQueue(): Promise<AddIngestJobFn> {
  const url = process.env.REDIS_URL;
  if (!url) {
    // No Redis: inline processing
    return async (data: any) => {
      const conversationId = await ingestConversation(data);
      if (conversationId) {
        await addProcessConversationJob(conversationId);
      }
    };
  }

  try {
    // Dynamically import bullmq if available
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { Queue, Worker } = await import('bullmq');
    
    const connection = { 
      url,
      tls: url.startsWith('rediss://') ? {
        rejectUnauthorized: false
      } : undefined
    } as any;
    const queueName = 'ingest-conversation';
    const queue = new Queue(queueName, { connection });

    new Worker(
      queueName,
      async (job) => {
        const data = job.data;
        const conversationId = await ingestConversation(data);
        // Chain to process queue after ingestion
        if (conversationId) {
          await addProcessConversationJob(conversationId);
        }
      },
      { connection },
    );

    return async (data: any) => {
      await queue.add('ingest', data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
    };
  } catch (err) {
    console.warn('BullMQ not installed or failed to initialize; falling back to inline processing.');
    return async (data: any) => {
      await ingestConversation(data);
    };
  }
}

