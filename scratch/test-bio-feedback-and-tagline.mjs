import assert from "node:assert";
import fs from "node:fs";

console.log("=================================================================");
console.log(" TESTING BIO FEEDBACK DYNAMICS & PROFILE TAGLINE REMOVAL");
console.log("=================================================================\n");

// 1. Verify ProfileIdentityCard has correct dynamic title and message logic
const identityCardPath = "src/components/settings/ProfileIdentityCard.tsx";
const identityCardContent = fs.readFileSync(identityCardPath, "utf-8");

assert(
  identityCardContent.includes('feedbackTitle = "Display Name Saved!"'),
  "ProfileIdentityCard must support 'Display Name Saved!' title"
);
assert(
  identityCardContent.includes('feedbackTitle = "Bio Saved!"'),
  "ProfileIdentityCard must support 'Bio Saved!' title when only bio changed"
);
assert(
  identityCardContent.includes('feedbackMsg = "Creator bio successfully updated."'),
  "ProfileIdentityCard must set creator bio updated message"
);
assert(
  identityCardContent.includes('feedbackTitle = "Identity Saved!"'),
  "ProfileIdentityCard must support 'Identity Saved!' title when both changed"
);
assert(
  identityCardContent.includes("{successFeedback.title}"),
  "ProfileIdentityCard banner must dynamically render successFeedback.title"
);
assert(
  identityCardContent.includes("{successFeedback.message}"),
  "ProfileIdentityCard banner must dynamically render successFeedback.message"
);
console.log("[PASS] ProfileIdentityCard dynamically differentiates between Display Name, Bio, and Combined updates");

// 2. Verify static tagline is removed and custom bio is rendered in src/app/profile/page.tsx
const profilePagePath = "src/app/profile/page.tsx";
const profilePageContent = fs.readFileSync(profilePagePath, "utf-8");

assert(
  !profilePageContent.includes("Make Every Moment a Surprise. Ready to create your next unforgettable surprise moment?"),
  "Static tagline must be permanently removed from src/app/profile/page.tsx"
);
console.log("[PASS] Static tagline 'Make Every Moment a Surprise...' successfully removed");

assert(
  profilePageContent.includes("useUserProfileData"),
  "src/app/profile/page.tsx must import and use useUserProfileData"
);
assert(
  profilePageContent.includes("const bio = (profile?.bio ?? user?.bio ?? \"\").trim();"),
  "src/app/profile/page.tsx must resolve user custom bio"
);
assert(
  profilePageContent.includes("{bio ? ("),
  "src/app/profile/page.tsx must conditionally render bio only when set (blank for new users)"
);
console.log("[PASS] User custom bio renders dynamically and starts blank for new users without a bio");

// 3. Verify AuthContext and auth-user handle bio
const authUserPath = "src/lib/auth-user.ts";
const authUserContent = fs.readFileSync(authUserPath, "utf-8");
assert(authUserContent.includes("bio?: string | null;"), "SupriloUser must include optional bio property");
assert(authUserContent.includes("userMeta.bio"), "normalizeSupabaseUser must parse userMeta.bio");
console.log("[PASS] SupriloUser and normalizeSupabaseUser support creator bio");

const authContextPath = "src/context/AuthContext.tsx";
const authContextContent = fs.readFileSync(authContextPath, "utf-8");
assert(authContextContent.includes("bio?: string | null"), "setOptimisticProfile supports bio update");
console.log("[PASS] AuthContext supports optimistic bio updates");

console.log("\n=================================================================");
console.log(" RESULTS: ALL 4 TESTS PASSED CLEANLY!");
console.log("=================================================================\n");

