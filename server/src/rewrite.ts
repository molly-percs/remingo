import { getWritingSkill } from "./skill.js";
import { generateText } from "./gemini.js";

export async function rewriteInStyle(text: string): Promise<string> {
  const skill = await getWritingSkill();
  const styleBlock = skill ?? "No writing-style guide available, so use a warm, professional, concise default tone.";

  const prompt = `Rewrite the dictated draft below into a complete, copy-ready email that follows the writing-style guide exactly: greeting, closing, signature, and overall structure should be built to match the guide, even if the draft itself has none of that.

Never invent, change, or drop a fact: preserve every date, time, name, request, commitment, and piece of information exactly as given. Everything else (wording, tone, greeting, structure, closing) should be shaped to match the style guide, not the draft's original phrasing.

Write the entire rewritten email in the same language as the dictated draft below. The style guide below contains examples in multiple languages (mainly German and English) purely to illustrate tone and phrasing rules in each language — it is not an instruction to switch languages. If the draft is in English, the whole output must be in English; if German, the whole output must be in German; whatever language the draft is in, match it exactly.

Writing style guide:
${styleBlock}

Dictated draft:
${text}

Write like a real person, not an AI: use plain, natural, humanized language. Never use an em dash (—); use a period, comma, or "and" instead. Output ONLY the rewritten email, no explanation, no quotes around it.`;

  return generateText(prompt);
}
