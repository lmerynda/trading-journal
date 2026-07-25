export type TradeDirection = "long" | "short";

export interface TradeImageRecord {
    id: string;
    name: string;
    type: string;
    size: number;
}

export interface TradeReviewRecord {
    id: string;
    title: string;
    date: string;
    direction: TradeDirection;
    notes: string;
    tags: string[];
    images: TradeImageRecord[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateTradeInput {
    title: string;
    date: string;
    direction: TradeDirection;
}

export interface UpdateTradeInput {
    title: string;
    date: string;
    direction: TradeDirection;
    notes: string;
    tags: string[];
}

export interface NewTradeImage {
    id: string;
    tradeId: string;
    objectKey: string;
    name: string;
    type: string;
    size: number;
}

export interface StoredTradeImage extends TradeImageRecord {
    tradeId: string;
    objectKey: string;
}

export interface TradeCatalogPort {
    list(): Promise<TradeReviewRecord[]>;
    get(id: string): Promise<TradeReviewRecord | undefined>;
    create(input: CreateTradeInput): Promise<TradeReviewRecord>;
    update(
        id: string,
        input: UpdateTradeInput,
    ): Promise<TradeReviewRecord | undefined>;
    delete(id: string): Promise<string[]>;
    addImage(image: NewTradeImage): Promise<TradeImageRecord>;
    getImage(id: string): Promise<StoredTradeImage | undefined>;
    deleteImage(id: string): Promise<string | undefined>;
}
