import Chat2Pane from "@/components/chat/Chat2Pane";

export default async function AppChatPage() {
  // For development - bypass auth check when running locally
  if (process.env.NODE_ENV === "development") {
    return (
      <div className="-mx-2 sm:-mx-4 h-full min-h-0 flex flex-col">
        <Chat2Pane />
      </div>
    );
  }

  // Production auth check
  const { supabaseServer } = await import("@/lib/supabase-server");
  const { isAllowlisted } = await import("@/lib/allowlist");
  const { redirect } = await import("next/navigation");
  
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/signin?next=${encodeURIComponent("/app/chat")}`);
  }
  if (user.email && !isAllowlisted(user.email)) {
    return redirect("/not-invited");
  }

  return (
    <div className="-mx-2 sm:-mx-4 h-full min-h-0 flex flex-col">
      <Chat2Pane />
    </div>
  );
}
