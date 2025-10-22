import 'dotenv/config';
import { Sensei } from '../sdk/index';

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const apiKey = process.env.INGEST_API_KEY || process.env.SENSEI_API_KEY;
  if (!apiKey) {
    console.error('Missing API key. Set SENSEI_API_KEY or INGEST_API_KEY.');
    process.exit(1);
  }
  
  console.log('API Key:', apiKey);
  console.log('API Key length:', apiKey.length);
  console.log('API Key has dot:', apiKey.includes('.'));

  const sdk = Sensei.init({ apiKey, baseUrl, batch: { size: 1 } });

  const conversationId = `demo_${Date.now()}`; // external id

  // Mock a longer conversation with realistic flow
  const t0 = Date.now();
  const T = (sec: number) => new Date(t0 + sec * 1000);
  const msgs = [
    { role: 'user' as const, content: 'Hey, how do I reset my password?', timestamp: T(0) },
    { role: 'assistant' as const, content: 'Go to Settings → Security → Reset Password.', timestamp: T(3) },
    { role: 'user' as const, content: "I can't find the Security tab.", timestamp: T(7) },
    { role: 'assistant' as const, content: 'Open your profile menu (top-right), then choose Account → Security.', timestamp: T(10) },
    { role: 'user' as const, content: 'Found it, but the reset link errors out.', timestamp: T(14) },
    { role: 'assistant' as const, content: 'Try the email reset flow instead: enter your email and check your inbox.', timestamp: T(18) },
    { role: 'user' as const, content: "No email received yet. It's been 2 minutes.", timestamp: T(140) },
    { role: 'assistant' as const, content: 'Please check spam, and verify noreply@acme.com is allowed. I can resend if needed.', timestamp: T(145) },
    { role: 'user' as const, content: 'Found it in spam—reset worked. Thanks!', timestamp: T(150) },
    { role: 'assistant' as const, content: 'Glad it worked! Anything else I can help with?', timestamp: T(153) },
  ];

  console.log(`Tracking conversation ${conversationId} to ${baseUrl} ...`);
  await sdk.track({ conversationId, messages: msgs, metadata: { channel: 'demo-agent' } });
  console.log('Tracked. Open dashboard and check conversations + analytics.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
