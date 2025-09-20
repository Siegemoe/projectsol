import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { isAllowlisted } from "@/lib/allowlist";
import Chat2Pane from "@/components/chat/Chat2Pane";

export default async function AppChatPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signin?next=${encodeURIComponent("/app/chat")}`);
  }
  if (!isAllowlisted(user.email)) {
    redirect("/not-invited");
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      <Chat2Pane />
    </div>
  );
}
