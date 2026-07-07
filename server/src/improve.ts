import { getWritingSkill } from "./skill.js";
import { generateText } from "./gemini.js";

export async function improveText(text: string, instruction: string): Promise<string> {
  const skill = await getWritingSkill();
  const styleBlock = skill ?? "No writing-style guide available, so use a warm, professional, concise default tone.";

  const prompt = `Revise the text below to apply the requested change. Keep it consistent with the writing-style guide, and never invent, change, or drop a fact (dates, times, names, commitments, requests) unless the requested change explicitly asks you to.

Text:
${text}

Requested change:
${instruction}

Writing style guide:
${styleBlock}

Keep the revised text in the same language as the original text above — not the language of the style guide's examples, which are mixed (mainly German and English) and only illustrate tone. Only change the language if the requested change explicitly asks you to.

Write like a real person, not an AI: use plain, natural, humanized language. Never use an em dash (—); use a period, comma, or "and" instead. Output ONLY the revised text, no explanation, no quotes around it.`;

  return generateText(prompt);
}
