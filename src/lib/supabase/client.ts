import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a reusable Supabase client for browser (Client Component) execution.
 * Reads public-safe environment variables and manages browser cookies automatically.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase browser environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

