import {
  getObjectStorage,
  getTradeCatalog,
} from "@/backend/composition/trades";
import { tradeId } from "../../trades/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = tradeId.safeParse((await context.params).id);
  if (!id.success) return new Response(null, { status: 404 });

  const image = await getTradeCatalog().getImage(id.data);
  if (!image) return new Response(null, { status: 404 });

  const object = await getObjectStorage().get(image.objectKey);
  if (!object) return new Response(null, { status: 404 });

  const body = new ArrayBuffer(object.body.byteLength);
  new Uint8Array(body).set(object.body);

  return new Response(body, {
    headers: {
      "Content-Type": object.contentType,
      "Content-Length": String(object.body.byteLength),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
