import { redirect } from "next/navigation";
import type { Route } from "next";

export default function AppIndexRedirect() {
  redirect("/app/home" as Route);
}
