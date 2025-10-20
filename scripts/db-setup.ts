import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    // Ensure required extensions exist (idempotent)
    await client.query('create extension if not exists pgcrypto');
    await client.query('create extension if not exists vector');
    console.log('Extensions ensured: pgcrypto, vector');

    // Create a convenience view for connected providers from Supabase Auth
    await client.query(`
      create or replace view public.user_oauth_connections_v as
      select
        i.user_id,
        i.provider,
        (i.identity_data->>'sub') as provider_user_id,
        i.created_at as connected_at
      from auth.identities i;
    `);
    console.log('View ensured: public.user_oauth_connections_v');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
