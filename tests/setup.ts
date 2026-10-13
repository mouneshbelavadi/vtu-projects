import fs from "node:fs";
import path from "node:path";

const envLocal = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envLocal)) {
  const content = fs.readFileSync(envLocal, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}
