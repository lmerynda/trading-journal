import "server-only";

import type { DatabaseHealthPort } from "../../ports/database-health";
import { getPostgresClient } from "./client";

export class PostgresDatabaseHealth implements DatabaseHealthPort {
  async checkConnection(): Promise<void> {
    await getPostgresClient()`select 1`;
  }
}
