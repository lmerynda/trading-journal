import { createHealthCheck } from "@/backend/composition/health";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const health = await createHealthCheck().execute();

  return Response.json(health, {
    status: health.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
