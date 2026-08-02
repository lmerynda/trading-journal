import "server-only";

import type {
  CreateTradeInput,
  NewTradeImage,
  StoredTradeImage,
  TradeCatalogPort,
  TradeImageRecord,
  TradeReviewRecord,
  TradeSearchFilter,
  UpdateTradeInput,
} from "../../ports/trade-catalog";
import { getPostgresClient } from "./client";

interface TradeRow {
  id: string;
  title: string;
  date: Date;
  direction: "long" | "short";
  initialNotes: string;
  finalNotes: string;
  youtubeUrl: string | null;
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
    trade.initial_notes as "initialNotes",
    trade.final_notes as "finalNotes",
    trade.youtube_url as "youtubeUrl",
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
        'size', image.byte_size,
        'role', image.role
      ) order by image.position, image.created_at)
      from trade_images image
      where image.trade_id = trade.id
    ), '[]'::json) as images
  from trades trade
`;

export class PostgresTradeCatalog implements TradeCatalogPort {
  async list(filter: TradeSearchFilter = {}): Promise<TradeReviewRecord[]> {
    const conditions: string[] = [];
    const values: string[] = [];
    const parameter = (value: string): string => {
      values.push(value);
      return `$${values.length}`;
    };

    if (filter.date) {
      conditions.push(`trade.trade_date = ${parameter(filter.date)}`);
    } else {
      if (filter.from) {
        conditions.push(`trade.trade_date >= ${parameter(filter.from)}`);
      }
      if (filter.to) {
        conditions.push(`trade.trade_date <= ${parameter(filter.to)}`);
      }
    }

    if (filter.text) {
      const search = parameter(`%${filter.text}%`);
      conditions.push(
        `(trade.title ilike ${search}
          or trade.final_notes ilike ${search}
          or exists (
            select 1
            from trade_tags searched_trade_tag
            join tags searched_tag on searched_tag.id = searched_trade_tag.tag_id
            where searched_trade_tag.trade_id = trade.id
              and searched_tag.name ilike ${search}
          ))`,
      );
    }

    for (const tag of filter.tags ?? []) {
      conditions.push(`exists (
        select 1
        from trade_tags filtered_trade_tag
        join tags filtered_tag on filtered_tag.id = filtered_trade_tag.tag_id
        where filtered_trade_tag.trade_id = trade.id
          and filtered_tag.name = ${parameter(tag)}
      )`);
    }

    const where =
      conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
    const rows = await getPostgresClient().unsafe<TradeRow[]>(
      `${tradeSelection} ${where} order by trade.trade_date desc, trade.created_at desc`,
      values,
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
            initial_notes = ${input.initialNotes},
            final_notes = ${input.finalNotes},
            youtube_url = ${input.youtubeUrl},
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
        id, trade_id, position, role, object_key, filename, mime_type, byte_size
      )
      values (
        ${image.id},
        ${image.tradeId},
        coalesce((select max(position) + 1 from trade_images where trade_id = ${image.tradeId}), 0),
        ${image.role},
        ${image.objectKey},
        ${image.name},
        ${image.type},
        ${image.size}
      )
      returning id, filename as name, mime_type as type, byte_size as size, role
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
        , role
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
