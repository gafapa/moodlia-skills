---
name: design-portable-moodle-content
description: Design accessible, visually polished, portable HTML content and self-contained interactive demonstrations for Moodle. Use when creating or adapting content for Books, Pages, Text and media areas, section or activity descriptions, Lesson pages, question text, forums, wikis, glossaries, or other Moodle fields that accept HTML; when the result must survive course backup and restore without MoodlIA, H5P, SCORM, custom filters, custom themes, CDNs, or runtime plugins; or when deciding how to degrade an interactive design for a sanitized Moodle surface.
---

# Design Portable Moodle Content

Create Moodle content as a portable browser artifact. Treat MoodlIA as an authoring tool, never as a runtime dependency.

## Non-negotiable contract

- Produce only standard HTML, CSS, SVG, media, and browser JavaScript.
- Never require MoodlIA, a Moodle plugin, a custom filter, H5P, SCORM, a theme, or a CDN after publication.
- Never place JavaScript or event-handler attributes in the parent Moodle HTML.
- Run advanced JavaScript only in a self-contained iframe with `sandbox="allow-scripts"`; do not add `allow-same-origin`.
- Reference editor-managed files with `@@PLUGINFILE@@` only when the destination owns a backed-up file area.
- Include a meaningful static fallback and text explanation for every interactive demonstration.
- Make the educational message complete even if the iframe is removed, printing is used, or JavaScript fails.
- Do not promise grades, cross-device persistence, attempts, or Moodle completion from portable HTML alone.

## Workflow

1. Define the learning objective, audience, language, target Moodle surface, expected interaction, and whether the content must be embedded or may open separately.
2. Read [references/moodle-html-compatibility.md](references/moodle-html-compatibility.md) and classify the target surface before choosing a renderer.
3. Choose the smallest suitable component from [references/interactive-components.md](references/interactive-components.md).
4. Use one of these output profiles:
   - `universal-html`: semantic HTML, inline presentation styles where needed, native elements such as `details`, and no JavaScript.
   - `portable-iframe`: universal fallback plus a local, self-contained mini-application in a sandboxed iframe.
   - `static-fallback`: explanatory text, image or SVG, and optional direct file link when iframe execution is unavailable.
5. For a mini-application, follow [references/portable-package.md](references/portable-package.md). Copy and adapt `assets/interactive-demo/` instead of rebuilding the shell.
6. Validate the artifact with `node scripts/validate-portable-content.mjs <artifact-directory>`.
7. Preview at narrow and wide widths, with keyboard-only input, reduced motion, JavaScript disabled, and the iframe removed.
8. When publication or course manipulation is requested, also use `$operate-moodle-with-moodlia`. Keep content generation and Moodle mutation as separate phases.

## Design requirements

- Use a clear visual hierarchy, restrained color, readable line length, and generous spacing.
- Scope parent styles inline or under a unique wrapper. Do not assume Bootstrap, Moodle theme classes, or global CSS variables.
- Prefer native controls and semantic HTML. Label every input and expose changing values as text, not color alone.
- Support keyboard operation and visible focus. Avoid drag-only interactions; provide buttons or another equivalent input.
- Respect `prefers-reduced-motion` and avoid automatic animation.
- Keep iframe height practical and responsive. Provide a direct link to the local HTML file as a fallback.
- Keep all code, variable names, comments, source metadata, and generated project documentation in English unless the learner-facing language is explicitly different.

## Acceptance checks

- The parent fragment contains no `script`, `on*` handler, `eval`, custom Moodle shortcode, or MoodlIA URL.
- Every active resource is local to the exported course.
- Every iframe has a descriptive title, a sandbox, a fallback explanation, and a direct link.
- The mini-application cannot access the parent page, Moodle cookies, Moodle APIs, or remote network services.
- The package remains useful in a cleaned HTML field through its universal or static layer.
- A restored course does not require any code that was present only on the authoring Moodle.
