import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { responseFormatter } from 'src/helpers/response-formatter';
import { MODEL_PRICING } from 'src/experiment/constants/scoring-weights';
import { withRetry } from 'src/helpers/retry';

type ResponseProps = {
  prompt: string;
  systemPrompt?: string;
  temperature: number;
  topP: number;
  topK: number;
  maxToken: number;
  model?: string;
};

export type LlmResult = {
  text: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  model: string;
};

@Injectable()
export class LlmService {
  constructor(private configService: ConfigService) {}

  private estimateTokens(text: string): number {
    return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);
  }

  private estimateCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const pricing = MODEL_PRICING[model] ?? MODEL_PRICING['gemini-2.0-flash-001'];
    return +(
      (inputTokens / 1_000_000) * pricing.input +
      (outputTokens / 1_000_000) * pricing.output
    ).toFixed(6);
  }

  async llmResponse(props: ResponseProps): Promise<LlmResult> {
    const GEMINI_KEY = this.configService.get<string>('gemini');
    const defaultModel =
      this.configService.get<string>('geminiModel') ?? 'gemini-2.0-flash-001';
    const model = props.model ?? defaultModel;

    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const started = Date.now();

    const contents = props.systemPrompt
      ? [
          { role: 'user' as const, parts: [{ text: props.systemPrompt }] },
          {
            role: 'model' as const,
            parts: [{ text: 'Understood. I will follow those instructions.' }],
          },
          { role: 'user' as const, parts: [{ text: props.prompt }] },
        ]
      : props.prompt;

    const res = await withRetry(() =>
      ai.models.generateContent({
        model,
        contents,
        config: {
          temperature: props.temperature,
          topP: props.topP,
          topK: Math.round(props.topK),
          maxOutputTokens: props.maxToken,
          candidateCount: 1,
        },
      }),
    );

    if (!res) {
      throw new HttpException(
        'model overloaded try again',
        HttpStatus.BAD_REQUEST,
      );
    }

    const plainText = res.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const formatted = responseFormatter(plainText);
    const latencyMs = Date.now() - started;

    const usage = (res as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } })
      .usageMetadata;

    const inputTokens =
      usage?.promptTokenCount ??
      this.estimateTokens((props.systemPrompt ?? '') + props.prompt);
    const outputTokens =
      usage?.candidatesTokenCount ?? this.estimateTokens(formatted);

    return {
      text: formatted,
      latencyMs,
      inputTokens,
      outputTokens,
      estimatedCostUsd: this.estimateCost(model, inputTokens, outputTokens),
      model,
    };
  }

  async judgeResponse(
    prompt: string,
    response: string,
    systemPrompt?: string,
    model?: string,
  ): Promise<{ score: number; rationale: string }> {
    const GEMINI_KEY = this.configService.get<string>('gemini');
    const defaultModel =
      this.configService.get<string>('geminiModel') ?? 'gemini-2.0-flash-001';
    const judgeModel = model ?? defaultModel;

    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

    const judgePrompt = `You are an expert LLM evaluator. Score the response from 0.0 to 1.0 for overall quality (accuracy, helpfulness, clarity).

Prompt:
${prompt}

${systemPrompt ? `System instructions:\n${systemPrompt}\n\n` : ''}Response:
${response}

Reply with exactly two lines:
SCORE: <number between 0 and 1>
REASON: <one sentence>`;

    const res = await withRetry(() =>
      ai.models.generateContent({
        model: judgeModel,
        contents: judgePrompt,
        config: { temperature: 0.1, maxOutputTokens: 200 },
      }),
    );

    const text = res?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const scoreMatch = text.match(/SCORE:\s*([\d.]+)/i);
    const reasonMatch = text.match(/REASON:\s*(.+)/i);

    const score = scoreMatch
      ? Math.min(1, Math.max(0, parseFloat(scoreMatch[1])))
      : 0.5;

    return {
      score: +score.toFixed(3),
      rationale: reasonMatch?.[1]?.trim() ?? 'No rationale provided.',
    };
  }
}
