export type TradeReaction = -1 | 1;

export interface TradeCommentRecord {
  id: string;
  parentId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface TradeInteractionsRecord {
  comments: TradeCommentRecord[];
  likes: number;
  dislikes: number;
}

export interface AddTradeCommentInput {
  parentId: string | null;
  authorName: string;
  body: string;
}

export interface TradeInteractionsPort {
  get(tradeId: string): Promise<TradeInteractionsRecord>;
  addComment(
    tradeId: string,
    input: AddTradeCommentInput,
  ): Promise<TradeCommentRecord | undefined>;
  addReaction(
    tradeId: string,
    value: TradeReaction,
  ): Promise<TradeInteractionsRecord>;
}
