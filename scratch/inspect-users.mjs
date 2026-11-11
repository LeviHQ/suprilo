import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const lines = env.split("\n");
const getVal = (k) => {
  const line = lines.find((l) => l.trim().startsWith(k + "="));
  if (!line) return "";
  return line.split("=")[1].trim().replace(/^['"]|['"]$/g, "");
};

const supabase = createClient(getVal("NEXT_PUBLIC_SUPABASE_URL"), getVal("SUPABASE_SERVICE_ROLE_KEY"));

async function inspect() {
  const { data } = await supabase.auth.admin.listUsers();
  for (const u of data.users) {
    console.log("-----------------------------------------");
    console.log("Email:", u.email);
    console.log("Metadata:", u.user_metadata);
  }
}

inspect();

