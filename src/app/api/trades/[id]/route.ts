import {
  getObjectStorage,
  getTradeCatalog,
} from "@/backend/composition/trades";
import { requireAdminMutation } from "@/lib/admin-session";
import { tradeId, updateTradeInput } from "../validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = tradeId.safeParse((await context.params).id);
  if (!id.success) return new Response(null, { status: 404 });

  const trade = await getTradeCatalog().get(id.data);
  return trade
    ? Response.json(trade, { headers: { "Cache-Control": "no-store" } })
    : new Response(null, { status: 404 });
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const unauthorized = requireAdminMutation(request);
  if (unauthorized) return unauthorized;

  const id = tradeId.safeParse((await context.params).id);
  const input = updateTradeInput.safeParse(await request.json());
  if (!id.success || !input.success) {
    return Response.json({ error: "Invalid trade." }, { status: 400 });
  }

  const trade = await getTradeCatalog().update(id.data, input.data);
  return trade ? Response.json(trade) : new Response(null, { status: 404 });
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const unauthorized = requireAdminMutation(request);
  if (unauthorized) return unauthorized;

  const id = tradeId.safeParse((await context.params).id);
  if (!id.success) return new Response(null, { status: 404 });

  const keys = await getTradeCatalog().delete(id.data);
  await Promise.all(keys.map((key) => getObjectStorage().delete(key)));
  return new Response(null, { status: 204 });
}
