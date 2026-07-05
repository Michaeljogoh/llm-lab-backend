export default () => ({
  gemini: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash-001',
  mongoUri: process.env.MONGO_URI,
  availableModels: (
    process.env.GEMINI_MODELS ??
    'gemini-2.0-flash-001,gemini-2.5-flash,gemini-2.5-flash-lite'
  ).split(','),
});
