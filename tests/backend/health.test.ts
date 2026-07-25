import { describe, expect, it } from "vitest";
import { CheckApplicationHealth } from "../../src/backend/application/health/check-application-health";
import type { DatabaseHealthPort } from "../../src/backend/ports/database-health";

class StubDatabaseHealth implements DatabaseHealthPort {
  constructor(private readonly error?: Error) {}

  async checkConnection(): Promise<void> {
    if (this.error) {
      throw this.error;
    }
  }
}

describe("CheckApplicationHealth", () => {
  it("reports the server and database as healthy", async () => {
    const result = await new CheckApplicationHealth(
      new StubDatabaseHealth(),
    ).execute();

    expect(result).toEqual({
      status: "ok",
      server: "ok",
      database: "ok",
    });
  });

  it("keeps the server visible when the database is unavailable", async () => {
    const result = await new CheckApplicationHealth(
      new StubDatabaseHealth(new Error("connection refused")),
    ).execute();

    expect(result).toEqual({
      status: "unavailable",
      server: "ok",
      database: "unavailable",
    });
  });
});
