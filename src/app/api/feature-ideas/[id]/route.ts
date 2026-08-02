import { z } from "zod";
import { getFeatureIdeas } from "@/backend/composition/feature-ideas";
import { requireAdminMutation } from "@/lib/admin-session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const unauthorized = requireAdminMutation(request);
  if (unauthorized) return unauthorized;

  const id = z.uuid().safeParse((await context.params).id);
  if (!id.success) return new Response(null, { status: 404 });

  return (await getFeatureIdeas().remove(id.data))
    ? new Response(null, { status: 204 })
    : new Response(null, { status: 404 });
}
