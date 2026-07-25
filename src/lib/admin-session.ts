import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const adminCookieName = "trade_journal_admin";
const sessionLifetimeSeconds = 12 * 60 * 60;

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function sessionSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET;
}

function sign(payload: string): string | undefined {
  const secret = sessionSecret();
  return secret
    ? createHmac("sha256", secret).update(payload).digest("base64url")
    : undefined;
}

export function isValidAuthorEntryKey(value: string): boolean {
  const configured = process.env.ADMIN_ENTRY_KEY;
  return Boolean(configured && safeEqual(value, configured));
}

export function verifyAdminPassword(password: string): boolean {
  const configured = process.env.ADMIN_PASSWORD;
  return Boolean(configured && safeEqual(password, configured));
}

export function createAdminSession(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds;
  const payload = `${expiresAt}.${randomBytes(24).toString("base64url")}`;
  const signature = sign(payload);
  if (!signature) throw new Error("ADMIN_SESSION_SECRET is not configured.");
  return `${payload}.${signature}`;
}

export function verifyAdminSession(value: string | undefined): boolean {
  if (!value) return false;
  const [expiresAt, nonce, signature] = value.split(".");
  if (!expiresAt || !nonce || !signature) return false;
  const expected = sign(`${expiresAt}.${nonce}`);
  return Boolean(
    expected &&
    safeEqual(signature, expected) &&
    Number(expiresAt) > Math.floor(Date.now() / 1000),
  );
}

export async function hasAdminSession(): Promise<boolean> {
  return verifyAdminSession((await cookies()).get(adminCookieName)?.value);
}

export function hasAdminRequestSession(request: Request): boolean {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim().split("="))
    .find(([name]) => name === adminCookieName)?.[1];
  return verifyAdminSession(cookie);
}

export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export function adminSessionCookie(value: string, secure: boolean): string {
  return [
    `${adminCookieName}=${value}`,
    "Path=/",
    `Max-Age=${sessionLifetimeSeconds}`,
    "HttpOnly",
    "SameSite=Strict",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function expiredAdminSessionCookie(secure: boolean): string {
  return [
    `${adminCookieName}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Strict",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function requireAdminMutation(request: Request): Response | undefined {
  if (!hasAdminRequestSession(request)) {
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }
  if (!isSameOriginMutation(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }
}
