import fs from 'fs';
import path from 'path';

const TARGET_DIRS = new Set(['node_modules', '.turbo', 'dist', '.expo', 'build']);
const IGNORE_DIRS = new Set(['.git']);

function cleanDir(dir: string) {
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch (err) {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(fullPath);
    } catch (err) {
      continue;
    }

    if (stat.isDirectory()) {
      if (TARGET_DIRS.has(entry)) {
        console.log(`🗑️ Deleting: ${fullPath}`);
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } catch (err) {
          console.error(`⚠️ Failed to delete ${fullPath}: ${(err as Error).message}`);
        }
      } else if (!IGNORE_DIRS.has(entry)) {
        cleanDir(fullPath);
      }
    }
  }
}

console.log("🧹 Starting deep cleanup of monorepo artifacts...");
cleanDir(path.resolve('.'));
console.log("\n✅ Cleanup complete. Run 'bun install' to restore dependencies.");
