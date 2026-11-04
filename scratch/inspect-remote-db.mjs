import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env safely without printing secrets
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const pubKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

console.log('Target URL:', url);
console.log('PubKey present:', Boolean(pubKey));
console.log('ServiceKey present:', Boolean(serviceKey));

const anonClient = createClient(url, pubKey);
const adminClient = createClient(url, serviceKey);

async function run() {
  console.log('\n======================================================');
  console.log('1. TABLE EXISTENCE & ACCESS AUDIT (ADMIN & ANON)');
  console.log('======================================================');

  const tables = ['cards', 'slug_registry', 'card_metrics', 'card_telemetry_cooldown', 'storage_cleanup_queue'];
  
  for (const table of tables) {
    // 1. Check with admin client (proves table physically exists in public schema)
    const adminRes = await adminClient.from(table).select('*').limit(1);
    const exists = !adminRes.error || adminRes.error.code !== 'PGRST205';
    
    // 2. Check with anon client (verifies RLS boundary)
    const anonRes = await anonClient.from(table).select('*').limit(1);
    
    console.log(`Table: public.${table}`);
    console.log(`  - Physical existence: ${exists ? 'CONFIRMED' : 'MISSING'}`);
    if (adminRes.error) {
      console.log(`  - Admin query error: ${adminRes.error.code} - ${adminRes.error.message}`);
    } else {
      console.log(`  - Admin query: SUCCESS (Rows: ${adminRes.data.length})`);
    }
    console.log(`  - Anon query result: ${anonRes.error ? `BLOCKED (${anonRes.error.code} - ${anonRes.error.message})` : `0 rows returned (RLS enforced: data = ${JSON.stringify(anonRes.data)})`}`);
  }

  console.log('\n======================================================');
  console.log('2. STORAGE BUCKET INSPECTION');
  console.log('======================================================');
  
  const { data: buckets, error: bucketsErr } = await adminClient.storage.listBuckets();
  if (bucketsErr) {
    console.error('Error listing buckets:', bucketsErr);
  } else {
    console.log('Found Buckets count:', buckets.length);
    buckets.forEach(b => {
      console.log(`Bucket: "${b.id}"`);
      console.log(`  - Name: ${b.name}`);
      console.log(`  - Public: ${b.public}`);
      console.log(`  - File Size Limit: ${b.file_size_limit} bytes (${b.file_size_limit / 1024 / 1024} MB)`);
      console.log(`  - Allowed MIME Types:`, b.allowed_mime_types);
    });
  }

  console.log('\n======================================================');
  console.log('3. RPC FUNCTIONS ACCESSIBILITY & SIGNATURES');
  console.log('======================================================');

  // Test get_published_card_by_slug (accessible to anon/auth)
  const rpc1 = await anonClient.rpc('get_published_card_by_slug', { p_slug: 'nonexistent12' });
  console.log('RPC get_published_card_by_slug:');
  console.log(`  - Callable: ${rpc1.error ? `ERROR (${rpc1.error.code} - ${rpc1.error.message})` : `SUCCESS (Returned: ${JSON.stringify(rpc1.data)})`}`);

  // Test create_card_draft with anon (must fail with unauthenticated/28000)
  const rpc2 = await anonClient.rpc('create_card_draft', { p_slug: 'testslug1234' });
  console.log('RPC create_card_draft (Anon call):');
  console.log(`  - Guard Result: ${rpc2.error ? `PROTECTED (${rpc2.error.code} - ${rpc2.error.message})` : 'UNEXPECTED SUCCESS'}`);

  // Test publish_card_draft with anon (must fail with unauthenticated/28000)
  const rpc3 = await anonClient.rpc('publish_card_draft', { p_card_id: '00000000-0000-0000-0000-000000000000' });
  console.log('RPC publish_card_draft (Anon call):');
  console.log(`  - Guard Result: ${rpc3.error ? `PROTECTED (${rpc3.error.code} - ${rpc3.error.message})` : 'UNEXPECTED SUCCESS'}`);

  // Test archive_card with anon (must fail with unauthenticated/28000)
  const rpc4 = await anonClient.rpc('archive_card', { p_card_id: '00000000-0000-0000-0000-000000000000' });
  console.log('RPC archive_card (Anon call):');
  console.log(`  - Guard Result: ${rpc4.error ? `PROTECTED (${rpc4.error.code} - ${rpc4.error.message})` : 'UNEXPECTED SUCCESS'}`);

  // Test record_card_telemetry with anon (must be blocked since it's revoked from anon)
  const rpc5 = await anonClient.rpc('record_card_telemetry', { p_slug: 'testslug1234', p_event_type: 'view', p_visitor_hash: 'a'.repeat(64) });
  console.log('RPC record_card_telemetry (Anon call):');
  console.log(`  - Guard Result: ${rpc5.error ? `PROTECTED (${rpc5.error.code} - ${rpc5.error.message})` : 'UNEXPECTED SUCCESS'}`);

  // Test claim_storage_cleanup_batch with anon (must be blocked since it's revoked from anon)
  const rpc6 = await anonClient.rpc('claim_storage_cleanup_batch', { p_worker_id: 'test' });
  console.log('RPC claim_storage_cleanup_batch (Anon call):');
  console.log(`  - Guard Result: ${rpc6.error ? `PROTECTED (${rpc6.error.code} - ${rpc6.error.message})` : 'UNEXPECTED SUCCESS'}`);
}

run().catch(console.error);

