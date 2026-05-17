import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.resolve(__dirname, '../../../assets');
const dest = path.resolve(__dirname, '../public/assets');

console.log(`[copy-assets] Copying assets from:\n  Source: ${src}\n  Destination: ${dest}`);

try {
  // Ensure source exists
  if (!fs.existsSync(src)) {
    console.error(`[copy-assets] Error: Source path does not exist: ${src}`);
    process.exit(1);
  }

  // If destination already exists, clean it up first to avoid trailing/merged assets
  if (fs.existsSync(dest)) {
    console.log('[copy-assets] Destination exists. Cleaning old assets...');
    fs.rmSync(dest, { recursive: true, force: true });
  }

  // Create target directory
  fs.mkdirSync(dest, { recursive: true });

  // Recursively copy assets
  fs.cpSync(src, dest, { recursive: true });
  console.log('[copy-assets] Assets copied successfully!');
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[copy-assets] Error occurred: ${errorMessage}`);
  process.exit(1);
}
