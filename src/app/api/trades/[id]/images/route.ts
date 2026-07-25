import {
  getObjectStorage,
  getTradeCatalog,
} from "@/backend/composition/trades";
import { imageRole, tradeId } from "../../validation";

const maximumImageSize = 20 * 1024 * 1024;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = tradeId.safeParse((await context.params).id);
  if (!id.success || !(await getTradeCatalog().get(id.data))) {
    return new Response(null, { status: 404 });
  }

  const form = await request.formData();
  const image = form.get("image");
  const role = imageRole.safeParse(form.get("role"));
  if (
    !(image instanceof File) ||
    !image.type.startsWith("image/") ||
    image.size === 0 ||
    image.size > maximumImageSize ||
    !role.success
  ) {
    return Response.json(
      { error: "Upload an image no larger than 20 MB." },
      { status: 400 },
    );
  }

  const imageId = crypto.randomUUID();
  const objectKey = `reviews/${id.data}/images/${imageId}/original`;
  const storage = getObjectStorage();
  await storage.put(
    objectKey,
    new Uint8Array(await image.arrayBuffer()),
    image.type,
  );

  try {
    const created = await getTradeCatalog().addImage({
      id: imageId,
      tradeId: id.data,
      objectKey,
      name: image.name || "Screenshot",
      type: image.type,
      size: image.size,
      role: role.data,
    });
    return Response.json(created, { status: 201 });
  } catch (error) {
    await storage.delete(objectKey);
    throw error;
  }
}
