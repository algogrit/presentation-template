#!/usr/bin/env node
// Compile the Marp theme: themes/base.scss -> themes/base.css
//
// Why a script instead of a plain `sass` invocation:
//   Marpit only inlines its built-in `default` theme when the theme file holds a
//   bare `@import 'default';`. Dart Sass cannot emit that form - it tries to
//   resolve `'default'` as a stylesheet at compile time and errors. The two
//   Sass-passthrough forms (`@import url('default')`, `@import 'default.css'`)
//   compile fine but Marpit does NOT recognise them, so the default theme is
//   never inlined and the deck renders unstyled.
//
//   So we keep `@import 'default';` (plus the @theme banner) OUT of base.scss and
//   prepend it here, after Sass has done its work. base.scss starts straight at
//   the Google Fonts `@import url(...)`, which Sass passes through untouched.
//
// base.css is a generated artifact (gitignored) - edit base.scss, then run
// `npm run css`. Every npm script that needs the CSS (preview/html/pdf/pptx/lint)
// rebuilds it first via a `pre*` hook, and CI does the same, so it never has to
// be committed.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Resolve `sass` (a devDependency) relative to this script, so the build works
// no matter which directory npm runs it from.
const require = createRequire(import.meta.url);
let sass;
try {
  sass = require('sass');
} catch {
  console.error('Could not find the `sass` package. Run `npm install` first.');
  process.exit(1);
}

const themesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'themes');
const src = join(themesDir, 'base.scss');
const out = join(themesDir, 'base.css');

// Injected verbatim ahead of the Sass output. `@import 'default';` MUST stay
// here (see the note above). The `theme: base` front-matter in slides.md refers
// to the @theme banner below.
const header = `/*!
 * @theme base
 * @auto-scaling true
 *
 * GENERATED FILE - do not edit. Source: themes/base.scss
 * Rebuild with \`npm run css\`.
 */

@import 'default';
`;

// charset: false -> never emit a leading `@charset` rule. The output is UTF-8
// and `@import 'default';` is prepended ahead of it, so a `@charset` would land
// mid-stylesheet (invalid).
const { css } = sass.compile(src, { style: 'expanded', charset: false, loadPaths: [themesDir] });
writeFileSync(out, `${header}\n${css}\n`);
console.log(`Built ${out} from base.scss`);
