import { getFeatureIdeas } from "@/backend/composition/feature-ideas";
import { hasAdminRequestSession } from "@/lib/admin-session";
import { publicMessageInput } from "@/lib/public-message-validation";

export async function GET(request: Request): Promise<Response> {
  return Response.json(await getFeatureIdeas().list(), {
    headers: {
      "Cache-Control": "no-store",
      "X-Feature-Ideas-Manage": String(hasAdminRequestSession(request)),
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  const input = publicMessageInput.safeParse(await request.json());
  if (!input.success) {
    return Response.json({ error: "Invalid feature idea." }, { status: 400 });
  }
  return Response.json(await getFeatureIdeas().add(input.data), {
    status: 201,
  });
}
