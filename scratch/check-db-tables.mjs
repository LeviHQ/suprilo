import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const lines = env.split("\n");
const getVal = (k) => {
  const line = lines.find((l) => l.trim().startsWith(k + "="));
  if (!line) return "";
  return line.split("=")[1].trim().replace(/^['"]|['"]$/g, "");
};

const url = getVal("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = getVal("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, serviceKey);

async function checkTables() {
  const tables = ["cards", "card_metrics", "notifications", "user_gamification_stats", "profiles"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("count").limit(1);
    console.log(`Table ${t}:`, error ? `ERROR: ${error.code} ${error.message}` : "EXISTS");
  }

  // Also check auth.users list
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.log("Auth users error:", authErr);
  } else {
    console.log("Auth users count:", authData.users.length);
    console.log("Auth users:", authData.users.map(u => ({
      id: u.id,
      email: u.email,
      metadata: u.user_metadata
    })));
  }
}

checkTables();

