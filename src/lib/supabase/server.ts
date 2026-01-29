import { createClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/env";

export function createSupabaseServerClient() {
  const env = getPublicEnv();

  // For now we use the public anon key on the server too.
  // When you add Supabase Auth + RLS, we can switch to cookie-based auth.
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

