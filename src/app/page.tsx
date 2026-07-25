import { createPublicLibraryQuery } from "@/backend/composition/trades";
import { PublicLibrary } from "@/components/PublicLibrary";
import { parseTradeSearchQuery } from "@/lib/trade-search";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q ?? "";
  const search = parseTradeSearchQuery(query);
  const library = await createPublicLibraryQuery().execute(search);
  return <PublicLibrary key={query} library={library} query={query} />;
}
