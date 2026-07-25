import "server-only";

import { PostgresTradeCatalog } from "../infrastructure/database/postgres-trade-catalog";
import { S3ObjectStorage } from "../infrastructure/storage/s3-object-storage";
import type { ObjectStoragePort } from "../ports/object-storage";
import type { TradeCatalogPort } from "../ports/trade-catalog";

let catalog: TradeCatalogPort | undefined;
let storage: ObjectStoragePort | undefined;

export function getTradeCatalog(): TradeCatalogPort {
    catalog ??= new PostgresTradeCatalog();
    return catalog;
}

export function getObjectStorage(): ObjectStoragePort {
    storage ??= new S3ObjectStorage();
    return storage;
}
