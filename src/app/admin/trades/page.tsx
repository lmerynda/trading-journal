import { redirect } from "next/navigation";
import { JournalApp } from "@/components/JournalApp";
import { hasAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminTradesPage() {
  if (!(await hasAdminSession())) redirect("/");
  return <JournalApp />;
}
