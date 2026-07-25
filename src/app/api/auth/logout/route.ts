import { expiredAdminSessionCookie } from "@/lib/admin-session";

export async function POST(request: Request): Promise<Response> {
  const response = new Response(null, {
    status: 303,
    headers: { Location: new URL("/", request.url).toString() },
  });
  response.headers.set(
    "Set-Cookie",
    expiredAdminSessionCookie(new URL(request.url).protocol === "https:"),
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
