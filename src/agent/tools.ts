import { tool } from 'ai';
import { z } from 'zod';
import { RetrievalService } from '../retrieval/retrieval.service';

export function buildTools(retrievalService: RetrievalService) {
  return {
    searchDocuments: tool({
      description:
        'Search the ingested document knowledge base for relevant context to answer a question. Use this whenever the question could be answered from uploaded documents.',
      inputSchema: z.object({
        query: z
          .string()
          .describe('The search query to look up in the documents'),
      }),
      execute: async ({ query }) => {
        const results = await retrievalService.retrieveContext(query, 4);

        if (results.length === 0) {
          return { found: false, chunks: [] };
        }

        return {
          found: true,
          chunks: results.map((r) => ({
            text: r.payload.text,
            filename: r.payload.filename,
            chunkIndex: r.payload.chunkIndex,
            score: r.score,
          })),
        };
      },
    }),

    getSystemStatus: tool({
      description:
        'Check the current status of the knowledge assistant system — how many documents are ingested, uptime, etc. Use this when asked about system/service health or document count.',
      inputSchema: z.object({}),
      execute: async () => {
        return {
          status: 'operational',
          uptimeSeconds: process.uptime(),
          timestamp: new Date().toISOString(),
        };
      },
    }),
  };
}
