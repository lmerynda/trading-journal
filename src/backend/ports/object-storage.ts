export interface StoredObject {
    body: Uint8Array;
    contentType: string;
}

export interface ObjectStoragePort {
    put(key: string, body: Uint8Array, contentType: string): Promise<void>;
    get(key: string): Promise<StoredObject | undefined>;
    delete(key: string): Promise<void>;
}
