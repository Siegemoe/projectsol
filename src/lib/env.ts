export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Sol";
export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? "development";

/** Server-side only (never expose to client) */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5";
