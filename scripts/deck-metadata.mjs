#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = join(ROOT, 'deck.config.json');
const SLIDES_PATH = join(ROOT, 'slides.md');
const CNAME_PATH = join(ROOT, 'CNAME');
const PACKAGE_PATH = join(ROOT, 'package.json');
const CHECK = process.argv.includes('--check');

const PLACEHOLDERS = [
  /\bbase-org\b/i,
  /\bhost-org\b/i,
  /\{Template\}/,
  /\{title\}/,
  /\bexample\.(?:com|org|net)\b/i,
];

function fail(message) {
  throw new Error(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function validateConfig(config) {
  const requiredStrings = [
    ['title', config.title],
    ['description', config.description],
    ['author', config.author],
    ['slug', config.slug],
    ['repository.organization', config.repository?.organization],
    ['repository.name', config.repository?.name],
    ['hosting.baseDomain', config.hosting?.baseDomain],
  ];

  for (const [name, value] of requiredStrings) {
    if (typeof value !== 'string' || !value.trim()) {
      fail(`deck.config.json: ${name} must be a non-empty string`);
    }
    for (const pattern of PLACEHOLDERS) {
      if (pattern.test(value)) fail(`deck.config.json: ${name} contains unresolved placeholder "${value}"`);
    }
  }

  if (typeof config.isTemplate !== 'boolean') {
    fail('deck.config.json: isTemplate must be true or false');
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.slug)) {
    fail('deck.config.json: slug must be lowercase kebab-case');
  }
  if (!/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(config.hosting.baseDomain)) {
    fail('deck.config.json: hosting.baseDomain must be a hostname without a protocol or path');
  }
  if (!config.isTemplate && config.title === 'Presentation Template') {
    fail('deck.config.json: replace the starter title before setting isTemplate to false');
  }
}

function replaceFrontMatter(slides, key, value) {
  const end = slides.indexOf('\n---', 4);
  if (!slides.startsWith('---\n') || end === -1) fail('slides.md: missing Marp front matter');

  const frontMatter = slides.slice(0, end);
  const pattern = new RegExp(`^${key}:.*$`, 'm');
  if (!pattern.test(frontMatter)) fail(`slides.md: front matter is missing "${key}"`);

  return slides.slice(0, end).replace(pattern, `${key}: ${JSON.stringify(value)}`) + slides.slice(end);
}

function replaceGeneratedBlock(content, name, body) {
  const start = `<!-- deck:${name}:start -->`;
  const end = `<!-- deck:${name}:end -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  if (!pattern.test(content)) fail(`slides.md: missing generated ${name} markers`);
  return content.replace(pattern, `${start}\n\n${body.trim()}\n\n${end}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expectedFiles(config) {
  const repositoryUrl = `https://github.com/${config.repository.organization}/${config.repository.name}`;
  const domain = `${config.slug}.${config.hosting.baseDomain}`;
  const slidesUrl = `https://${domain}`;

  let slides = readFileSync(SLIDES_PATH, 'utf8');
  slides = replaceFrontMatter(slides, 'title', config.title);
  slides = replaceFrontMatter(slides, 'description', config.description);
  slides = replaceFrontMatter(slides, 'author', config.author);
  slides = replaceGeneratedBlock(
    slides,
    'title',
    `###### Eyebrow

# ${config.title}

${config.description}

###### ${config.author}`,
  );
  slides = replaceGeneratedBlock(
    slides,
    'resources',
    `## Resources

Code

${repositoryUrl}

Slides

${slidesUrl}`,
  );

  const packageJson = readJson(PACKAGE_PATH);
  packageJson.name = config.repository.name;
  packageJson.description = config.description;

  return {
    [SLIDES_PATH]: slides,
    [CNAME_PATH]: `${domain}\n`,
    [PACKAGE_PATH]: `${JSON.stringify(packageJson, null, 2)}\n`,
  };
}

function validatePlaceholders(files) {
  const failures = [];
  for (const [path, content] of Object.entries(files)) {
    for (const pattern of PLACEHOLDERS) {
      const match = content.match(pattern);
      if (match) failures.push(`${path.slice(ROOT.length + 1)} contains unresolved placeholder "${match[0]}"`);
    }
  }
  return failures;
}

function validateRemote(config) {
  if (config.isTemplate) return [];

  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const expectedPath = `${config.repository.organization}/${config.repository.name}`;
    return remote.includes(expectedPath)
      ? []
      : [`origin points to "${remote}", expected a remote containing "${expectedPath}"`];
  } catch {
    return ['origin remote is missing'];
  }
}

function main() {
  const config = readJson(CONFIG_PATH);
  validateConfig(config);
  const expected = expectedFiles(config);

  if (!CHECK) {
    for (const [path, content] of Object.entries(expected)) writeFileSync(path, content);
    console.log('Synchronized slides.md, CNAME, and package.json from deck.config.json');
    return;
  }

  const failures = [];
  for (const [path, content] of Object.entries(expected)) {
    let actual;
    try {
      actual = readFileSync(path, 'utf8');
    } catch {
      actual = '';
    }
    if (actual !== content) {
      failures.push(`${path.slice(ROOT.length + 1)} is out of sync; run \`npm run deck:sync\``);
    }
  }
  failures.push(...validatePlaceholders(expected));
  failures.push(...validateRemote(config));

  if (failures.length) {
    console.error('Deck metadata validation failed:');
    failures.forEach((failure) => console.error(`  - ${failure}`));
    process.exit(1);
  }

  console.log('Deck metadata OK');
}

try {
  main();
} catch (error) {
  console.error(`Deck metadata validation failed: ${error.message}`);
  process.exit(1);
}
