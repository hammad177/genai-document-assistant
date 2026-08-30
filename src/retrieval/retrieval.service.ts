import { Injectable } from '@nestjs/common';
import { EmbeddingProvider } from '../providers/embedding.provider';
import { QdrantService } from '../vector-store/qdrant.service';
import { SearchResult } from 'src/types';

@Injectable()
export class RetrievalService {
  constructor(
    private embeddingProvider: EmbeddingProvider,
    private qdrantService: QdrantService,
  ) {}

  async retrieveContext(query: string, topK = 4): Promise<SearchResult[]> {
    const queryVector = await this.embeddingProvider.embedText(query);
    return this.qdrantService.search(queryVector, topK);
  }
}
