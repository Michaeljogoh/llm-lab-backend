import { Injectable } from '@nestjs/common';
import {
  DEFAULT_SCORING_WEIGHTS,
  ScoringWeights,
} from 'src/experiment/constants/scoring-weights';

type QualityMetrics = {
  completeness: number;
  coherence: number;
  lengthAppropriateness: number;
  structuralPatterns: number;
  hallucination: number;
  correctness: number;
  wordcount: number;
  readability: number;
  qualityScore: number;
};

@Injectable()
export class MetricsService {
  tokenize(text: string) {
    return text.toLowerCase().split(/\s+/).filter(Boolean);
  }

  wordCount(text: string) {
    return this.tokenize(text).length;
  }

  completeness(prompt: string, response: string) {
    const promptTokens = new Set(this.tokenize(prompt));
    const responseTokens = new Set(this.tokenize(response));
    const overlap = [...promptTokens].filter((t) => responseTokens.has(t));
    return +(overlap.length / promptTokens.size || 0).toFixed(3);
  }

  coherence(text: string) {
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => this.tokenize(s))
      .filter((s) => s.length > 0);
    if (sentences.length < 2) return 1.0;
    let sims = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const setA = new Set(sentences[i]);
      const setB = new Set(sentences[i + 1]);
      const overlap = [...setA].filter((t) => setB.has(t)).length;
      sims += overlap / Math.max(setA.size, setB.size);
    }
    return +(sims / (sentences.length - 1)).toFixed(3);
  }

  lengthAppropriateness(prompt: string, response: string) {
    const pWords = this.wordCount(prompt);
    const rWords = this.wordCount(response);
    const ideal = pWords * 4;
    const ratio = Math.min(rWords / ideal, ideal / rWords);
    return +ratio.toFixed(3);
  }

  structuralPatterns(text: string) {
    const headings = (text.match(/^#+\s+/gm) || []).length;
    const lists = (text.match(/^[-*]\s+/gm) || []).length;
    const paragraphs = text.split(/\n{2,}/).length;
    const structureScore = Math.min((headings + lists + paragraphs) / 10, 1);
    return +structureScore.toFixed(3);
  }

  hallucination(prompt: string, response: string) {
    const promptTokens = new Set(this.tokenize(prompt));
    const responseTokens = this.tokenize(response);
    const newEntities = responseTokens.filter((t) => !promptTokens.has(t));
    const ratio = newEntities.length / responseTokens.length;
    return +(1 - ratio).toFixed(3);
  }

  correctness(text: string) {
    const contradictionMarkers = [
      'however',
      'but',
      'although',
      'contradict',
      'inconsistent',
    ];
    const found = contradictionMarkers.filter((m) =>
      text.toLowerCase().includes(m),
    ).length;
    return +(1 - Math.min(found / 5, 1)).toFixed(3);
  }

  readability(text: string) {
    const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
    const words = this.wordCount(text);
    const avgSentenceLen = words / sentences;
    return +(1 - Math.min(Math.abs(avgSentenceLen - 15) / 15, 1)).toFixed(3);
  }

  qualityMetrics(prompt: string, response: string) {
    return {
      completeness: this.completeness(prompt, response),
      coherence: this.coherence(response),
      lengthAppropriateness: this.lengthAppropriateness(prompt, response),
      structuralPatterns: this.structuralPatterns(response),
      hallucination: this.hallucination(prompt, response),
      correctness: this.correctness(response),
      wordcount: this.wordCount(response),
      readability: this.readability(response),
      qualityScore: this.qualityScore(prompt, response),
    };
  }

  qualityScore(
    prompt: string,
    response: string,
    weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  ) {
    const metrics = {
      completeness: this.completeness(prompt, response),
      coherence: this.coherence(response),
      lengthAppropriateness: this.lengthAppropriateness(prompt, response),
      structuralPatterns: this.structuralPatterns(response),
      hallucination: this.hallucination(prompt, response),
      correctness: this.correctness(response),
      readability: this.readability(response),
    };

    return this.weightedScore(metrics, weights);
  }

  weightedScore(
    metrics: Omit<QualityMetrics, 'qualityScore' | 'wordcount'>,
    weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  ): number {
    const w = { ...DEFAULT_SCORING_WEIGHTS, ...weights };
    const totalWeight =
      w.completeness +
      w.coherence +
      w.lengthAppropriateness +
      w.structuralPatterns +
      w.hallucination +
      w.correctness +
      w.readability;

    const sum =
      metrics.completeness * w.completeness +
      metrics.coherence * w.coherence +
      metrics.lengthAppropriateness * w.lengthAppropriateness +
      metrics.structuralPatterns * w.structuralPatterns +
      metrics.hallucination * w.hallucination +
      metrics.correctness * w.correctness +
      metrics.readability * w.readability;

    return +(sum / totalWeight).toFixed(3);
  }

  calculateQualityScore(
    metrics: QualityMetrics,
    weights?: ScoringWeights,
  ): number {
    return this.weightedScore(metrics, weights);
  }
}
