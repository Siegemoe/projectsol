import { redirect } from "next/navigation";

export default function EmailToolPage() {
  // Make email accessible only inside Chat. Visiting this route redirects to chat
  // and opens the Email panel there.
  redirect("/app/chat?email=1");
}
