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

async function testRpc() {
  // Test if an exec_sql or similar rpc exists
  const { data, error } = await supabase.rpc("exec_sql", { query: "SELECT 1" });
  console.log("rpc exec_sql:", { data, error });
}

testRpc();

