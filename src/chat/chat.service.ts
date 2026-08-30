import { Injectable } from '@nestjs/common';
import { RetrievalService } from '../retrieval/retrieval.service';
import { LlmProvider } from '../providers/llm.provider';

@Injectable()
export class ChatService {
  constructor(
    private retrievalService: RetrievalService,
    private llmProvider: LlmProvider,
  ) {}

  private async buildPrompt(question: string) {
    const results = await this.retrievalService.retrieveContext(question, 4);

    if (results.length === 0) {
      return {
        systemPrompt: null,
        userPrompt: null,
        sources: [],
        noContext: true as const,
      };
    }

    const contextBlock = results
      .map(
        (r, i) =>
          `[${i + 1}] (source: ${r.payload.filename}, chunk ${r.payload.chunkIndex})\n${r.payload.text}`,
      )
      .join('\n\n');

    const systemPrompt = `
    You are a helpful assistant answering questions based only on the provided context.
    If the answer isn't in the context, say you don't know — do not make things up.
    Cite sources using the [number] format matching the context blocks.
    `;

    const userPrompt = `Context:\n${contextBlock}\n\nQuestion: ${question}`;

    return {
      systemPrompt,
      userPrompt,
      sources: results.map((r) => ({
        filename: r.payload.filename,
        chunkIndex: r.payload.chunkIndex,
        score: r.score,
      })),
      noContext: false as const,
    };
  }

  async query(question: string) {
    const { systemPrompt, userPrompt, sources, noContext } =
      await this.buildPrompt(question);

    if (noContext) {
      return {
        answer: "I don't have any relevant documents to answer that yet.",
        sources: [],
      };
    }

    const answer = await this.llmProvider.generateAnswer(
      systemPrompt,
      userPrompt,
    );

    return { answer, sources };
  }

  async streamQuery(question: string) {
    const { systemPrompt, userPrompt, sources, noContext } =
      await this.buildPrompt(question);

    if (noContext) {
      return { textStream: null, sources: [] };
    }

    const result = this.llmProvider.streamAnswer(systemPrompt, userPrompt);

    return { textStream: result.textStream, sources };
  }
}
