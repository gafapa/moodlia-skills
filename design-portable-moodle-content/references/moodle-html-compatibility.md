# Moodle HTML compatibility

## Capability profiles

Classify the target field instead of treating all Moodle HTML as equivalent.

### Profile A: cleaned HTML

Use semantic HTML only. Expect scripts, event handlers, iframes, unsafe CSS, object/embed elements, and unsupported attributes to be removed.

Typical examples include collaborative or learner-authored forum, wiki, glossary, database, blog, and submission content. Site policy and user capabilities can change the exact result.

Suitable output:

- headings, paragraphs, lists, tables, links, images, audio, and video;
- `details` and `summary` when preserved by the target version;
- static SVG as an image;
- inline presentation styles only when validated on the target.

### Profile B: teacher-authored HTML with files

Use universal HTML and files managed by the field's editor file area. Confirm that backup and restore include that component and file area.

Typical candidates include Book chapters, Page content, Text and media resources, activity introductions, and section summaries. Do not infer file support merely because an editor is visible.

Suitable output adds:

- `@@PLUGINFILE@@` images and media;
- downloadable source material;
- a local static fallback for an interactive artifact.

### Profile C: iframe-capable teacher content with files

Use a portable iframe only after confirming that the target site preserves the iframe and serves the HTML file inline.

Suitable output adds:

- a self-contained HTML mini-application;
- `sandbox="allow-scripts"` without `allow-same-origin`;
- a direct link and a static fallback outside the iframe.

This profile is an enhancement, not the baseline. `forceclean`, HTML purification, Content Security Policy, file-serving policy, editor normalization, and administrator configuration can disable it.

### Profile D: string or plain text

Do not add decorative HTML to names, titles, navigation labels, identifiers, or fields formatted as strings. Produce concise plain text.

## Surface guidance

| Surface | Conservative baseline | Possible enhancement |
| --- | --- | --- |
| Book chapter | Profile B | Profile C after site validation |
| Page | Profile B | Profile C after site validation |
| Text and media area | Profile B | Profile C after site validation |
| Section summary | Profile B | Profile C after site validation |
| Activity description | Profile A or B | Profile C only after validation |
| Lesson or question text | Profile A or B | Avoid iframe unless explicitly verified |
| Forum, wiki, glossary, database entry | Profile A | Do not rely on iframe |
| Learner submission | Profile A | Do not rely on iframe |
| Activity or chapter title | Profile D | None |

## File rules

- Use `@@PLUGINFILE@@/path/file.ext` in stored editor HTML only when Moodle rewrites that field and backs up the related file area.
- Keep paths relative inside a mini-application.
- Do not use absolute `pluginfile.php` URLs; context and item identifiers change after restore.
- Do not use `data:` URLs for large assets. They increase database content size and complicate editing.
- Do not link executable resources to the authoring Moodle, MoodlIA, localhost, a temporary server, or a CDN.

## Degradation rule

When capability is uncertain, emit Profile A or B content and package the advanced artifact separately. Never make the learning objective depend solely on a feature that the target may sanitize.
