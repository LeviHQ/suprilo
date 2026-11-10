import assert from "node:assert";
import fs from "node:fs";

console.log("=================================================================");
console.log(" AUDITING SETTINGS CARDS SECTION BADGE INLINE ALIGNMENT");
console.log("=================================================================\n");

const cards = [
  {
    name: "CreatorMetaOverviewCard",
    file: "src/components/settings/CreatorMetaOverviewCard.tsx",
    badgeText: "Verified Account",
  },
  {
    name: "UsernameReservationCard",
    file: "src/components/settings/UsernameReservationCard.tsx",
    badgeText: "Unique Handle",
  },
  {
    name: "AvatarStudioCard",
    file: "src/components/settings/AvatarStudioCard.tsx",
    badgeText: "Personalize",
  },
  {
    name: "ProfileIdentityCard",
    file: "src/components/settings/ProfileIdentityCard.tsx",
    badgeText: "Public Info",
  },
  {
    name: "SecuritySessionCard",
    file: "src/components/settings/SecuritySessionCard.tsx",
    badgeText: "Authenticated",
  },
  {
    name: "DataPrivacyCard",
    file: "src/components/settings/DataPrivacyCard.tsx",
    badgeText: "Control",
  },
];

for (const card of cards) {
  const content = fs.readFileSync(card.file, "utf-8");

  // 1. Must use inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 on h3
  assert(
    content.includes("inline-flex flex-wrap items-center gap-x-2.5 gap-y-1"),
    `Card ${card.name} must use inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 on section title`
  );

  // 2. Badge must have whitespace-nowrap and shrink-0 so it never breaks into 2 lines
  assert(
    content.includes(card.badgeText),
    `Card ${card.name} must contain badge text: ${card.badgeText}`
  );
  assert(
    content.includes("whitespace-nowrap shrink-0"),
    `Card ${card.name} badge must contain whitespace-nowrap shrink-0`
  );

  console.log(`[PASS] ${card.name} matches inline badge geometry with '${card.badgeText}'`);
}

console.log("\n=================================================================");
console.log(" RESULTS: ALL 6 SETTINGS CARDS PASSED AUDIT CLEANLY!");
console.log("=================================================================\n");

