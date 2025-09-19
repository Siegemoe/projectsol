import { redirect } from "next/navigation";

export default function ChatRedirect() {
  // Public chat route is disabled; require sign-in and return to /app/chat after auth
  redirect("/signin?next=/app/chat");
}
