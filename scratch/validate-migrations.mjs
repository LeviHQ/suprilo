import fs from 'fs';
import path from 'path';

const files = [
  'supabase/migrations/20261102000001_core_schema.sql',
  'supabase/migrations/20261102000002_functions_triggers.sql',
  'supabase/migrations/20261102000003_rls_security.sql',
  'supabase/migrations/20261102000004_storage_policies.sql'
];

let allPassed = true;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Dollar quotes
  const dollarMatches = content.match(/\$\$/g) || [];
  const dollarBalanced = dollarMatches.length % 2 === 0;

  // Parentheses balance
  let parenDepth = 0;
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i + 1];

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
    } else if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
    } else if (inString) {
      if (c === "'" && next === "'") {
        i++;
      } else if (c === "'") {
        inString = false;
      }
    } else {
      if (c === '-' && next === '-') {
        inLineComment = true;
        i++;
      } else if (c === '/' && next === '*') {
        inBlockComment = true;
        i++;
      } else if (c === "'") {
        inString = true;
      } else if (c === '(') {
        parenDepth++;
      } else if (c === ')') {
        parenDepth--;
      }
    }
  }

  const parenBalanced = parenDepth === 0;

  // Check statement endings (excluding empty lines and comments)
  const lines = content.split('\n');
  
  console.log(`[${file}]`);
  console.log(`  - Dollar quotes ($$): ${dollarMatches.length} (${dollarBalanced ? 'OK' : 'MISMATCH'})`);
  console.log(`  - Parentheses balance: ${parenDepth} (${parenBalanced ? 'OK' : 'MISMATCH'})`);
  
  if (!dollarBalanced || !parenBalanced) {
    allPassed = false;
  }
}

console.log(`\nOverall Syntax Audit: ${allPassed ? 'PASSED ALL CHECKS' : 'FAILED'}`);
process.exit(allPassed ? 0 : 1);

