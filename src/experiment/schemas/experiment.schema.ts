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
class Response {
  @Prop({ type: Parameters, required: true })
  parameters: Parameters;

  @Prop({ required: true })
  response: string;

  @Prop({ type: Metrics, required: true })
  metrics: Metrics;

  @Prop({ required: true })
  score: number;
}

@Schema({ timestamps: true })
export class Experiment extends Document {

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  prompt: string;
  
  @Prop({ type: [Response], required: true })
  responses: Response[];
  
}

export const ExperimentSchema = SchemaFactory.createForClass(Experiment);
