import "server-only";

import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!client) client = new OpenAI({ apiKey: key });
  return client;
}

export type MessageSummary = {
  summary: string;
  tone: string;
};

const TONES = [
  "tender", "grateful", "playful", "proud", "nostalgic", "encouraging",
  "apologetic", "celebratory", "reflective", "loving",
] as const;

/**
 * Summarises a single message for the recipient's own dashboard.
 *
 * Two product rules shape this:
 *   1. It only ever runs when the recipient explicitly asks — message text is
 *      not shipped to a third party in the background.
 *   2. The summary is written *to* the recipient in plain, warm language, not
 *      as a clinical abstract. A cold summary of a loving message is worse
 *      than no summary at all.
 */
export async function summariseMessage(content: string): Promise<MessageSummary | null> {
  const openai = getClient();
  if (!openai) return null;

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  try {
    const response = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 160,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You help someone revisit heartfelt messages they have been sent.",
            "Given one message, reply with JSON: {\"summary\": string, \"tone\": string}.",
            "`summary` is one warm sentence, at most 22 words, addressed to the recipient,",
            "capturing what the sender is actually saying. Never invent details.",
            `\`tone\` is exactly one of: ${TONES.join(", ")}.`,
          ].join(" "),
        },
        { role: "user", content: content.slice(0, 4000) },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<MessageSummary>;
    if (!parsed.summary) return null;

    return {
      summary: String(parsed.summary).slice(0, 300),
      tone: TONES.includes(parsed.tone as (typeof TONES)[number])
        ? String(parsed.tone)
        : "reflective",
    };
  } catch (error) {
    console.error("[ai] summarise failed", error);
    return null;
  }
}

export const aiEnabled = () => Boolean(process.env.OPENAI_API_KEY);
