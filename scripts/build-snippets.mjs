#!/usr/bin/env node
// Synchronize fenced slide snippets with named source regions. Use:
// <!-- snippet: examples/file.js#region-name -->
// ```js
// generated content
// ```

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const slidesPath = join(ROOT, 'slides.md');
const check = process.argv.includes('--check');
const marker = /(<!-- snippet: (\S+?)#(\S+?) -->)\s*```([a-zA-Z]*)\n[\s\S]*?\n```/g;

function dedent(lines) {
  const indents = lines.filter((line) => line.trim()).map((line) => line.match(/^\s*/)[0].length);
  const amount = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(amount)).join('\n');
}

function regionOf(file, region) {
  const lines = readFileSync(join(ROOT, file), 'utf8').split('\n');
  const start = lines.findIndex((line) => line.trim() === `// #region ${region}`);
  if (start === -1) throw new Error(`${file}: region "${region}" not found`);
  const end = lines.findIndex((line, index) => index > start && /^\s*\/\/ #endregion\b/.test(line));
  if (end === -1) throw new Error(`${file}: region "${region}" has no closing marker`);
  return dedent(lines.slice(start + 1, end)).replace(/^\n+|\n+$/g, '');
}

const before = readFileSync(slidesPath, 'utf8');
const after = before.replace(marker, (_match, comment, file, region, language) =>
  `${comment}\n\n\`\`\`${language}\n${regionOf(file, region)}\n\`\`\``,
);

if (check && after !== before) {
  throw new Error('slides.md snippets are stale; run `npm run snippets`');
}
if (!check && after !== before) writeFileSync(slidesPath, after);
console.log(check ? 'Snippets OK' : 'Synchronized slide snippets');
