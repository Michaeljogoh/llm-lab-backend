import {
  IsString,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class ScoringWeightsDto {
  @IsOptional() @IsNumber() completeness?: number;
  @IsOptional() @IsNumber() coherence?: number;
  @IsOptional() @IsNumber() lengthAppropriateness?: number;
  @IsOptional() @IsNumber() structuralPatterns?: number;
  @IsOptional() @IsNumber() hallucination?: number;
  @IsOptional() @IsNumber() correctness?: number;
  @IsOptional() @IsNumber() readability?: number;
}

export class CreateExperimentDto {
  @IsNotEmpty()
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsNotEmpty()
  @IsArray()
  temperature: number[];

  @IsNotEmpty()
  @IsArray()
  topP: number[];

  @IsNotEmpty()
  @IsArray()
  topK: number[];

  @IsNotEmpty()
  @IsArray()
  maxToken: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  models?: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ScoringWeightsDto)
  scoringWeights?: ScoringWeightsDto;

  @IsOptional()
  @IsBoolean()
  enableJudge?: boolean;

  @IsOptional()
  @IsString()
  parentExperimentId?: string;

  @IsOptional()
  @IsString()
  benchmarkSuiteId?: string;
}
