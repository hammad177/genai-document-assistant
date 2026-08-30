import { Injectable } from '@nestjs/common';
import { openai } from '@ai-sdk/openai';
import { generateText, stepCountIs, streamText, ToolSet } from 'ai';
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

    return result;
  }

  async generateWithTools(
    systemPrompt: string,
    userPrompt: string,
    tools: ToolSet,
  ) {
    const result = await generateText({
      model: openai(OPEN_AI.MODEL),
      system: systemPrompt,
      prompt: userPrompt,
      tools,
      stopWhen: stepCountIs(3),
    });

    return {
      text: result.text,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      steps: result.steps,
    };
  }

  streamWithTools(systemPrompt: string, userPrompt: string, tools: ToolSet) {
    return streamText({
      model: openai(OPEN_AI.MODEL),
      system: systemPrompt,
      prompt: userPrompt,
      tools,
      stopWhen: stepCountIs(3),
    });
  }
}
