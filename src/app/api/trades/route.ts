import { getTradeCatalog } from "@/backend/composition/trades";
import { requireAdminMutation } from "@/lib/admin-session";
import { createTradeInput } from "./validation";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const trades = await getTradeCatalog().list();
  return Response.json(trades, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const unauthorized = requireAdminMutation(request);
  if (unauthorized) return unauthorized;

  const input = createTradeInput.safeParse(await request.json());
  if (!input.success) {
    return Response.json({ error: "Invalid trade." }, { status: 400 });
  }

  const trade = await getTradeCatalog().create(input.data);
  return Response.json(trade, { status: 201 });
}
