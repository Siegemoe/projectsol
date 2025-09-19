import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { isAllowlisted } from "@/lib/allowlist";
import SolChat from "@/components/SolChat";

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
      <SolChat title="Sol" apiPath="/api/sol-chat" />
    </div>
  );
}
