import assert from "node:assert/strict";

const SLUG_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const REGEX = /^[2-9a-hj-km-np-z]{12}$/;

console.log("\n🧪 Testing Slug Alphabet & SQL CHECK Regex Alignment...\n");

// 1. Verify Alphabet length and contents
assert.equal(SLUG_ALPHABET.length, 31, "Alphabet must have 31 characters");
const excluded = ["0", "1", "i", "l", "o", "I", "L", "O", "-", "_", " "];
excluded.forEach(char => {
  assert(!SLUG_ALPHABET.includes(char), `Alphabet must NOT include "${char}"`);
});
console.log("  ✓ Alphabet correctly excludes ambiguous characters: 0, 1, i, l, o");

// 2. Positive Test Cases: Every valid 12-char slug from alphabet must pass
for (let i = 0; i < 1000; i++) {
  let slug = "";
  for (let j = 0; j < 12; j++) {
    slug += SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)];
  }
  assert(REGEX.test(slug), `Generated slug "${slug}" must pass regex`);
}
console.log("  ✓ 1,000 randomly generated 12-char slugs from alphabet PASSED regex");

// 3. Negative Test Cases
const invalidSlugs = [
  "23456789abcd", // wait, this contains 2-9, a, b, c, d -> valid!
  "23456789abc0", // contains '0'
  "23456789abc1", // contains '1'
  "23456789abci", // contains 'i'
  "23456789abcl", // contains 'l'
  "23456789abco", // contains 'o'
  "23456789abcI", // uppercase 'I'
  "23456789abcO", // uppercase 'O'
  "23456789abcL", // uppercase 'L'
  "23456789ab-c", // hyphen '-'
  "23456789ab_c", // underscore '_'
  "23456789ab",   // length 10 (too short)
  "23456789abc",  // length 11 (too short)
  "23456789abcdef", // length 14 (too long)
  "23456789abcdefg", // length 15 (too long)
  " 23456789abc", // leading space
  "23456789abc ", // trailing space
  "23456789ab@c", // special character
];

invalidSlugs.slice(1).forEach(slug => {
  assert(!REGEX.test(slug), `Invalid slug "${slug}" must FAIL regex`);
});
console.log("  ✓ All 17 invalid/ambiguous/wrong-length slugs FAILED regex as expected");

console.log("\n✅ Slug alphabet and regex alignment verified with 100% precision!\n");

