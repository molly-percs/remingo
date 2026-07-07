import "dotenv/config";
import express from "express";
import { rewriteInStyle } from "./rewrite.js";
import { generateSubject } from "./subject.js";
import { improveText } from "./improve.js";

const app = express();
const port = Number(process.env.PORT ?? 4318);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.json({ ok: true, name: "ReMingo server" });
});

app.post("/rewrite", async (request, response) => {
  try {
    const text = typeof request.body?.text === "string" ? request.body.text : "";
    if (!text.trim()) {
      response.status(400).json({ error: "Missing 'text' in request body" });
      return;
    }
    const rewritten = await rewriteInStyle(text);
    response.json({ text: rewritten });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.post("/subject", async (request, response) => {
  try {
    const text = typeof request.body?.text === "string" ? request.body.text : "";
    if (!text.trim()) {
      response.status(400).json({ error: "Missing 'text' in request body" });
      return;
    }
    const subject = await generateSubject(text);
    response.json({ text: subject });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.post("/improve", async (request, response) => {
  try {
    const text = typeof request.body?.text === "string" ? request.body.text : "";
    const instruction = typeof request.body?.instruction === "string" ? request.body.instruction : "";
    if (!text.trim() || !instruction.trim()) {
      response.status(400).json({ error: "Missing 'text' or 'instruction' in request body" });
      return;
    }
    const improved = await improveText(text, instruction);
    response.json({ text: improved });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.listen(port, () => {
  console.log(`Mail Style Extension server listening on http://localhost:${port}`);
});
