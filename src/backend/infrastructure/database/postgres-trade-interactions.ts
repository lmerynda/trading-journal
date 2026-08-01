import "server-only";

import type {
  AddTradeCommentInput,
  TradeCommentRecord,
  TradeInteractionsPort,
  TradeInteractionsRecord,
  TradeReaction,
} from "../../ports/trade-interactions";
import { getPostgresClient } from "./client";

interface CommentRow extends Omit<TradeCommentRecord, "createdAt"> {
  createdAt: Date;
}

function mapComment(comment: CommentRow): TradeCommentRecord {
  return { ...comment, createdAt: comment.createdAt.toISOString() };
}

export class PostgresTradeInteractions implements TradeInteractionsPort {
  async get(tradeId: string): Promise<TradeInteractionsRecord> {
    const [comments, [reactions]] = await Promise.all([
      getPostgresClient()<CommentRow[]>`
        select
          id,
          parent_id as "parentId",
          author_name as "authorName",
          body,
          created_at as "createdAt"
        from trade_comments
        where trade_id = ${tradeId}
        order by created_at, id
      `,
      getPostgresClient()<{ likes: number; dislikes: number }[]>`
        select likes, dislikes from trades where id = ${tradeId}
      `,
    ]);

    return {
      comments: comments.map(mapComment),
      likes: reactions.likes,
      dislikes: reactions.dislikes,
    };
  }

  async addComment(
    tradeId: string,
    input: AddTradeCommentInput,
  ): Promise<TradeCommentRecord | undefined> {
    const [comment] = await getPostgresClient()<CommentRow[]>`
      insert into trade_comments (trade_id, parent_id, author_name, body)
      select ${tradeId}, ${input.parentId}, ${input.authorName}, ${input.body}
      where ${input.parentId}::uuid is null
        or exists (
          select 1 from trade_comments
          where id = ${input.parentId} and trade_id = ${tradeId}
        )
      returning
        id,
        parent_id as "parentId",
        author_name as "authorName",
        body,
        created_at as "createdAt"
    `;
    return comment ? mapComment(comment) : undefined;
  }

  async addReaction(
    tradeId: string,
    value: TradeReaction,
  ): Promise<TradeInteractionsRecord> {
    await getPostgresClient().unsafe(
      `update trades set ${value === 1 ? "likes" : "dislikes"} = ${value === 1 ? "likes" : "dislikes"} + 1 where id = $1`,
      [tradeId],
    );
    return this.get(tradeId);
  }
}
