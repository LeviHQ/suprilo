import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClientInstance: SupabaseClient | null = null;

/**
 * Creates or retrieves the singleton Supabase client for browser execution.
 * Reusing a single client instance maintains persistent HTTP keep-alive connections,
 * avoids memory leaks, and prevents duplicate auth listeners.
 */
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase browser environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required."
    );
  }

  // Guard against SSR hydration mismatches
  if (typeof window === "undefined") {
    return createBrowserClient(supabaseUrl, supabaseKey);
  }

  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient(supabaseUrl, supabaseKey);
  }

  return browserClientInstance;
}
