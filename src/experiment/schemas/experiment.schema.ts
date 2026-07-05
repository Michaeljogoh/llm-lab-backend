import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class Parameters {
  @Prop({ required: true })
  temperature: number;

  @Prop({ required: true })
  topP: number;

  @Prop({ required: true })
  topK: number;

  @Prop({ required: true })
  maxToken: number;
}

@Schema({ _id: false })
class Metrics {
  @Prop({ required: true })
  completeness: number;

  @Prop({ required: true })
  coherence: number;

  @Prop({ required: true })
  lengthAppropriateness: number;

  @Prop({ required: true })
  structuralPatterns: number;

  @Prop({ required: true })
  hallucination: number;

  @Prop({ required: true })
  correctness: number;

  @Prop({ required: true })
  wordcount: number;

  @Prop({ required: true })
  readability: number;

  @Prop({ required: true })
  qualityScore: number;
}

@Schema({ _id: false })
class RunConfig {
  @Prop({ type: [Number], required: true })
  temperature: number[];

  @Prop({ type: [Number], required: true })
  topP: number[];

  @Prop({ type: [Number], required: true })
  topK: number[];

  @Prop({ type: [Number], required: true })
  maxToken: number[];
}

@Schema({ _id: false })
class Progress {
  @Prop({ default: 0 })
  completed: number;

  @Prop({ default: 0 })
  total: number;

  @Prop({ default: 0 })
  failed: number;
}

@Schema({ _id: false })
class ScoringWeights {
  @Prop({ default: 1 }) completeness: number;
  @Prop({ default: 1 }) coherence: number;
  @Prop({ default: 1 }) lengthAppropriateness: number;
  @Prop({ default: 1 }) structuralPatterns: number;
  @Prop({ default: 1 }) hallucination: number;
  @Prop({ default: 1 }) correctness: number;
  @Prop({ default: 1 }) readability: number;
}

@Schema({ _id: false })
class SuggestedSweep {
  @Prop() message: string;
  @Prop({ type: RunConfig }) runConfig: RunConfig;
  @Prop() topParameter: string;
}

@Schema({ _id: false })
class RegressionResult {
  @Prop() baselineScore: number;
  @Prop() newScore: number;
  @Prop() delta: number;
  @Prop() passed: boolean;
  @Prop() baselineExperimentId: string;
}

@Schema({ _id: false })
class Response {
  @Prop({ type: Parameters, required: true })
  parameters: Parameters;

  @Prop({ required: true })
  response: string;

  @Prop({ type: Metrics, required: true })
  metrics: Metrics;

  @Prop({ required: true })
  score: number;

  @Prop()
  model?: string;

  @Prop()
  latencyMs?: number;

  @Prop()
  inputTokens?: number;

  @Prop()
  outputTokens?: number;

  @Prop()
  estimatedCostUsd?: number;

  @Prop()
  judgeScore?: number;

  @Prop()
  judgeRationale?: string;

  @Prop({ type: String, enum: ['up', 'down'], default: null })
  humanRating?: 'up' | 'down' | null;
}

@Schema({ timestamps: true })
export class Experiment extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  prompt: string;

  @Prop({ default: '' })
  systemPrompt: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [Response], default: [] })
  responses: Response[];

  @Prop({
    type: String,
    enum: ['queued', 'running', 'completed', 'failed', 'paused'],
    default: 'queued',
  })
  status: string;

  @Prop({ type: Progress, default: () => ({ completed: 0, total: 0, failed: 0 }) })
  progress: Progress;

  @Prop({ type: [String], default: [] })
  models: string[];

  @Prop({ type: RunConfig })
  runConfig: RunConfig;

  @Prop({ type: ScoringWeights })
  scoringWeights: ScoringWeights;

  @Prop({ default: false })
  enableJudge: boolean;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop()
  shareToken?: string;

  @Prop()
  parentExperimentId?: string;

  @Prop({ type: SuggestedSweep })
  suggestedNextSweep?: SuggestedSweep;

  @Prop({ type: RegressionResult })
  regressionResult?: RegressionResult;

  @Prop()
  benchmarkSuiteId?: string;
}

export const ExperimentSchema = SchemaFactory.createForClass(Experiment);
