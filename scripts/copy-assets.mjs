#!/usr/bin/env node
// Copy static assets into the build output: assets/ -> dist/assets/
//
// Why a script:
//   `marp ... -o dist/index.html` emits HTML with *relative* image paths
//   (`assets/...`) but never copies the asset files themselves. The local
//   `preview` server hides this because `marp --server .` serves from the project
//   root, but the deployed site publishes only `dist/`, so every image (the
//   footer logo included) 404s. This step lands the assets next to index.html so
//   the relative paths resolve in `dist/` and on GitHub Pages alike.
//
//   Wired as the `posthtml` npm hook, so it runs automatically after every
//   `npm run html` - locally and in CI - with no workflow change required.

import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'assets');
const dist = join(root, 'dist');
const dest = join(dist, 'assets');

if (!existsSync(src)) {
  console.log('No assets/ directory - nothing to copy.');
  process.exit(0);
}

mkdirSync(dist, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied assets/ -> ${dest}`);
