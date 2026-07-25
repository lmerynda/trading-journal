import "server-only";

import postgres from "postgres";

let client: ReturnType<typeof postgres> | undefined;

export function getPostgresClient(): ReturnType<typeof postgres> {
  if (client) {
    return client;
  }

  const connectionUrl = process.env.DATABASE_URL;

  if (!connectionUrl) {
    throw new Error("DATABASE_URL is required for database access.");
  }

  client = postgres(connectionUrl, {
    max: 10,
    connect_timeout: 5,
  });

  return client;
}
