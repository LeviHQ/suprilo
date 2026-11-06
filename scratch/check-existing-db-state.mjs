import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envContent = fs.readFileSync(".env", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || "").trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
});

const client = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);

async function check() {
  // Query badges
  const { data: badges, error: bErr } = await client.from("badges").select("id, name, points").limit(5);
  console.log("Badges query:", { count: badges?.length, error: bErr?.message, sample: badges });

  // Query functions via rpc
  const { data: rpcTest, error: rpcErr } = await client.rpc("derive_level_from_xp", { p_xp: 50 });
  console.log("derive_level_from_xp RPC:", { result: rpcTest, error: rpcErr?.message });
}

check().catch(console.error);

