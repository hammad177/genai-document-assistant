import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { LlmProvider } from '../providers/llm.provider';
import { MemoryModule } from 'src/memory/memory.module';

@Module({
  imports: [RetrievalModule, MemoryModule],
  controllers: [ChatController],
  providers: [ChatService, LlmProvider],
})
export class ChatModule {}
