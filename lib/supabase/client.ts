import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // During SSR/build, env vars may not be available — use placeholders that
  // prevent the throw. The client is never used for real network calls server-side.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  return createBrowserClient(url, key);
}
