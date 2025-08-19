import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client-side Supabase (uses localStorage)
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Server-side Supabase for RSC/Route Handlers.
 * In RSC we cannot set cookies, so only get() is provided here.
 * For Route Handlers where you need to mutate cookies (e.g., signOut),
 * create a client inline with a NextResponse and wire set/remove there.
 */
export async function supabaseServer() {
  const c = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => c.get(name)?.value,
      },
    }
  );
}
