import type { DatabaseHealthPort } from "../../ports/database-health";

export interface ApplicationHealthDto {
  status: "ok" | "unavailable";
  server: "ok";
  database: "ok" | "unavailable";
}

export class CheckApplicationHealth {
  constructor(private readonly databaseHealth: DatabaseHealthPort) {}

  async execute(): Promise<ApplicationHealthDto> {
    try {
      await this.databaseHealth.checkConnection();

      return { status: "ok", server: "ok", database: "ok" };
    } catch {
      return {
        status: "unavailable",
        server: "ok",
        database: "unavailable",
      };
    }
  }
}
