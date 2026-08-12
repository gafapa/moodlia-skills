# Portable interactive package

## Recommended structure

```text
artifact/
├── content.html
└── interactive/
    └── demonstration-slug/
        ├── index.html
        ├── app.js
        ├── styles.css
        ├── fallback.svg
        └── source.json
```

`content.html` is the fragment stored in Moodle. The `interactive` directory is uploaded into the same backed-up editor file area.

## Parent fragment

Include all of the following:

- a heading and concise instruction;
- the sandboxed iframe;
- a meaningful text explanation outside the iframe;
- a static fallback or poster;
- a direct `@@PLUGINFILE@@` link to the local `index.html`.

Never include scripts, event attributes, or runtime-specific custom markup in the parent fragment.

## Mini-application

- Use plain browser APIs and local files.
- Set a restrictive Content Security Policy.
- Do not use `eval`, `new Function`, dynamic script insertion, remote fetches, workers from remote URLs, popups, forms, or top navigation.
- Do not require `allow-same-origin`, `allow-forms`, `allow-popups`, or `allow-top-navigation` in the iframe sandbox.
- Keep state in memory for the current view. Do not claim durable persistence.
- Avoid parent communication. If resizing is necessary, use a fixed responsive minimum height rather than weakening isolation.
- Include a `noscript` fallback inside `index.html`.

## `source.json`

Store editable authoring metadata without making it a runtime dependency. Recommended fields:

```json
{
  "schemaVersion": 1,
  "type": "parameter-lab",
  "title": "Demonstration title",
  "learningObjective": "Observable learner outcome",
  "language": "en",
  "parameters": {},
  "accessibility": {
    "summary": "Text alternative"
  }
}
```

The target Moodle may ignore this file; the demonstration must still work.

## Packaging and restore checks

1. Upload every file to the destination field's own file area.
2. Store only `@@PLUGINFILE@@` references in Moodle HTML.
3. Create a native Moodle course backup.
4. Restore it on a clean Moodle without MoodlIA.
5. Confirm that local resources return successfully and no authoring-site URL remains.
6. Test the static fallback with iframe support disabled.
