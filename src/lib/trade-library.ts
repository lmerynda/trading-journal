export type TradeDirection = "long" | "short";

export interface TradeImage {
    id: string;
    name: string;
    type: string;
    blob: Blob;
}

export interface TradeReview {
    id: string;
    title: string;
    date: string;
    direction: TradeDirection;
    notes: string;
    tags: string[];
    images: TradeImage[];
    createdAt: string;
    updatedAt: string;
}

const databaseName = "trade-review-library";
const storeName = "trades";

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 1);

        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(storeName)) {
                database.createObjectStore(storeName, { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function listTrades(): Promise<TradeReview[]> {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, "readonly");
        const request = transaction.objectStore(storeName).getAll();

        request.onsuccess = () => {
            const trades = request.result as TradeReview[];
            resolve(
                trades.sort((left, right) =>
                    right.date === left.date
                        ? right.createdAt.localeCompare(left.createdAt)
                        : right.date.localeCompare(left.date),
                ),
            );
        };
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => database.close();
    });
}

export async function saveTrade(trade: TradeReview): Promise<void> {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, "readwrite");
        transaction.objectStore(storeName).put(trade);
        transaction.oncomplete = () => {
            database.close();
            resolve();
        };
        transaction.onerror = () => reject(transaction.error);
    });
}

export async function removeTrade(id: string): Promise<void> {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, "readwrite");
        transaction.objectStore(storeName).delete(id);
        transaction.oncomplete = () => {
            database.close();
            resolve();
        };
        transaction.onerror = () => reject(transaction.error);
    });
}

export function createTrade(): TradeReview {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);

    return {
        id: crypto.randomUUID(),
        title: "Untitled trade",
        date: localDate,
        direction: "long",
        notes: "",
        tags: [],
        images: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
    };
}
