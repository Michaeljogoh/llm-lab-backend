import { Injectable } from '@nestjs/common';


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

 
// LLM RESPONSE QUALITY METRICS
@Injectable()
export class MetricsService {

  // --- Tokenizer ---
  tokenize(text: string) {
    return text.toLowerCase().split(/\s+/).filter(Boolean);
  }

  // --- Basic Metrics ---
  wordCount(text: string) {
    return this.tokenize(text).length;
  }
  // Completeness: compares overlap between prompt and response
  completeness(prompt: string, response: string) {
    const promptTokens = new Set(this.tokenize(prompt));
    const responseTokens = new Set(this.tokenize(response));
    const overlap = [...promptTokens].filter(t => responseTokens.has(t));
    return +(overlap.length / promptTokens.size || 0).toFixed(3);
  }

  // Coherence: measures logical flow by sentence-to-sentence similarity
  coherence(text: string) {
    const sentences = text.split(/[.!?]+/).map(s => this.tokenize(s)).filter(s => s.length > 0);
    if (sentences.length < 2) return 1.0;
    let sims = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const setA = new Set(sentences[i]);
      const setB = new Set(sentences[i + 1]);
      const overlap = [...setA].filter(t => setB.has(t)).length;
      sims += overlap / Math.max(setA.size, setB.size);
    }
    return +(sims / (sentences.length - 1)).toFixed(3);
  }

  // Length Appropriateness: ideal length range heuristic
  lengthAppropriateness(prompt: string, response: string) {
    const pWords = this.wordCount(prompt);
    const rWords = this.wordCount(response);
    const ideal = pWords * 4; // assume ideal response ~4x prompt
    const ratio = Math.min(rWords / ideal, ideal / rWords);
    return +ratio.toFixed(3);
  }

  // Structural Patterns: detects headings, lists, paragraphs
  structuralPatterns(text: string) {
    const headings = (text.match(/^#+\s+/gm) || []).length;
    const lists = (text.match(/^[-*]\s+/gm) || []).length;
    const paragraphs = (text.split(/\n{2,}/).length);
    const structureScore = Math.min((headings + lists + paragraphs) / 10, 1);
    return +structureScore.toFixed(3);
  }

  // Hallucination likelihood: rare entities not in prompt
  hallucination(prompt: string, response: string) {
    const promptTokens = new Set(this.tokenize(prompt));
    const responseTokens = this.tokenize(response);
    const newEntities = responseTokens.filter(t => !promptTokens.has(t));
    const ratio = newEntities.length / responseTokens.length;
    return +(1 - ratio).toFixed(3); // higher is better (less hallucination)
  }

  // Correctness heuristic: detects contradiction markers
  correctness(text: string) {
    const contradictionMarkers = ['however', 'but', 'although', 'contradict', 'inconsistent'];
    const found = contradictionMarkers.filter(m => text.toLowerCase().includes(m)).length;
    return +(1 - Math.min(found / 5, 1)).toFixed(3);
  };

  // --- Readability ---
  readability(text: string) {
    const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
    const words = this.wordCount(text);
    const avgSentenceLen = words / sentences;
    return +(1 - Math.min(Math.abs(avgSentenceLen - 15) / 15, 1)).toFixed(3);
  };
  
  // Compute all new metrics
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

  // Combined LLM Quality Score
  qualityScore(prompt: string, response: string) {
    const c = this.completeness(prompt, response);
    const coh = this.coherence(response);
    const len = this.lengthAppropriateness(prompt, response);
    const str = this.structuralPatterns(response);
    const hal = this.hallucination(prompt, response);
    const cor = this.correctness(response);
    const r = this.readability(response)
    return +((c + coh + len + str + hal + cor + r) / 6).toFixed(3);
  };

  calculateQualityScore(metrics: QualityMetrics): number {

  const c = metrics.completeness;
  const coh = metrics.coherence;
  const len = metrics.lengthAppropriateness;
  const str = metrics.structuralPatterns;
  const hal = metrics.hallucination;
  const cor = metrics.correctness;
  const r = metrics.readability;

  // Sum selected properties and divide by 6, then round
  const score = +((c + coh + len + str + hal + cor + r) / 6).toFixed(3);

  return score;
  }


}
