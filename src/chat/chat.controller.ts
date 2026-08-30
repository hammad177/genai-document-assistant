import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Sse,
  Query,
  MessageEvent,
  Param,
  Delete,
  Get,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AgentQueryDto, QueryDto } from './chat.dto';
import { Observable } from 'rxjs';
import { MemoryService } from 'src/memory/memory.service';

@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private memoryService: MemoryService,
  ) {}

  @Post()
  async query(@Body() body: QueryDto) {
    return this.chatService.query(body.question);
  }

  @Sse('stream')
  streamQuery(@Query('question') question: string): Observable<MessageEvent> {
    if (!question?.trim()) {
      throw new BadRequestException('question query param is required');
    }

    return new Observable((subscriber) => {
      let closed = false;
      subscriber.add(() => {
        closed = true;
      });

      (async () => {
        try {
          const { textStream, sources } =
            await this.chatService.streamQuery(question);

          if (!textStream) {
            subscriber.next({
              data: JSON.stringify({
                type: 'error',
                message: 'No relevant documents found.',
              }),
            });
            subscriber.complete();
            return;
          }

          // send sources first so client can render them immediately
          subscriber.next({
            data: JSON.stringify({ type: 'sources', sources }),
          });

          for await (const chunk of textStream) {
            if (closed) break;
            subscriber.next({
              data: JSON.stringify({ type: 'token', text: chunk }),
            });
          }

          if (!closed) {
            subscriber.next({ data: JSON.stringify({ type: 'done' }) });
            subscriber.complete();
          }
        } catch (err) {
          subscriber.next({
            data: JSON.stringify({ type: 'error', message: err.message }),
          });
          subscriber.error(err);
        }
      })();
    });
  }

  @Post('agent')
  async agentQuery(@Body() body: AgentQueryDto) {
    return this.chatService.agentQuery(body.question, body.sessionId);
  }

  @Get('session/:sessionId')
  async getSessionHistory(@Param('sessionId') sessionId: string) {
    return this.memoryService.getHistory(sessionId);
  }

  @Delete('session/:sessionId')
  async clearSession(@Param('sessionId') sessionId: string) {
    await this.memoryService.clearSession(sessionId);
    return { cleared: true, sessionId };
  }
}
