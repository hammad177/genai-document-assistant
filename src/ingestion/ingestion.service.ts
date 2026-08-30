import { Injectable, Logger } from '@nestjs/common';
import { randomUUID as uuidv4 } from 'crypto';
import { ChunkingService } from './chunking.service';
import { EmbeddingProvider } from '../providers/embedding.provider';
import { QdrantService } from '../vector-store/qdrant.service';
import { ChunkPayload } from 'src/types';

export interface IngestResult {
  docId: string;
  filename: string;
  chunkCount: number;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  // In-memory doc metadata store — fine for Phase 1, swap for DB later if needed
  private docStore: Map<string, { filename: string; chunkCount: number }> =
    new Map();

  constructor(
    private chunkingService: ChunkingService,
    private embeddingProvider: EmbeddingProvider,
    private qdrantService: QdrantService,
  ) {}

  async ingestDocument(
    filename: string,
    content: string,
  ): Promise<IngestResult> {
    const docId = uuidv4();
    const chunks = this.chunkingService.chunkText(content);

    this.logger.log(`Chunked "${filename}" into ${chunks.length} chunks`);

    const vectors = await this.embeddingProvider.embedMany(chunks);

    const ids = chunks.map(() => uuidv4());
    const payloads: ChunkPayload[] = chunks.map((text, i) => ({
      text,
      docId,
      filename,
      chunkIndex: i,
    }));

    await this.qdrantService.upsertChunks(ids, vectors, payloads);

    this.docStore.set(docId, { filename, chunkCount: chunks.length });

    return { docId, filename, chunkCount: chunks.length };
  }

  listDocuments() {
    return Array.from(this.docStore.entries()).map(([docId, meta]) => ({
      docId,
      ...meta,
    }));
  }
}
