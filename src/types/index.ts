export enum AppEnvironment {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  TEST = 'test',
}

export type AllowedFileExtensions = '.pdf';

export interface ChunkPayload {
  text: string;
  docId: string;
  filename: string;
  chunkIndex: number;
}

export interface SearchResult {
  score: number;
  payload: ChunkPayload;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
