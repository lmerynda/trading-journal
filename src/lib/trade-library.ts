export type TradeDirection = "long" | "short";

export interface TradeImage {
    id: string;
    name: string;
    type: string;
    size: number;
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

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const response = await fetch(input, init);
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
    }
    return (await response.json()) as T;
}

export function listTrades(): Promise<TradeReview[]> {
    return request<TradeReview[]>("/api/trades", { cache: "no-store" });
}

export function createTrade(): Promise<TradeReview> {
    const now = new Date();
    const date = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);

    return request<TradeReview>("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled trade", date, direction: "long" }),
    });
}

export function saveTrade(trade: TradeReview): Promise<TradeReview> {
    return request<TradeReview>(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: trade.title,
            date: trade.date,
            direction: trade.direction,
            notes: trade.notes,
            tags: trade.tags,
        }),
    });
}

export async function removeTrade(id: string): Promise<void> {
    const response = await fetch(`/api/trades/${id}`, { method: "DELETE" });
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
    }
}

export async function uploadTradeImage(
    tradeId: string,
    image: File,
): Promise<TradeImage> {
    const form = new FormData();
    form.set("image", image);
    return request<TradeImage>(`/api/trades/${tradeId}/images`, {
        method: "POST",
        body: form,
    });
}

export async function removeTradeImage(
    tradeId: string,
    imageId: string,
): Promise<void> {
    const response = await fetch(`/api/trades/${tradeId}/images/${imageId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
    }
}
