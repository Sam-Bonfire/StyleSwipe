import { mkdirSync } from 'node:fs';
import path from 'node:path';

/** Reads a `--name value` CLI arg. Single copy — all eval scripts use this. */
export function readArg(argv: string[], name: string): string | undefined {
  const idx = argv.indexOf(name);
  return idx >= 0 ? argv[idx + 1] : undefined;
}

/** Resolves an output path against cwd, creating its directory. */
export function resolveOut(out: string): string {
  const resolved = path.isAbsolute(out) ? out : path.join(process.cwd(), out);
  mkdirSync(path.dirname(resolved), { recursive: true });
  return resolved;
}
