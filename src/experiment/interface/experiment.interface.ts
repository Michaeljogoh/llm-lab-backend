

export interface Exper { 
  parameters:{
  temperature: number;
  topP: number;
  }
  response: string; 
  metrics: { 
  completeness: number,
  coherence: number,
  lengthAppropriateness: number,
  structuralPatterns: number,
  hallucination: number,
  correctness: number,
  wordcount: number,
  readability: number,
  qualityScore: number
  }; 
  score?: number
}

