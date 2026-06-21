# Marp Presentation Template

A reusable [Marp](https://marp.app) template for technical talks, workshops, and training decks. It is intentionally Markdown-first: headings, lists, tables, blockquotes, fenced code blocks, and Marp directives should cover normal slide authoring.

## Setup

```sh
npm install
```

## Preview

```sh
npm run preview
```

Open the local URL printed by Marp.

## Export

```sh
npm run html
npm run pdf
npm run pptx
```

Generated files are written to `dist/`. Each export (and `preview`) rebuilds the
theme first via a `pre*` hook, so a stale stylesheet can never ship.

## Lint

```sh
npm run lint          # fail if any slide overflows the 1280x720 box
npm run lint -- --dense   # also flag crammed-but-fitting slides (advisory)
```

Marp silently lets content spill past the bottom of a slide. `lint` renders every
slide headlessly (reusing the Chromium marp-cli bundles) and reports any overflow.

## Theme

The theme is authored in **Sass**: edit `themes/base.scss`, not `themes/base.css`.
`base.css` is a generated artifact and is **gitignored** - every npm script that
needs it (`preview`, `html`, `pdf`, `pptx`, `lint`) rebuilds it first via a `pre*`
hook, and CI does the same. Build it manually only when you use the theme directly
without an npm script - e.g. the VS Code Marp preview on a fresh clone:

```sh
npm run css
```

> Why a build script instead of plain `sass`? Marpit only inlines its built-in
> `default` theme when the file holds a bare `@import 'default';`, which Dart Sass
> refuses to emit. `scripts/build-theme.mjs` compiles the Sass and prepends that
> import (plus the `@theme` banner) afterward. See the comments in that file.

Theme tokens (colors, fonts) live at the top of `base.scss` as CSS custom
properties and Sass variables.

## Customize A New Deck

After copying this repository:

- Update the title, author, and description in `slides.md`.
- Replace images in `assets/images/`.
- Edit theme tokens at the top of `themes/base.scss`, then run `npm run css`.
- Keep useful layout examples and delete the rest.

## Slide Patterns

Use Marp directives in HTML comments:

```md
---
<!-- _class: section -->

# A new section
```

Available slide classes:

- `title` - cover slide
- `section` - section divider
- `split` - two-column content
- `image` - image-led slide
- `quote` - pull quote
- `cards` - three-card summary
- `code` - code-focused slide
- `exercise` - workshop prompt
- `takeaway` - closing summary
- `cols-photo` - image beside vertically-centred text (`.cols` > `.col-media` + `.col-body`; add `media-right` to swap sides, `center-body` to centre the caption)
- `center` / `middle` - centre text horizontally / vertically (combine for both)
- `intro-photo` - a centred photo sized to sit under a heading
- `content-time` - the "Content > Time" icon row

Markdown conventions:

- Use `###### Eyebrow` for the small uppercase label on title and section slides.
- Use a normal paragraph after the main heading for lead copy.
- Use `> Blockquote` for callouts.
- Use `<!-- _class: quote -->` plus `> Quote text` for large quote slides.
- Use a three-column Markdown table on `cards` slides.
- Use Marp background image syntax like `![bg right:38% w:88%](assets/images/example.jpg)` for visual split slides.

HTML is still available if a specific deck needs a custom one-off layout, but the starter deck avoids it.

## Motion (live HTML deck only)

The HTML deck (`npm run preview` / `npm run html`) animates; PDF/PPTX exports
render the final settled frame, so they are unaffected.

- **Slide transitions** come from the `transition:` front-matter directive
  (`transition: fade 0.4s`). Override per slide with `<!-- _transition: coverflow -->`
  (also `zoom`, `slide`, etc. - see the Marp transition list).
- **Entrance animations** are built in: headings drop in, body content rises in
  just behind them, and divider slides (`title`/`section`/`exercise`/`takeaway`)
  pop. No markup needed.
- **Disable motion**: viewers can turn on the OS "Reduce motion" setting (kills
  both entrances and transitions). In-deck, add `<!-- _class: no-anim -->` to one
  slide or `class: no-anim` to the front-matter to stop entrances; comment the
  `transition:` directive to stop transitions.

Preview needs a browser with the View Transitions API (e.g. Chrome).

## Progressive reveal

Marp reveals list items one click at a time when the bullet marker is `*`
(unordered) or `1)` (ordered); plain `-` and `1.` show everything at once. Use the
fragmented form only on build-up slides (sequential steps, takeaways) - not on
tables, code, or reference lists.

## Code highlighting themes

Code blocks use a swappable highlight.js palette. The default is tuned to the
template accent; switch per slide (or deck-wide via `class:`) with one of:

```md
<!-- _class: code-onedark -->   <!-- also: code-tomorrow, code-github, code-monokai -->
```
