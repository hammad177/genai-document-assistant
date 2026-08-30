import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { REDIS } from 'src/common/constants';
import Redis from 'ioredis';
import { ChatMessage } from 'src/types';

@Injectable()
export class MemoryService implements OnModuleDestroy {
  private redis: Redis;
  private ttlSeconds: number;
  private maxMessages: number;

  constructor() {
    this.redis = new Redis(REDIS.URL);
    this.ttlSeconds = REDIS.MEMORY_TTL_SECONDS;
    this.maxMessages = REDIS.MEMORY_MAX_MESSAGES;
  }

  private key(sessionId: string) {
    return `session:${sessionId}:messages`;
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const raw = await this.redis.lrange(this.key(sessionId), 0, -1);
    return raw.map((r) => JSON.parse(r) as ChatMessage);
  }

  async appendMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const key = this.key(sessionId);

    await this.redis.rpush(key, JSON.stringify(message));
    // trim to keep only the last N messages
    await this.redis.ltrim(key, -this.maxMessages, -1);
    await this.redis.expire(key, this.ttlSeconds);
  }

  async appendTurn(
    sessionId: string,
    userContent: string,
    assistantContent: string,
  ): Promise<void> {
    const now = Date.now();
    await this.appendMessage(sessionId, {
      role: 'user',
      content: userContent,
      timestamp: now,
    });
    await this.appendMessage(sessionId, {
      role: 'assistant',
      content: assistantContent,
      timestamp: now + 1,
    });
  }

  async clearSession(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
