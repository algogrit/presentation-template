#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = join(ROOT, 'deck.config.json');

const { values } = parseArgs({
  options: {
    title: { type: 'string', short: 't' },
    description: { type: 'string', short: 'd' },
    author: { type: 'string' },
    slug: { type: 'string' },
    'repo-org': { type: 'string' },
    'repo-name': { type: 'string' },
    'base-domain': { type: 'string' },
    visibility: { type: 'string', default: 'public' },
    'commit-message': { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'no-push': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
});

function usage() {
  console.log(`Create a presentation repository from this template.

Usage:
  npm run create-deck -- --title "Talk Title" [options]
  make create TITLE="Talk Title" [ARGS='--description "..."']

Options:
  -t, --title <title>          Presentation title (required)
  -d, --description <text>    Deck description
      --author <name>         Author name
      --slug <slug>           URL slug; derived from the title by default
      --repo-org <org>        GitHub organization
      --repo-name <name>      Repository name; defaults to presentation-<slug>
      --base-domain <domain>  Hosting base domain
      --visibility <value>    public or private (default: public)
      --commit-message <text> Initial commit message
      --no-push               Configure and commit locally without pushing
      --dry-run               Print the plan without changing local or remote state
  -h, --help                  Show this help
`);
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  })?.trim();
}

function capture(command, args) {
  return run(command, args, { capture: true });
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function remoteUrl(organization, repository, protocol) {
  return protocol === 'https'
    ? `https://github.com/${organization}/${repository}.git`
    : `git@github.com:${organization}/${repository}.git`;
}

function commandExists(command) {
  try {
    capture(command, ['--version']);
    return true;
  } catch {
    return false;
  }
}

function remote(name) {
  try {
    return capture('git', ['remote', 'get-url', name]);
  } catch {
    return null;
  }
}

function main() {
  if (values.help) {
    usage();
    return;
  }
  if (!values.title?.trim()) {
    usage();
    throw new Error('--title is required');
  }
  if (values.title.trim() === 'Presentation Template') {
    throw new Error('replace the placeholder title before creating a deck');
  }
  if (!['public', 'private'].includes(values.visibility)) {
    throw new Error('--visibility must be "public" or "private"');
  }

  const current = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  const slug = values.slug || slugify(values.title);
  if (!slug) throw new Error('could not derive a slug; pass --slug explicitly');

  const config = {
    ...current,
    isTemplate: false,
    title: values.title.trim(),
    description:
      values.description?.trim() ||
      `Presentation for ${values.title.trim()}.`,
    author: values.author?.trim() || current.author,
    slug,
    repository: {
      organization: values['repo-org']?.trim() || current.repository.organization,
      name: values['repo-name']?.trim() || `presentation-${slug}`,
    },
    hosting: {
      baseDomain: values['base-domain']?.trim() || current.hosting.baseDomain,
    },
  };

  const repository = `${config.repository.organization}/${config.repository.name}`;
  const homepage = `https://${config.slug}.${config.hosting.baseDomain}`;
  const commitMessage = values['commit-message'] || `New: ${config.title}`;
  const oldOrigin = remote('origin');
  const protocol = oldOrigin?.startsWith('http') ? 'https' : 'ssh';
  const newOrigin = remoteUrl(
    config.repository.organization,
    config.repository.name,
    protocol,
  );

  console.log(`Deck:       ${config.title}`);
  console.log(`Repository: ${repository} (${values.visibility})`);
  console.log(`Slides:     ${homepage}`);
  console.log(`Push:       ${values['no-push'] ? 'no' : 'yes'}`);

  if (values['dry-run']) {
    console.log('\nDry run: no files, remotes, repositories, commits, or branches were changed.');
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  if (!commandExists('git')) throw new Error('git is required');
  if (!commandExists('gh')) throw new Error('GitHub CLI (`gh`) is required');
  run('git', ['rev-parse', '--is-inside-work-tree'], { capture: true });
  run('gh', ['auth', 'status']);

  if (!oldOrigin) throw new Error('origin remote is missing; cannot preserve the template source');
  const templateRemote = remote('template');
  if (templateRemote && templateRemote !== oldOrigin) {
    throw new Error(`template remote already points to "${templateRemote}", not "${oldOrigin}"`);
  }

  // Create the external repository before changing local metadata or remotes.
  run('gh', [
    'repo',
    'create',
    repository,
    `--${values.visibility}`,
    '--description',
    config.description,
    '--homepage',
    homepage,
  ]);

  writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
  run('npm', ['run', 'deck:sync']);

  if (!templateRemote) run('git', ['remote', 'add', 'template', oldOrigin]);
  run('git', ['remote', 'set-url', 'origin', newOrigin]);

  run('git', ['add', '.']);
  run('git', ['commit', '-m', commitMessage]);
  if (!values['no-push']) run('git', ['push', '-u', 'origin', 'HEAD']);

  console.log(`\nCreated ${repository}`);
  console.log(`Template remote: ${oldOrigin}`);
  console.log(`Origin remote:   ${newOrigin}`);
}

try {
  main();
} catch (error) {
  console.error(`create-deck failed: ${error.message}`);
  process.exit(1);
}
