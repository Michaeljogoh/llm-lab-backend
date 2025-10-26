import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { responseFormatter } from 'src/helpers/response-formatter';

type ReponseProps = {
  prompt: string;
  temperature: number;
  topP: number;
  topK: number;
  maxToken: number;
};

@Injectable()
export class LlmService {
  constructor(private configService: ConfigService) {}

  async llmResponse({
    prompt,
    temperature,
    topP,
    topK,
    maxToken,
  }: ReponseProps) {
    const GEMINI_KEY = this.configService.get<string>('gemini');

    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

    const res = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
      config: {
        temperature: temperature,
        topP: topP,
        topK: Math.round(topK),
        maxOutputTokens: maxToken,
        candidateCount: 1,
      },
    });

    if (!res)
      throw new HttpException(
        'model overloaded try again',
        HttpStatus.BAD_REQUEST,
      );
    const plainText = res.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const formatted = responseFormatter(plainText);
    return formatted;
  }
}
