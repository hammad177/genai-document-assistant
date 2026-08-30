import { Injectable } from '@nestjs/common';
import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { OPEN_AI } from 'src/common/constants';

@Injectable()
export class LlmProvider {
  async generateAnswer(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const { text } = await generateText({
      model: openai(OPEN_AI.MODEL),
      system: systemPrompt,
      prompt: userPrompt,
    });

    return text;
  }

  streamAnswer(systemPrompt: string, userPrompt: string) {
    const result = streamText({
      model: openai(OPEN_AI.MODEL),
      system: systemPrompt,
      prompt: userPrompt,
    });

    return result; // has .textStream (async iterable) among other properties
  }
}
