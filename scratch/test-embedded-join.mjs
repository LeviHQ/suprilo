import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envContent = fs.readFileSync(".env", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || "").trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
});

const client = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);

async function testJoin() {
  console.log("Testing embedded resource join between cards and card_metrics...");
  const { data, error } = await client
    .from("cards")
    .select(`
      id,
      slug,
      status,
      created_at,
      card_metrics (
        views_count,
        reveals_count,
        last_viewed_at,
        last_revealed_at
      )
    `)
    .limit(3);

  if (error) {
    console.error("Embedded join error:", error);
  } else {
    console.log("Embedded join successful! Sample:", JSON.stringify(data, null, 2));
  }
}

testJoin().catch(console.error);

