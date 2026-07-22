/**
 * Postinstall script to ensure the lightningcss native binary is installed.
 *
 * Bun 1.x sometimes fails to install platform-specific optional native
 * dependencies. This script downloads and places the .node binary
 * in the expected location within the .bun store.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";

const TARGET_VERSION = "1.33.0";
const PACKAGE_NAME = "lightningcss-win32-x64-msvc";

function findLightningcssDir(): string | null {
  // Search in .bun store
  const bunStore = join(process.cwd(), "node_modules", ".bun");
  if (existsSync(bunStore)) {
    const dirs = readdirSync(bunStore);
    for (const dir of dirs) {
      if (dir.startsWith("lightningcss@") && dir !== PACKAGE_NAME) {
        const candidate = join(bunStore, dir, "node_modules", "lightningcss");
        if (existsSync(candidate)) {
          return candidate;
        }
      }
    }
  }
  // Also try require.resolve for non-.bun setups
  try {
    const lcPath = require.resolve("lightningcss/package.json", { paths: [process.cwd()] });
    return dirname(lcPath);
  } catch {
    // ignore
  }
  return null;
}

function downloadTarball(url: string): Promise<Buffer> {
  const https = require("https") as typeof import("https");
  return new Promise((resolve, reject) => {
    function follow(u: string) {
      https.get(u, (res: any) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location);
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }).on("error", reject);
    }
    follow(url);
  });
}

function extractNodeFromTgz(tgzBuffer: Buffer): Buffer | null {
  const zlib = require("zlib") as typeof import("zlib");
  const decompressed = zlib.gunzipSync(tgzBuffer);
  let offset = 0;
  while (offset < decompressed.length) {
    const header = decompressed.slice(offset, offset + 512);
    if (header.every((b: number) => b === 0)) break;
    const name = header.slice(0, 100).toString("utf8").replace(/\0/g, "");
    const size = parseInt(header.slice(124, 136).toString("utf8").trim(), 8);
    if (name.endsWith(".node")) {
      return Buffer.from(decompressed.slice(offset + 512, offset + 512 + size));
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return null;
}

async function main() {
  const lightningcssDir = findLightningcssDir();
  if (!lightningcssDir) {
    console.log("[fix-lightningcss] lightningcss not found, skipping");
    return;
  }

  // Check if the binary is already in place (fallback location)
  const targetFile = join(lightningcssDir, "lightningcss.win32-x64-msvc.node");
  if (existsSync(targetFile)) {
    console.log("[fix-lightningcss] Native binary already in place, skipping");
    return;
  }

  // Check if module directory exists
  const modDir = join(dirname(lightningcssDir), PACKAGE_NAME);
  if (existsSync(join(modDir, "package.json"))) {
    console.log("[fix-lightningcss] Module directory already in place, skipping");
    return;
  }

  console.log("[fix-lightningcss] Downloading native binary for lightningcss...");
  try {
    const tgzBuffer = await downloadTarball(
      `https://registry.npmjs.org/${PACKAGE_NAME}/-/${PACKAGE_NAME}-${TARGET_VERSION}.tgz`
    );
    const nodeBinary = extractNodeFromTgz(tgzBuffer);
    if (!nodeBinary) {
      console.error("[fix-lightningcss] Failed to extract .node binary from tarball");
      process.exit(1);
    }

    // Place at fallback location (used by require('../lightningcss.win32-x64-msvc.node'))
    writeFileSync(targetFile, nodeBinary);
    console.log(`[fix-lightningcss] Placed binary at ${targetFile} (${nodeBinary.length} bytes)`);

    // Also create module directory for require('lightningcss-win32-x64-msvc')
    mkdirSync(modDir, { recursive: true });
    writeFileSync(
      join(modDir, "package.json"),
      JSON.stringify({ name: PACKAGE_NAME, version: TARGET_VERSION, main: "lightningcss.win32-x64-msvc.node" }, null, 2)
    );
    copyFileSync(targetFile, join(modDir, "lightningcss.win32-x64-msvc.node"));
    console.log(`[fix-lightningcss] Created module directory at ${modDir}`);
  } catch (err) {
    console.error("[fix-lightningcss] Failed to install native binary:", err);
  }
}

main().catch((err) => {
  console.error("[fix-lightningcss] Unexpected error:", err);
});
