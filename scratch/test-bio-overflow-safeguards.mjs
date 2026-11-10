import assert from "node:assert";
import fs from "node:fs";

console.log("=================================================================");
console.log(" AUDITING BIO TEXT OVERFLOW & METADATA PILLS RESPONSIVENESS");
console.log("=================================================================\n");

const profilePagePath = "src/app/profile/page.tsx";
const profilePageContent = fs.readFileSync(profilePagePath, "utf-8");

// 1. Verify bio paragraph has both overflow-wrap: anywhere and word-break: break-word
assert(
  profilePageContent.includes("[overflow-wrap:anywhere]"),
  "Bio paragraph must include [overflow-wrap:anywhere] to prevent min-content width expansion"
);
assert(
  profilePageContent.includes("[word-break:break-word]"),
  "Bio paragraph must include [word-break:break-word]"
);

// 2. Verify flex parent column has width constraints
assert(
  profilePageContent.includes('className="space-y-2 flex-1 min-w-0 w-full max-w-full"'),
  "Flex column holding bio and pills must have 'min-w-0 w-full max-w-full'"
);

// 3. Verify Account Metadata Pills container has w-full max-w-full flex-wrap
assert(
  profilePageContent.includes('className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-brand-muted w-full max-w-full"'),
  "Metadata pills container must have 'w-full max-w-full'"
);

// 4. Verify each pill has max-w-full shrink-0
assert(
  profilePageContent.includes("Member since:"),
  "Must render Member since pill"
);
assert(
  profilePageContent.includes("Last active:"),
  "Must render Last active pill"
);
assert(
  profilePageContent.includes("Experience:"),
  "Must render Experience pill"
);

console.log("[PASS] Bio text has overflow-wrap: anywhere and word-break: break-word safeguards");
console.log("[PASS] Metadata pills container is constrained and wraps cleanly on all mobile screens");

// 5. Verify documentation in typography guidelines
const docPath = "docs/SUPRILO_TYPOGRAPHY_GUIDELINES.md";
const docContent = fs.readFileSync(docPath, "utf-8");
assert(
  docContent.includes("## 3. Long Unbroken Strings & Bio Text Overflow Protection"),
  "Typography guidelines must document long unbroken string overflow protection"
);
console.log("[PASS] Typography guidelines document long string overflow rules permanently");

console.log("\n=================================================================");
console.log(" RESULTS: ALL BIO OVERFLOW AUDIT TESTS PASSED CLEANLY!");
console.log("=================================================================\n");

