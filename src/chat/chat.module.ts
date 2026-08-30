import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { LlmProvider } from '../providers/llm.provider';

@Module({
  imports: [RetrievalModule],
  controllers: [ChatController],
  providers: [ChatService, LlmProvider],
})
export class ChatModule {}
