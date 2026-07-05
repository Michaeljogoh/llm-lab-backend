export type BenchmarkPrompt = {
  id: string;
  name: string;
  prompt: string;
  systemPrompt: string;
};

export const GOLDEN_BENCHMARK_PROMPTS: BenchmarkPrompt[] = [
  {
    id: 'summarize',
    name: 'Summarize',
    systemPrompt: 'Summarize in two sentences.',
    prompt:
      'Summarize the causes of the 2008 financial crisis for a general audience.',
  },
  {
    id: 'reasoning',
    name: 'Reasoning',
    systemPrompt: 'Show your reasoning step by step, then give the final answer.',
    prompt: 'If a train travels 120 km in 1.5 hours, what is its average speed in km/h?',
  },
  {
    id: 'instruction',
    name: 'Instruction following',
    systemPrompt: 'Follow the format exactly.',
    prompt: 'List exactly three benefits of regular exercise. Use bullet points only.',
  },
  {
    id: 'creative',
    name: 'Creative writing',
    systemPrompt: 'Write vivid but concise prose.',
    prompt: 'Describe a city at dawn in under 80 words.',
  },
  {
    id: 'factual',
    name: 'Factual Q&A',
    systemPrompt: 'Answer accurately. Say "I am not sure" if uncertain.',
    prompt: 'What is the chemical symbol for gold and what group is it in on the periodic table?',
  },
];

export const BENCHMARK_DEFAULT_PARAMS = {
  temperature: [0.2, 0.5, 0.8],
  topP: [0.5, 0.8],
  topK: [0.4, 0.6],
  maxToken: [200, 300],
};
