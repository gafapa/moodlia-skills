# MoodlIA Skills

Agent skills for creating accessible, portable Moodle learning content and for operating Moodle safely through MoodlIA.

[Status](#status) · [Getting started](#getting-started) · [Usage](#usage) · [Development](#development) · [Security and privacy](#security-and-privacy) · [Documentation](#documentation) · [License](#license)

## Status

Two maintained skills: `design-portable-moodle-content` for authoring and `operate-moodle-with-moodlia` for site operations through the MoodlIA plugin 0.1.224 and CLI 0.5.3. Local authoring does not require a Moodle connection or the MoodlIA plugin.

## Getting started

### Installation

Copy each complete skill directory you need (`design-portable-moodle-content`,
`operate-moodle-with-moodlia`), including its references, scripts, metadata and
assets, to your agent's skill directory (for example `~/.codex/skills/` or
`~/.claude/skills/`). Replace any older operational skill. Keep historical
copies outside skill discovery directories.

## Usage

### Included skills

`design-portable-moodle-content` helps an agent choose between semantic HTML,
local interactive demonstrations and static alternatives for sanitized Moodle
fields. It includes compatibility guidance, authoring examples, an editable
demonstration and a static package validator.

`operate-moodle-with-moodlia` teaches an agent to use the MoodlIA MCP tools or
the `moodlia` CLI safely: identify the site and plugin release, take parameters
from the live schema, read before writing, confirm destructive changes, verify
every change, and read permission and transport failures. Its references cover
connection and exit codes, multi-step procedures (course audit, single activity
or section backup and import, course restore, user management, quiz
introductions, editor files, completion) and recorded pitfalls. It does not copy
operation schemas.

The content skill has no dependency on the operational skill, the MoodlIA
plugin, or a Moodle connection for local authoring. Publication requires a
supported HTML field and, for assets, its backed-up editor file area.

## Development

### Quality and evidence

```bash
npm install
npm run check
node design-portable-moodle-content/scripts/validate-portable-content.mjs design-portable-moodle-content/assets/interactive-demo --json
```

The validator requires a nonempty root `content.html`, checks literal local
resources and restricted iframe permissions, and rejects common unsafe or
nonportable patterns. Tests exercise accepted static and interactive packages
and meaningful rejection cases. Static validation does not prove browser
behavior, accessibility compliance, Moodle sanitization or backup/restore
portability. Report those evidence levels separately.

The universal HTML layer is the conservative baseline. Interactive HTML needs
site-specific iframe and file-serving checks. Claim verified restoration only
after checking a native backup restored on an authorized isolated Moodle.

Project documentation, source comments, variables, and function names are in English.

## Security and privacy

Local authoring and static validation need no Moodle credentials. Publication uses the selected Moodle tools and their permissions. Content portability, sanitization and interactive behavior require destination-site verification.

## Documentation

- [Project Pages](https://gafapa.github.io/moodlia-skills/)

Build the repository documentation portal with `python tools/build-project-page.py`. Its status comes from this README; purpose and first steps are maintained in `docs/project-page.json`. The `pages.yml` workflow publishes the portal without deploying the application or changing `moodlia.com`.

Portable content authoring and safe operation of Moodle; operations use the current [plugin](https://github.com/gafapa/moodle-local_moodlia) or [CLI](https://github.com/gafapa/moodlia-cli) schemas.

- [Source code](https://github.com/gafapa/moodlia-skills)
- [Issue tracker](https://github.com/gafapa/moodlia-skills/issues)
- [MoodlIA website](https://moodlia.com)

## License

Copyright (C) 2026 Pablo Gallego.

GNU General Public License version 3 or later. See `LICENSE`.
