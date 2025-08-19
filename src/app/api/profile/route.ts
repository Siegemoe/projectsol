import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email ?? null,
    display_name: (user.user_metadata as any)?.name ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
