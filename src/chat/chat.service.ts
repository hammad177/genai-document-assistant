import { Injectable } from '@nestjs/common';
import { RetrievalService } from '../retrieval/retrieval.service';
import { LlmProvider } from '../providers/llm.provider';
import { buildTools } from 'src/agent/tools';
import { MemoryService } from 'src/memory/memory.service';
import { ChatMessage } from 'src/types';

@Injectable()
export class ChatService {
  constructor(
    private retrievalService: RetrievalService,
    private llmProvider: LlmProvider,
    private memoryService: MemoryService,
  ) {}

  private readonly ragSystemPrompt = `
    You are a helpful assistant answering questions based only on the provided context.
    If the answer isn't in the context, say you don't know — do not make things up.
    Cite sources using the [number] format matching the context blocks.
  `;

  private readonly agentSystemPrompt = `
    You are a helpful assistant for a knowledge base system.
    You have tools available: searchDocuments (to find answers in ingested documents) and getSystemStatus (to check system health).
    Decide which tool, if any, is needed to answer the user's question. If no tool is needed, answer directly.
    When you use searchDocuments and get results, answer based only on those results and cite sources using [filename] format.
    If searchDocuments finds nothing relevant, say you don't know — don't make things up.
    Use the conversation history to understand follow-up questions and pronouns (e.g. "it", "that project") referring to earlier turns.
  `;

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

    const userPrompt = `Context:\n${contextBlock}\n\nQuestion: ${question}`;

    return {
      systemPrompt: this.ragSystemPrompt,
      userPrompt,
      sources: results.map((r) => ({
        filename: r.payload.filename,
        chunkIndex: r.payload.chunkIndex,
        score: r.score,
      })),
      noContext: false as const,
    };
  }

  private historyToPromptText(history: ChatMessage[]): string {
    if (history.length === 0) return '';

    const formatted = history
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    return `Conversation history:\n${formatted}\n\n`;
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

  async agentQuery(question: string, sessionId: string) {
    const tools = buildTools(this.retrievalService);
    const history = await this.memoryService.getHistory(sessionId);

    const userPrompt = `${this.historyToPromptText(history)}Question: ${question}`;

    const result = await this.llmProvider.generateWithTools(
      this.agentSystemPrompt,
      userPrompt,
      tools,
    );

    const pathTaken =
      result.toolCalls.length === 0
        ? 'direct'
        : result.toolCalls.map((tc) => tc.toolName).join(' -> ');

    await this.memoryService.appendTurn(sessionId, question, result.text);

    return {
      answer: result.text,
      pathTaken,
      toolCalls: result.toolCalls.map((tc) => ({
        tool: tc.toolName,
        args: tc.input,
      })),
      sessionId,
    };
  }

  async agentStreamQuery(question: string) {
    const tools = buildTools(this.retrievalService);

    const result = this.llmProvider.streamWithTools(
      this.agentSystemPrompt,
      question,
      tools,
    );

    return result;
  }
}
