import { Injectable } from '@nestjs/common';
import { openai } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';
import { OPEN_AI } from 'src/common/constants';

@Injectable()
export class EmbeddingProvider {
  async embedText(text: string): Promise<number[]> {
    const { embedding } = await embed({
      model: openai.embedding(OPEN_AI.EMBEDDING_MODEL),
      value: text,
    });

    return embedding;
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    const { embeddings } = await embedMany({
      model: openai.embedding(OPEN_AI.EMBEDDING_MODEL),
      values: texts,
    });

    return embeddings;
  }
}
