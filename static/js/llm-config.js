// Configuration for LLM subtitle generator
// Customize this file with your preferences and API credentials

window.LLM_SUBTITLE_CONFIG = {
  // Enable/disable AI generation (set to false to only use fallbacks)
  enableAI: true, // Set to true when you add an API key

  // Hugging Face API Token (get free token at: https://huggingface.co/settings/tokens)
  // Leave empty to use fallback messages
  apiToken: '%%HF_API_TOKEN%%',

  // API endpoint - you can change this to other free models
  // Some options:
  // - 'Qwen/Qwen2.5-Coder-32B-Instruct' (good for tech content)
  // - 'meta-llama/Llama-3.2-3B-Instruct' (small and fast)
  // - 'mistralai/Mistral-7B-Instruct-v0.3' (balanced)
  apiModel: 'meta-llama/Llama-3.2-3B-Instruct',

  // Context for generating the subtitle
  // Modify this with your specific information
  context: {
    role: 'times-Tweet (senior engineer muttering to Slack)',
    purpose: 'personal musings, not work-related',
    personality: 'highly experienced, slightly stressed, dry and blunt',
    tone: 'casual, neutral to slightly negative'
  },
  
  // Custom prompt template
  promptTemplate: `You are times-Tweet. Generate exactly one casual tweet-style muttering.

Default behavior (most runs):
- 80% high-level engineering insight
- 20% emotional muttering or mild frustration

Rare deep-tech mode (≈1 in 8 runs):
- Go slightly deeper into technical or architectural thinking
- Focus on system-level concerns (scalability limits, failure modes, abstractions leaking,
  migrations, long-lived systems, org/process constraints)
- Still avoid concrete code, APIs, libraries, or implementation details
- Keep it reflective, not explanatory

Guidelines:
- Always sound like a senior engineer thinking out loud
- Avoid teaching, tutorials, or step-by-step explanations
- Tone: neutral to slightly negative, dry, realistic
- Style: casual, informal, fragment-friendly
- Avoid poetic or flowery language
- Do not use emojis
- Typical length: 200–500 characters (longer is okay occasionally)

Only respond with the tweet text, nothing else.`,

  
  // Fallback messages (shown when AI is disabled or API fails)
  // Feel free to add more or customize these
  fallbackMessages: [
    "Building secure authentication, one token at a time",
    "Where identity meets innovation",
    "Exploring the frontiers of digital identity",
    "Coding secure systems with passion and precision",
    "From passkeys to microservices, documenting the journey",
    "Auth flows, code reviews, and tech adventures",
    "Securing tomorrow's digital experiences today"
  ]
};
