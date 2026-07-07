import { getWritingSkill } from "./skill.js";
import { generateText } from "./gemini.js";

export async function generateSubject(bodyText: string): Promise<string> {
  const skill = await getWritingSkill();
  const styleBlock = skill ?? "No writing-style guide available, so use a warm, professional, concise default tone.";

  const prompt = `Write a short, clear subject line for the email below, following the "Subject Lines" guidance in the writing-style guide (clear, professional, specific; avoid vague subjects like "Anfrage" or "Quick question").

Writing style guide:
${styleBlock}

Email:
${bodyText}

The subject line must be written in the same language as the email above, based on its actual content — not the language of the style guide's examples above, which are mixed (mainly German and English) and only illustrate tone. If the email is in English, write the subject in English; if German, write it in German; whatever language the email is in, match it exactly.

Output ONLY the subject line text itself: no "Subject:" prefix, no quotes, no explanation.`;

  return generateText(prompt);
}
