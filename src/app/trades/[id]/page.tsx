import { notFound } from "next/navigation";
import {
  createPublicLibraryQuery,
  getTradeCatalog,
} from "@/backend/composition/trades";
import { PublicLibrary } from "@/components/PublicLibrary";
import { parseTradeSearchQuery } from "@/lib/trade-search";

export const dynamic = "force-dynamic";

export default async function TradePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ id }, { q = "" }] = await Promise.all([params, searchParams]);
  const [trade, library] = await Promise.all([
    getTradeCatalog().get(id),
    createPublicLibraryQuery().execute(parseTradeSearchQuery(q)),
  ]);
  if (!trade) notFound();
  return (
    <PublicLibrary key={q} library={library} query={q} selectedTrade={trade} />
  );
}
