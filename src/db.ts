import Database from "@tauri-apps/plugin-sql";

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:vault3d.db");
  }
  return dbInstance;
}

export interface Model {
  id: string;
  name: string;
  relativePath: string;
  folderName: string;
  format: string;
  sizeBytes: number;
  maker: string | null;
  labels: string | null;
  categories: string | null;
  dateAdded: string;
  hasCustomThumbnail: boolean;
  isMissing: boolean;
}

export interface Settings {
  id: number;
  baseDirectory: string;
  autoRenderThreshold: number;
}
