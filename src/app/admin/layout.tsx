import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await hasAdminSession())) redirect("/");
  return children;
}
