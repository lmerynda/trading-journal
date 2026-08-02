import "server-only";

import { PostgresFeatureIdeas } from "../infrastructure/database/postgres-feature-ideas";
import type { FeatureIdeasPort } from "../ports/feature-ideas";

let featureIdeas: FeatureIdeasPort | undefined;

export function getFeatureIdeas(): FeatureIdeasPort {
  featureIdeas ??= new PostgresFeatureIdeas();
  return featureIdeas;
}
