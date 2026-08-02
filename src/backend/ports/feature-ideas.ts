export interface FeatureIdeaRecord {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface AddFeatureIdeaInput {
  authorName: string;
  body: string;
}

export interface FeatureIdeasPort {
  list(): Promise<FeatureIdeaRecord[]>;
  add(input: AddFeatureIdeaInput): Promise<FeatureIdeaRecord>;
  remove(id: string): Promise<boolean>;
}
