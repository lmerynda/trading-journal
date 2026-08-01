import "server-only";

import { QueryPublicLibrary } from "../application/trades/query-public-library";
import { PostgresTradeInteractions } from "../infrastructure/database/postgres-trade-interactions";
import { PostgresTradeCatalog } from "../infrastructure/database/postgres-trade-catalog";
import { S3ObjectStorage } from "../infrastructure/storage/s3-object-storage";
import type { ObjectStoragePort } from "../ports/object-storage";
import type { TradeCatalogPort } from "../ports/trade-catalog";
import type { TradeInteractionsPort } from "../ports/trade-interactions";

let catalog: TradeCatalogPort | undefined;
let storage: ObjectStoragePort | undefined;
let interactions: TradeInteractionsPort | undefined;

export function getTradeCatalog(): TradeCatalogPort {
  catalog ??= new PostgresTradeCatalog();
  return catalog;
}

export function getObjectStorage(): ObjectStoragePort {
  storage ??= new S3ObjectStorage();
  return storage;
}

export function createPublicLibraryQuery(): QueryPublicLibrary {
  return new QueryPublicLibrary(getTradeCatalog());
}

export function getTradeInteractions(): TradeInteractionsPort {
  interactions ??= new PostgresTradeInteractions();
  return interactions;
}
