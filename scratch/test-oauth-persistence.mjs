import { normalizeSupabaseUser } from "../src/lib/auth-user.ts";
import assert from "node:assert";

console.log("=================================================================");
console.log(" TESTING IMMUNITY TO GOOGLE OAUTH METADATA OVERWRITES");
console.log("=================================================================\n");

// Case 1: User customized their display name to "Adarsh Mishra Boss", bio to custom, avatar to preset
const userAfterCustomization = {
  id: "test-user-123",
  email: "test@gmail.com",
  user_metadata: {
    // Custom protected fields
    custom_display_name: "Adarsh Mishra Boss",
    custom_bio: "My amazing custom creator bio",
    custom_avatar_type: "preset",
    custom_avatar_preset_id: "preset-male-2",
    custom_avatar_source: "manual",
    custom_avatar_url: "/avatars/presets/preset-male-2.svg",
    // Standard fields also updated initially
    full_name: "Adarsh Mishra Boss",
    avatar_url: "/avatars/presets/preset-male-2.svg",
    username: "adarsh",
    username_updated_at: "2026-11-10T18:25:31.500Z",
  },
};

// Now simulate user logging out and logging back in with Google OAuth:
// Google OAuth automatically overwrites 'full_name', 'name', 'picture', 'avatar_url' with Google Account defaults!
const userAfterGoogleRelogin = {
  id: "test-user-123",
  email: "test@gmail.com",
  user_metadata: {
    // Custom protected fields are PRESERVED (Google never touches them)
    custom_display_name: "Adarsh Mishra Boss",
    custom_bio: "My amazing custom creator bio",
    custom_avatar_type: "preset",
    custom_avatar_preset_id: "preset-male-2",
    custom_avatar_source: "manual",
    custom_avatar_url: "/avatars/presets/preset-male-2.svg",
    username: "adarsh",
    username_updated_at: "2026-11-10T18:25:31.500Z",
    // Google OAuth overwrites standard claims with Google Account name and picture:
    name: "Adarsh Mishra",
    full_name: "Adarsh Mishra",
    picture: "https://lh3.googleusercontent.com/default-google-pic.jpg",
    avatar_url: "https://lh3.googleusercontent.com/default-google-pic.jpg",
  },
};

const normalized = normalizeSupabaseUser(userAfterGoogleRelogin);

assert.strictEqual(
  normalized.displayName,
  "Adarsh Mishra Boss",
  "Display name MUST preserve custom_display_name over Google full_name!"
);
console.log("[PASS] Display name preserved across Google OAuth relogin:", normalized.displayName);

assert.strictEqual(
  normalized.bio,
  "My amazing custom creator bio",
  "Bio MUST preserve custom_bio over defaults!"
);
console.log("[PASS] Bio preserved across Google OAuth relogin:", normalized.bio);

assert.strictEqual(
  normalized.photoURL,
  "/avatars/presets/preset-male-2.svg",
  "Avatar MUST preserve custom preset avatar over Google OAuth picture!"
);
console.log("[PASS] Avatar preserved across Google OAuth relogin:", normalized.photoURL);

console.log("\n=================================================================");
console.log(" OAUTH RELOGIN PRESERVATION TEST PASSED (100%)");
console.log("=================================================================\n");
