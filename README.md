# MoodlIA Skills

A focused agent skill for creating accessible, portable Moodle learning content.

## Included skill

`design-portable-moodle-content` helps an agent choose between semantic HTML,
local interactive demonstrations and static alternatives for sanitized Moodle
fields. It includes compatibility guidance, authoring examples, an editable
demonstration and a static package validator.

The operational skill has been retired. Use the Moodle tools directly with
their live schemas and normal authorization and verification requirements.
The content skill has no dependency on an operational skill, the MoodlIA
plugin, or a Moodle connection for local authoring. Publication requires a
supported HTML field and, for assets, its backed-up editor file area.

## Installation

Copy the complete `design-portable-moodle-content` directory, including its
references, scripts, metadata and assets, to your agent's skill directory
(for example `~/.codex/skills/` or `~/.claude/skills/`). Remove any previously
installed operational skill from discovery. Keep historical copies outside
skill discovery directories.

## Quality and evidence

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

## License

Copyright (C) 2026 Pablo Gallego.

GNU General Public License version 3 or later. See `LICENSE`.
