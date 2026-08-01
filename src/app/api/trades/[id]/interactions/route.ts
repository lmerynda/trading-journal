import {
  getTradeCatalog,
  getTradeInteractions,
} from "@/backend/composition/trades";
import { tradeId } from "../../validation";
import { commentInput, reactionInput } from "./validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function parseTrade(context: RouteContext): Promise<string | undefined> {
  const id = tradeId.safeParse((await context.params).id);
  if (!id.success || !(await getTradeCatalog().get(id.data))) return undefined;
  return id.data;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = await parseTrade(context);
  if (!id) return new Response(null, { status: 404 });

  const interactions = await getTradeInteractions().get(id);
  return Response.json(interactions, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = await parseTrade(context);
  if (!id) return new Response(null, { status: 404 });

  const input = commentInput.safeParse(await request.json());
  if (!input.success) {
    return Response.json({ error: "Invalid comment." }, { status: 400 });
  }
  const comment = await getTradeInteractions().addComment(id, input.data);
  return comment
    ? Response.json(comment, { status: 201 })
    : Response.json({ error: "Invalid reply target." }, { status: 400 });
}

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = await parseTrade(context);
  if (!id) return new Response(null, { status: 404 });

  const input = reactionInput.safeParse(await request.json());
  if (!input.success) {
    return Response.json({ error: "Invalid reaction." }, { status: 400 });
  }
  return Response.json(
    await getTradeInteractions().addReaction(id, input.data.value),
  );
}
