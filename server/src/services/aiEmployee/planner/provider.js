/**
 * AI Employee — model provider adapter.
 *
 * The Planner asks for one thing: "given this context, return JSON matching this
 * schema". Two providers can answer.
 *
 *   anthropic — Claude, via the official SDK with structured outputs. The schema
 *               is enforced by the API, so the response is valid by construction.
 *   groq      — Llama, the provider proposal generation already uses. No schema
 *               enforcement, so the schema is described in the prompt and the
 *               result is validated here.
 *
 * Selection order: AI_PLANNER_PROVIDER if set, otherwise whichever API key is
 * present (Anthropic preferred — plan generation is exactly the long structured
 * output that Llama struggles with). With neither key set the Planner still
 * works; it falls back to the deterministic scaffold alone.
 */

import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_MODEL = process.env.AI_PLANNER_ANTHROPIC_MODEL || 'claude-opus-5';
const GROQ_MODEL = process.env.AI_PLANNER_GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_TOKENS = 16000;

const anthropicKey = () => process.env.ANTHROPIC_API_KEY || null;
const groqKey = () => process.env.GROQ_API_KEY || null;

/** Which providers are usable right now, and which one would be chosen. */
export const describeProviders = () => {
  const available = [];
  if (anthropicKey()) available.push('anthropic');
  if (groqKey()) available.push('groq');

  const forced = process.env.AI_PLANNER_PROVIDER || null;
  const selected = forced && available.includes(forced)
    ? forced
    : available[0] ?? null;

  return {
    available,
    selected,
    forced,
    // Set but unusable — worth surfacing rather than silently ignoring.
    misconfigured: forced && !available.includes(forced) ? forced : null,
    models: { anthropic: ANTHROPIC_MODEL, groq: GROQ_MODEL }
  };
};

export const isAiAvailable = () => describeProviders().selected !== null;

// ── Anthropic ────────────────────────────────────────────────────────────

const generateWithAnthropic = async ({ system, prompt, schema }) => {
  const client = new Anthropic({ apiKey: anthropicKey() });

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: 'user', content: prompt }],
    // The API constrains the response to this schema, so no repair pass is needed.
    output_config: {
      format: { type: 'json_schema', schema }
    }
  });

  if (response.stop_reason === 'refusal') {
    throw new Error(
      `Claude declined the request (${response.stop_details?.category ?? 'unspecified'})`
    );
  }

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  if (!text) throw new Error('Claude returned no text content');

  return {
    data: JSON.parse(text),
    model: response.model ?? ANTHROPIC_MODEL,
    provider: 'anthropic',
    usage: {
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null
    },
    raw: text
  };
};

// ── Groq ─────────────────────────────────────────────────────────────────

/**
 * Groq has no schema enforcement, so the schema goes in the prompt and the model
 * is asked for a JSON object. Output still needs unwrapping — Llama often wraps
 * JSON in markdown fences despite being told not to.
 */
const generateWithGroq = async ({ system, prompt, schema }) => {
  const schemaPrompt =
    `${prompt}\n\n` +
    `Return ONLY a JSON object matching this JSON Schema exactly. ` +
    `No markdown, no code fences, no commentary.\n\n` +
    `SCHEMA:\n${JSON.stringify(schema, null, 2)}`;

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey()}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: schemaPrompt }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Groq request failed: ${body.error?.message || response.statusText}`);
  }

  const body = await response.json();
  const text = body.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned no content');

  return {
    data: JSON.parse(stripFences(text)),
    model: GROQ_MODEL,
    provider: 'groq',
    usage: {
      inputTokens: body.usage?.prompt_tokens ?? null,
      outputTokens: body.usage?.completion_tokens ?? null
    },
    raw: text
  };
};

/** Pull a JSON object out of a response that may be fenced or prefixed. */
const stripFences = (text) => {
  let out = text.trim().replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const start = out.indexOf('{');
  const end = out.lastIndexOf('}');
  if (start !== -1 && end > start) out = out.slice(start, end + 1);
  return out;
};

// ── Public entry point ───────────────────────────────────────────────────

/**
 * Generate a JSON object conforming to `schema`.
 * Throws if no provider is configured — callers decide whether that is fatal
 * (it is not, for the Planner: the deterministic scaffold still runs).
 */
export const generateJson = async ({ system, prompt, schema, provider = null }) => {
  const chosen = provider ?? describeProviders().selected;

  if (chosen === 'anthropic') return generateWithAnthropic({ system, prompt, schema });
  if (chosen === 'groq') return generateWithGroq({ system, prompt, schema });

  throw new Error(
    'No AI provider configured. Set ANTHROPIC_API_KEY or GROQ_API_KEY, ' +
    'or generate a scaffold-only plan.'
  );
};
