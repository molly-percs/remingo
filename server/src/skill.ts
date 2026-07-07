import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = path.resolve(moduleDir, "../data/mail-skill.md");

let cachedSkill: string | null | undefined;

// Strips the leading YAML frontmatter block (skill-routing metadata for other tools,
// not content for this prompt) and keeps the Markdown body as-is.
function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\n[\s\S]*?\n---\n?/);
  return (match ? raw.slice(match[0].length) : raw).trim();
}

export async function getWritingSkill(): Promise<string | null> {
  if (cachedSkill !== undefined) return cachedSkill;
  try {
    const raw = await fs.readFile(SKILL_PATH, "utf-8");
    cachedSkill = stripFrontmatter(raw);
  } catch {
    cachedSkill = null;
  }
  return cachedSkill;
}
