import {
  adminSessionCookie,
  createAdminSession,
  isSecureRequest,
  isValidAuthorEntryKey,
  verifyAdminPassword,
} from "@/lib/admin-session";

interface LoginAttempt {
  failures: number;
  blockedUntil: number;
}

const attempts = new Map<string, LoginAttempt>();

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const entryKey = String(form.get("entryKey") ?? "");
  const password = String(form.get("password") ?? "");
  const client =
    request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const attempt = attempts.get(client) ?? { failures: 0, blockedUntil: 0 };
  const adminPath = `/admin/${encodeURIComponent(entryKey)}`;

  if (attempt.blockedUntil > Date.now()) {
    return new Response(null, {
      status: 303,
      headers: { Location: `${adminPath}?error=blocked` },
    });
  }

  if (!isValidAuthorEntryKey(entryKey) || !verifyAdminPassword(password)) {
    attempt.failures += 1;
    attempt.blockedUntil =
      attempt.failures >= 5 ? Date.now() + 15 * 60 * 1000 : 0;
    attempts.set(client, attempt);
    return new Response(null, {
      status: 303,
      headers: { Location: `${adminPath}?error=invalid` },
    });
  }

  attempts.delete(client);
  const response = new Response(null, {
    status: 303,
    headers: { Location: "/admin/trades" },
  });
  response.headers.set(
    "Set-Cookie",
    adminSessionCookie(createAdminSession(), isSecureRequest(request)),
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
