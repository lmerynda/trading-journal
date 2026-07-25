import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { hasAdminSession, isValidAuthorEntryKey } from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function AuthorLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ entryKey: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ entryKey }, { error }] = await Promise.all([params, searchParams]);
  if (!isValidAuthorEntryKey(entryKey)) notFound();
  if (await hasAdminSession()) redirect("/admin/trades");

  return (
    <main className="author-login-shell">
      <form className="author-login" action="/api/auth/login" method="post">
        <span className="library-monogram" aria-hidden="true">
          T
        </span>
        <p className="eyebrow">Private authoring</p>
        <h1>Open the editor</h1>
        <p>Enter the owner password to create or revise trade reviews.</p>
        <input type="hidden" name="entryKey" value={entryKey} />
        <label htmlFor="owner-password">Password</label>
        <input
          id="owner-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
        />
        {error && (
          <p className="login-error" role="alert">
            {error === "blocked"
              ? "Too many attempts. Try again in 15 minutes."
              : "The password was not accepted."}
          </p>
        )}
        <button type="submit">Continue</button>
      </form>
    </main>
  );
}
