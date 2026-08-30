import { Injectable } from '@nestjs/common';

@Injectable()
export class ChunkingService {
  /**
   * Simple fixed-size chunking with overlap.
   * chunkSize and overlap are in characters, not tokens (fine for a portfolio project).
   */
  chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end).trim();

      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      if (end === text.length) break;
      start = end - overlap;
    }

    return chunks;
  }
}
