import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    'Missing OPENAI_API_KEY in environment. Add it to .env.local:\n  OPENAI_API_KEY=sk-...'
  );
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
