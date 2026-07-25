export interface DatabaseHealthPort {
  checkConnection(): Promise<void>;
}
