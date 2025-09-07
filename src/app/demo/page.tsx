import { redirect } from "next/navigation";

/**
 * /demo route disabled.
 * The original demo page was archived at: archive/demo-page.tsx
 * Rationale: one-off placeholder/demo content should not ship as an active route.
 */
export default function DemoRedirect() {
  redirect("/");
}
