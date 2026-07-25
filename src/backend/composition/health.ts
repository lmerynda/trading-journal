import "server-only";

import { CheckApplicationHealth } from "../application/health/check-application-health";
import { PostgresDatabaseHealth } from "../infrastructure/database/postgres-database-health";

export function createHealthCheck(): CheckApplicationHealth {
  return new CheckApplicationHealth(new PostgresDatabaseHealth());
}
