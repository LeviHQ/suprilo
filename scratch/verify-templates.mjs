import assert from "node:assert/strict";
import { SU_PRILO_TEMPLATES } from "../src/data/templates.ts";

console.log(`\nVerified ${SU_PRILO_TEMPLATES.length} templates in SU_PRILO_TEMPLATES array:`);
SU_PRILO_TEMPLATES.forEach((tpl, index) => {
  console.log(`${index + 1}. [${tpl.category}] ${tpl.id} - "${tpl.title}"`);
});

const EXPECTED_TEMPLATES = [
  "bday-midnight-celebration",
  "bday-party-confetti",
  "bday-royal-vintage",
  "love-secret-dinner",
  "love-golden-forever",
  "love-cute-doodle",
  "friendship-partner-in-crime",
  "friendship-grateful-heart",
  "anniv-milestone-gold",
  "anniv-storybook-love",
  "thankyou-blooming-gratitude",
  "thankyou-mentor-honor",
  "congrats-new-job-sky",
  "congrats-baby-arrival",
  "just-because-midday-smile",
  "just-because-virtual-hug",
];

assert.equal(SU_PRILO_TEMPLATES.length, 16, "SU_PRILO_TEMPLATES must contain exactly 16 items");
const actualIds = SU_PRILO_TEMPLATES.map(t => t.id).sort();
const expectedIds = [...EXPECTED_TEMPLATES].sort();

assert.deepEqual(actualIds, expectedIds, "All 16 template IDs must match expected catalog IDs exactly");

console.log("\n✅ [PASS] Genuine programmatic verification succeeded: Exactly 16 templates confirmed!\n");
