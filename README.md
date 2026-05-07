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

Generated files are written to `dist/`.

## Customize A New Deck

After copying this repository:

- Update the title, author, and description in `slides.md`.
- Replace images in `assets/images/`.
- Edit theme tokens at the top of `themes/base.css`.
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

Markdown conventions:

- Use `###### Eyebrow` for the small uppercase label on title and section slides.
- Use a normal paragraph after the main heading for lead copy.
- Use `> Blockquote` for callouts.
- Use `<!-- _class: quote -->` plus `> Quote text` for large quote slides.
- Use a three-column Markdown table on `cards` slides.
- Use Marp background image syntax like `![bg right:45% fit](assets/images/example.jpg)` for visual split slides.

HTML is still available if a specific deck needs a custom one-off layout, but the starter deck avoids it.
