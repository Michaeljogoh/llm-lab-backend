export type PromptPreset = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  prompt: string;
  tags: string[];
  temperature: number[];
  topP: number[];
  topK: number[];
  maxToken: number[];
};

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'explain-simple',
    name: 'Explain simply',
    description: 'Teach a complex topic to a curious beginner.',
    systemPrompt: 'You explain ideas clearly, with analogies and short paragraphs.',
    prompt: 'Explain how vaccines train the immune system.',
    tags: ['education'],
    temperature: [0.2, 0.4, 0.6],
    topP: [0.5, 0.7, 0.9],
    topK: [0.3, 0.5, 0.7],
    maxToken: [200, 300, 400],
  },
  {
    id: 'json-extract',
    name: 'JSON extraction',
    description: 'Structured output from unstructured text.',
    systemPrompt: 'Return valid JSON only. No markdown fences or commentary.',
    prompt:
      'Extract name, email, and company from: "Reach Alex Chen at alex@orbit.dev — Orbit Labs."',
    tags: ['structured'],
    temperature: [0.1, 0.2],
    topP: [0.3, 0.5],
    topK: [0.2, 0.4],
    maxToken: [100, 200],
  },
  {
    id: 'marketing-copy',
    name: 'Marketing copy',
    description: 'Short, punchy product taglines.',
    systemPrompt: 'Write concise marketing copy. Avoid clichés and exclamation marks.',
    prompt: 'Write a one-sentence tagline for a note-taking app with AI search.',
    tags: ['marketing'],
    temperature: [0.5, 0.7, 0.9],
    topP: [0.7, 0.9],
    topK: [0.4, 0.6],
    maxToken: [50, 100],
  },
  {
    id: 'code-review',
    name: 'Code review',
    description: 'Review a snippet for bugs and improvements.',
    systemPrompt: 'You are a senior engineer. Be direct and actionable.',
    prompt:
      'Review this function for bugs:\nfunction add(a,b){ return a + b }',
    tags: ['engineering'],
    temperature: [0.1, 0.3],
    topP: [0.5, 0.7],
    topK: [0.3, 0.5],
    maxToken: [300, 400],
  },
];
