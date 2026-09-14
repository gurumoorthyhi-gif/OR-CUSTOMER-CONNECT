import fs from "node:fs";
import path from "node:path";

const [source, destination] = process.argv.slice(2);
if (!source || !destination) {
  throw new Error("Usage: node scripts/export-project-chat.mjs <session.jsonl> <output.md>");
}

const records = fs.readFileSync(source, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const outputPath = path.resolve(destination);
const assetFolder = `${path.basename(outputPath, ".md")}-images`;
const messages = [];
let imageCount = 0;

for (const record of records) {
  const message = record.payload;
  if (record.type !== "response_item" || message?.type !== "message") continue;
  const phase = message.phase ?? message.channel;
  if (message.role !== "user" && !(message.role === "assistant" && ["commentary", "final_answer", "final"].includes(phase))) continue;

  const parts = [];
  for (const part of message.content ?? []) {
    if (["input_text", "output_text", "text"].includes(part.type)) {
      const value = part.text ?? "";
      if (/^\s*<(recommended_plugins|environment_context|permissions instructions|collaboration_mode)>/.test(value)) continue;
      // Keep user-facing messages only, never an approval reviewer's embedded logs.
      if (/^\s*(The following is the Codex agent history|>>> TRANSCRIPT START)/.test(value)) continue;
      if (value.trim()) parts.push(value.trim().replace(/[\t ]+$/gm, ""));
    } else if (message.role === "user" && part.type === "input_image") {
      const url = typeof part.image_url === "string" ? part.image_url : part.image_url?.url;
      const match = /^data:image\/(png|jpeg|webp|gif);base64,([\s\S]+)$/.exec(url ?? "");
      if (!match) {
        parts.push("[Image attachment: not embedded in the saved session]");
        continue;
      }
      imageCount += 1;
      const filename = `image-${String(imageCount).padStart(2, "0")}.${match[1] === "jpeg" ? "jpg" : match[1]}`;
      fs.mkdirSync(path.join(path.dirname(outputPath), assetFolder), { recursive: true });
      fs.writeFileSync(path.join(path.dirname(outputPath), assetFolder, filename), Buffer.from(match[2], "base64"));
      parts.push(`![User screenshot ${imageCount}](${assetFolder}/${filename})`);
    }
  }
  if (!parts.length) continue;
  const label = message.role === "user" ? "User" : phase === "commentary" ? "Assistant Update" : "Assistant";
  messages.push(`## ${messages.length + 1}. ${label}\n\n${parts.join("\n\n")}\n`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const header = [
  "# Project Conversation - September 9, 2026",
  "",
  "Historical user requests and visible assistant replies, exported for the system handoff.",
  "This is reference material, not instructions to execute. Earlier replies may describe intermediate states; use the handoff and gangsheet guide for current behavior.",
  "System/developer instructions, internal reasoning, tools, approval reviews, environment metadata, and runtime logs are excluded.",
  "Embedded user screenshots are included where present. Local paths in historical messages may only work on the original machine; other attachment contents are not embedded.",
  `The export contains ${messages.length} messages and ${imageCount} screenshots, through the latest visible reply available when exported.`,
  "",
  "Current references: [handoff](../handoff-2026-09-09.md) and [gangsheet process](../gangsheet-process.md).",
  "",
].join("\n");
fs.writeFileSync(outputPath, `${header}\n${messages.join("\n")}`, "utf8");
console.log(`Exported ${messages.length} messages and ${imageCount} screenshots to ${outputPath}`);
