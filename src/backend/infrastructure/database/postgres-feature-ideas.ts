import "server-only";

import type {
  AddFeatureIdeaInput,
  FeatureIdeaRecord,
  FeatureIdeasPort,
} from "../../ports/feature-ideas";
import { getPostgresClient } from "./client";

interface FeatureIdeaRow extends Omit<FeatureIdeaRecord, "createdAt"> {
  createdAt: Date;
}

function mapFeatureIdea(idea: FeatureIdeaRow): FeatureIdeaRecord {
  return { ...idea, createdAt: idea.createdAt.toISOString() };
}

export class PostgresFeatureIdeas implements FeatureIdeasPort {
  async list(): Promise<FeatureIdeaRecord[]> {
    const ideas = await getPostgresClient()<FeatureIdeaRow[]>`
      select
        id,
        author_name as "authorName",
        body,
        created_at as "createdAt"
      from feature_ideas
      order by created_at desc, id desc
    `;
    return ideas.map(mapFeatureIdea);
  }

  async add(input: AddFeatureIdeaInput): Promise<FeatureIdeaRecord> {
    const [idea] = await getPostgresClient()<FeatureIdeaRow[]>`
      insert into feature_ideas (author_name, body)
      values (${input.authorName}, ${input.body})
      returning
        id,
        author_name as "authorName",
        body,
        created_at as "createdAt"
    `;
    return mapFeatureIdea(idea);
  }

  async remove(id: string): Promise<boolean> {
    const deleted = await getPostgresClient()<[{ id: string }]>`
      delete from feature_ideas
      where id = ${id}
      returning id
    `;
    return deleted.length > 0;
  }
}
