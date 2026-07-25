import "server-only";

import type {
  CreateTradeInput,
  NewTradeImage,
  StoredTradeImage,
  TradeCatalogPort,
  TradeImageRecord,
  TradeReviewRecord,
  UpdateTradeInput,
} from "../../ports/trade-catalog";
import { getPostgresClient } from "./client";

interface TradeRow {
  id: string;
  title: string;
  date: Date;
  direction: "long" | "short";
  notes: string;
  tags: string[];
  images: TradeImageRecord[];
  createdAt: Date;
  updatedAt: Date;
}

function mapTrade(row: TradeRow): TradeReviewRecord {
  return {
    ...row,
    date: row.date.toISOString().slice(0, 10),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const tradeSelection = `
  select
    trade.id,
    trade.title,
    trade.trade_date as "date",
    trade.direction,
    trade.notes,
    trade.created_at as "createdAt",
    trade.updated_at as "updatedAt",
    coalesce((
      select json_agg(tag.name order by tag.name)
      from trade_tags trade_tag
      join tags tag on tag.id = trade_tag.tag_id
      where trade_tag.trade_id = trade.id
    ), '[]'::json) as tags,
    coalesce((
      select json_agg(json_build_object(
        'id', image.id,
        'name', image.filename,
        'type', image.mime_type,
        'size', image.byte_size
      ) order by image.position, image.created_at)
      from trade_images image
      where image.trade_id = trade.id
    ), '[]'::json) as images
  from trades trade
`;

export class PostgresTradeCatalog implements TradeCatalogPort {
  async list(): Promise<TradeReviewRecord[]> {
    const rows = await getPostgresClient().unsafe<TradeRow[]>(
      `${tradeSelection} order by trade.trade_date desc, trade.created_at desc`,
    );
    return rows.map(mapTrade);
  }

  async get(id: string): Promise<TradeReviewRecord | undefined> {
    const rows = await getPostgresClient().unsafe<TradeRow[]>(
      `${tradeSelection} where trade.id = $1`,
      [id],
    );
    return rows[0] ? mapTrade(rows[0]) : undefined;
  }

  async create(input: CreateTradeInput): Promise<TradeReviewRecord> {
    const [created] = await getPostgresClient()<[{ id: string }]>`
      insert into trades (title, trade_date, direction)
      values (${input.title}, ${input.date}, ${input.direction})
      returning id
    `;
    const trade = await this.get(created.id);
    if (!trade) throw new Error("Created trade could not be loaded.");
    return trade;
  }

  async update(
    id: string,
    input: UpdateTradeInput,
  ): Promise<TradeReviewRecord | undefined> {
    const names = Array.from(
      new Set(
        input.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
      ),
    );

    const updated = await getPostgresClient().begin(async (transaction) => {
      const rows = await transaction<[{ id: string }]>`
        update trades
        set title = ${input.title},
            trade_date = ${input.date},
            direction = ${input.direction},
            notes = ${input.notes},
            updated_at = now()
        where id = ${id}
        returning id
      `;
      if (!rows[0]) return false;

      await transaction`delete from trade_tags where trade_id = ${id}`;
      for (const name of names) {
        const [tag] = await transaction<[{ id: string }]>`
          insert into tags (name)
          values (${name})
          on conflict (name) do update set name = excluded.name
          returning id
        `;
        await transaction`
          insert into trade_tags (trade_id, tag_id)
          values (${id}, ${tag.id})
        `;
      }

      return true;
    });

    return updated ? this.get(id) : undefined;
  }

  async delete(id: string): Promise<string[]> {
    return getPostgresClient().begin(async (transaction) => {
      const images = await transaction<{ objectKey: string }[]>`
        select object_key as "objectKey"
        from trade_images
        where trade_id = ${id}
      `;
      await transaction`delete from trades where id = ${id}`;
      return images.map((image) => image.objectKey);
    });
  }

  async addImage(image: NewTradeImage): Promise<TradeImageRecord> {
    const [created] = await getPostgresClient()<TradeImageRecord[]>`
      insert into trade_images (
        id, trade_id, position, object_key, filename, mime_type, byte_size
      )
      values (
        ${image.id},
        ${image.tradeId},
        coalesce((select max(position) + 1 from trade_images where trade_id = ${image.tradeId}), 0),
        ${image.objectKey},
        ${image.name},
        ${image.type},
        ${image.size}
      )
      returning id, filename as name, mime_type as type, byte_size as size
    `;
    return created;
  }

  async getImage(id: string): Promise<StoredTradeImage | undefined> {
    const [image] = await getPostgresClient()<StoredTradeImage[]>`
      select
        id,
        trade_id as "tradeId",
        object_key as "objectKey",
        filename as name,
        mime_type as type,
        byte_size as size
      from trade_images
      where id = ${id}
    `;
    return image;
  }

  async deleteImage(id: string): Promise<string | undefined> {
    const [image] = await getPostgresClient()<{ objectKey: string }[]>`
      delete from trade_images
      where id = ${id}
      returning object_key as "objectKey"
    `;
    return image?.objectKey;
  }
}
