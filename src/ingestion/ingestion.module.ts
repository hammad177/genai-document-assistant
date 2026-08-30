import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { ChunkingService } from './chunking.service';
import { EmbeddingProvider } from '../providers/embedding.provider';
import { QdrantService } from '../vector-store/qdrant.service';

@Module({
  controllers: [IngestionController],
  providers: [
    IngestionService,
    ChunkingService,
    EmbeddingProvider,
    QdrantService,
  ],
  exports: [QdrantService, EmbeddingProvider],
})
export class IngestionModule {}
