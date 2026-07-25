import {
    expiredAdminSessionCookie,
    isSecureRequest,
} from "@/lib/admin-session";

export async function POST(request: Request): Promise<Response> {
    const response = new Response(null, {
        status: 303,
        headers: { Location: "/" },
    });
    response.headers.set(
        "Set-Cookie",
        expiredAdminSessionCookie(isSecureRequest(request)),
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
}
