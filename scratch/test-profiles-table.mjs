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

console.log("Supabase URL configured:", url ? "YES" : "NO");
console.log("Service Key configured:", serviceKey ? "YES" : "NO");

const supabase = createClient(url, serviceKey);

async function test() {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) {
    console.error("profiles table error:", error);
  } else {
    console.log("profiles count:", data.length);
    console.log("profiles:", JSON.stringify(data, null, 2));
  }
}

test();

