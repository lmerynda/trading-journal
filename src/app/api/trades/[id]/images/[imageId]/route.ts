import {
  getObjectStorage,
  getTradeCatalog,
} from "@/backend/composition/trades";
import { tradeId } from "../../../validation";

interface RouteContext {
  params: Promise<{ id: string; imageId: string }>;
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const params = await context.params;
  const id = tradeId.safeParse(params.id);
  const imageId = tradeId.safeParse(params.imageId);
  if (!id.success || !imageId.success) {
    return new Response(null, { status: 404 });
  }

  const catalog = getTradeCatalog();
  const image = await catalog.getImage(imageId.data);
  if (!image || image.tradeId !== id.data) {
    return new Response(null, { status: 404 });
  }

  const objectKey = await catalog.deleteImage(image.id);
  if (objectKey) await getObjectStorage().delete(objectKey);
  return new Response(null, { status: 204 });
}
