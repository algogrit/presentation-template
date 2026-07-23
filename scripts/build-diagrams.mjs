#!/usr/bin/env node
// Render Mermaid fences from slides.md to hash-addressed SVG files. The hashes
// let the Marp renderer locate each diagram without rewriting the slide source.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const slidesPath = join(ROOT, 'slides.md');
const outputDir = join(ROOT, 'assets', 'generated', 'mermaid');
const content = readFileSync(slidesPath, 'utf8');
const diagrams = [...content.matchAll(/```mermaid\s*\n([\s\S]*?)\n```/g)];

mkdirSync(outputDir, { recursive: true });

let generated = 0;
for (const match of diagrams) {
  const source = match[1].trim();
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 12);
  const input = join(outputDir, `${hash}.mmd`);
  const output = join(outputDir, `${hash}.svg`);

  if (existsSync(output)) continue;

  writeFileSync(input, source, 'utf8');
  execFileSync(
    'npx',
    ['mmdc', '-i', input, '-o', output, '-t', 'dark', '-c', 'mermaid.config.json', '-p', 'puppeteer-config.json', '-b', 'transparent'],
    { cwd: ROOT, stdio: 'inherit' },
  );
  generated += 1;
}

console.log(generated ? `Generated ${generated} Mermaid diagram(s).` : `Diagrams OK (${diagrams.length} Mermaid block(s)).`);
