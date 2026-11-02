import fs from 'fs';

const f1 = fs.readFileSync('supabase/migrations/20261102000001_core_schema.sql', 'utf8');
const f2 = fs.readFileSync('supabase/migrations/20261102000002_functions_triggers.sql', 'utf8');

// Parse cards table columns
const cardsTableBlock = f1.match(/CREATE TABLE public\.cards \(([\s\S]*?)\n\);/)[1];
const cardsColumns = cardsTableBlock.split('\n')
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('--') && !l.startsWith('CONSTRAINT'))
  .map(l => l.split(/\s+/)[0]);

console.log('Cards columns count:', cardsColumns.length);
console.log('Cards columns:', cardsColumns);

// Check columns in create_card_draft INSERT statement
const insertBlock = f2.match(/INSERT INTO public\.cards \(([\s\S]*?)\)\s*VALUES\s*\(([\s\S]*?)\)\s*RETURNING/);
if (insertBlock) {
  const insertCols = insertBlock[1].split(',').map(c => c.trim());
  const insertVals = insertBlock[2].split(',').map(v => v.trim());
  console.log(`create_card_draft INSERT cols: ${insertCols.length}, vals: ${insertVals.length}`);
  if (insertCols.length !== insertVals.length) {
    console.error('MISMATCH: insert cols !== insert vals');
  }
  const missing = insertCols.filter(c => !cardsColumns.includes(c));
  if (missing.length > 0) {
    console.error('Unknown columns in INSERT:', missing);
  } else {
    console.log('All INSERT columns exist in public.cards: OK');
  }
}

// Check lifecycle trigger references
const lifecycleBlock = f2.match(/FUNCTION public\.enforce_card_lifecycle\(\)([\s\S]*?)\$\$[\s\S]*?LANGUAGE plpgsql/)[1];
const oldRefs = [...new Set([...lifecycleBlock.matchAll(/OLD\.([a-zA-Z0-9_]+)/g)].map(m => m[1]))];
const newRefs = [...new Set([...lifecycleBlock.matchAll(/NEW\.([a-zA-Z0-9_]+)/g)].map(m => m[1]))];

console.log('Lifecycle trigger OLD refs:', oldRefs);
console.log('Lifecycle trigger NEW refs:', newRefs);

const invalidOld = oldRefs.filter(c => !cardsColumns.includes(c));
const invalidNew = newRefs.filter(c => !cardsColumns.includes(c));
if (invalidOld.length || invalidNew.length) {
  console.error('Invalid refs in lifecycle trigger:', { invalidOld, invalidNew });
} else {
  console.log('All lifecycle trigger column references are valid: OK');
}

// Check delete trigger references
const deleteBlock = f2.match(/FUNCTION public\.process_cards_before_delete\(\)([\s\S]*?)\$\$[\s\S]*?LANGUAGE plpgsql/)[1];
const deleteOldRefs = [...new Set([...deleteBlock.matchAll(/OLD\.([a-zA-Z0-9_]+)/g)].map(m => m[1]))];
console.log('Delete trigger OLD refs:', deleteOldRefs);
const invalidDeleteOld = deleteOldRefs.filter(c => !cardsColumns.includes(c));
if (invalidDeleteOld.length) {
  console.error('Invalid refs in delete trigger:', invalidDeleteOld);
} else {
  console.log('All delete trigger column references are valid: OK');
}

