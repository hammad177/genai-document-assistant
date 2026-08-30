import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT_DB } from 'src/common/constants';
import { ChunkPayload, SearchResult } from 'src/types';

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient;
  private collectionName: string;

  private vectorSize = 1536; // text-embedding-3-small output size

  constructor() {
    this.client = new QdrantClient({
      url: QDRANT_DB.URL,
    });
    this.collectionName = QDRANT_DB.COLLECTION_NAME;
  }

  async onModuleInit() {
    await this.ensureCollection();
  }

  private async ensureCollection() {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === this.collectionName,
    );

    if (!exists) {
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: this.vectorSize,
          distance: 'Cosine',
        },
      });
      this.logger.log(`Created collection: ${this.collectionName}`);
    } else {
      this.logger.log(`Collection already exists: ${this.collectionName}`);
    }
  }

  async upsertChunks(
    ids: string[],
    vectors: number[][],
    payloads: ChunkPayload[],
  ) {
    const points = ids.map((id, i) => ({
      id,
      vector: vectors[i],
      payload: payloads[i] as unknown as Record<string, unknown>,
    }));

    await this.client.upsert(this.collectionName, {
      wait: true,
      points,
    });
  }

  async search(queryVector: number[], topK = 4): Promise<SearchResult[]> {
    const results = await this.client.query(this.collectionName, {
      query: queryVector,
      limit: topK,
      with_payload: true,
    });

    return results.points.map((r) => ({
      score: r.score,
      payload: r.payload as unknown as ChunkPayload,
    }));
  }
}
