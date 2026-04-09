export const OPENROUTER_API_URL =
  "https://openrouter.ai/api/v1/chat/completions";

export const AVAILABLE_MODELS: { id: string; name: string }[] = [
  { id: "openrouter/free", name: "Free" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B" },
];

export const DEFAULT_MODEL = "openrouter/free";

export const FREE_MODEL_ID = "openrouter/free";
