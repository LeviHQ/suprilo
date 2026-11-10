import assert from "node:assert";
import fs from "node:fs";

console.log("=================================================================");
console.log(" AUDITING NOTIFICATION MOBILE CARD RESPONSIVE LAYOUT");
console.log("=================================================================\n");

const pagePath = "src/app/profile/notifications/page.tsx";
const pageContent = fs.readFileSync(pagePath, "utf-8");

// 1. Check title row does not have flex-wrap pushing timestamp onto separate empty row
assert(
  pageContent.includes('className="flex items-center gap-2 min-w-0"'),
  "Title row must be non-wrapping 'flex items-center gap-2 min-w-0'"
);

// 2. Check title row timestamp is hidden on mobile and visible on desktop
assert(
  pageContent.includes('className="text-[11px] text-brand-muted ml-auto shrink-0 hidden sm:inline-block"'),
  "Top timestamp must be hidden on mobile ('hidden sm:inline-block')"
);

// 3. Check bottom footer row has mobile timestamp with justify-between
assert(
  pageContent.includes('className="pt-1.5 flex items-center justify-between gap-2 text-xs"'),
  "Footer row must use 'justify-between' for action link and mobile timestamp"
);
assert(
  pageContent.includes('className="text-[11px] text-brand-muted shrink-0 sm:hidden"'),
  "Footer timestamp must be 'sm:hidden' so it only displays on mobile"
);

// 4. Check typography and badge
assert(
  pageContent.includes("tracking-normal truncate"),
  "Notification title must use tracking-normal"
);
assert(
  pageContent.includes("whitespace-nowrap shrink-0"),
  "Notification badges must use whitespace-nowrap shrink-0"
);

console.log("[PASS] Notification cards use dual-tier responsive layout without orphaned timestamps");

// 5. Verify documentation in canonical spec
const docPath = "docs/SUPRILO_NOTIFICATION_SYSTEM_ENGINEERING_SPECIFICATION.md";
const docContent = fs.readFileSync(docPath, "utf-8");
assert(
  docContent.includes("## 13. Mobile & Responsive UI Architecture for Notification Cards"),
  "Canonical spec must include Section 13 on mobile responsive layout"
);
console.log("[PASS] Notification engineering spec permanently documents mobile responsive rules");

console.log("\n=================================================================");
console.log(" RESULTS: ALL NOTIFICATION LAYOUT TESTS PASSED CLEANLY!");
console.log("=================================================================\n");

