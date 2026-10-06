import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const serverPath = process.argv[2] ?? new URL("../server.ts", import.meta.url);
const source = readFileSync(serverPath, "utf8");
const startMarker = "    const config = {";
const endMarker = "    const candidateModels";
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start + startMarker.length);

assert(start >= 0 && end > start, "Gemini crew-command config was not found");
const config = source.slice(start, end);

assert.doesNotMatch(
  config,
  /\b(?:temperature|topP|topK|thinkingBudget|thinking_budget|top_p|top_k)["']?\s*:/,
  "Gemini config contains an unsupported sampling or thinking-budget field",
);
assert.match(config, /responseMimeType\s*:\s*["']application\/json["']/);
assert.match(config, /responseSchema\s*:/);

console.log("Gemini crew-command config smoke check passed");
