import fs from 'fs';

const f1 = fs.readFileSync('supabase/migrations/20261102000001_core_schema.sql', 'utf8');
const f2 = fs.readFileSync('supabase/migrations/20261102000002_functions_triggers.sql', 'utf8');
const f3 = fs.readFileSync('supabase/migrations/20261102000003_rls_security.sql', 'utf8');
const f4 = fs.readFileSync('supabase/migrations/20261102000004_storage_policies.sql', 'utf8');

const fields = [
  'recipient_name', 'sender_name', 'occasion_tag', 'primary_message',
  'secondary_message', 'foil_style', 'cover_text', 'bg_palette',
  'sticker', 'font_family', 'photo_path', 'reveal_threshold', 'sound_enabled'
];

console.log('--- 1. Checking 13 editable fields in Lifecycle Freeze ---');
let allF2 = true;
fields.forEach(f => {
  const inF2 = f2.includes(`NEW.${f} IS DISTINCT FROM OLD.${f}`);
  if (!inF2) {
    console.error('MISSING in lifecycle freeze:', f);
    allF2 = false;
  }
});
console.log('All 13 fields checked in enforce_card_lifecycle:', allF2 ? 'OK' : 'FAIL');

console.log('\n--- 2. Checking 13 editable fields in Column-Level Grants ---');
let allF3 = true;
fields.forEach(f => {
  const inF3 = f3.includes(f);
  if (!inF3) {
    console.error('MISSING in column grant:', f);
    allF3 = false;
  }
});
console.log('All 13 fields checked in column-level grants:', allF3 ? 'OK' : 'FAIL');

console.log('\n--- 3. Checking Storage Policies folder-2 validation ---');
const hasFolder2Regex = f4.includes("(storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'");
const hasExistsCheck = f4.includes('SELECT 1 FROM public.cards c');
console.log('Storage folder 2 regex check:', hasFolder2Regex ? 'OK' : 'FAIL');
console.log('Storage card ownership exists check:', hasExistsCheck ? 'OK' : 'FAIL');

console.log('\n--- 4. Checking publish_card_draft and archive_card in F2 and F3 ---');
console.log('publish_card_draft in F2:', f2.includes('FUNCTION public.publish_card_draft(p_card_id uuid)'));
console.log('archive_card in F2:', f2.includes('FUNCTION public.archive_card(p_card_id uuid)'));
console.log('publish_card_draft in F3:', f3.includes('FUNCTION public.publish_card_draft(uuid)'));
console.log('archive_card in F3:', f3.includes('FUNCTION public.archive_card(uuid)'));

console.log('\n--- 5. Checking that status is NOT in column UPDATE grants ---');
const grantMatch = f3.match(/GRANT UPDATE \(([\s\S]*?)\) ON TABLE public\.cards TO authenticated;/);
if (grantMatch) {
  const grantedCols = grantMatch[1].split(',').map(s => s.trim());
  console.log('Granted columns count:', grantedCols.length);
  console.log('Is status granted to authenticated?', grantedCols.includes('status'));
  console.log('Is draft_slot granted to authenticated?', grantedCols.includes('draft_slot'));
  console.log('Is published_at granted to authenticated?', grantedCols.includes('published_at'));
  console.log('Is user_id granted to authenticated?', grantedCols.includes('user_id'));
  console.log('Is slug granted to authenticated?', grantedCols.includes('slug'));
}

