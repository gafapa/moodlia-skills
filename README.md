# MoodlIA Skills

Reusable Codex skills for designing content and operating Moodle through MoodlIA.

## Included Skills

- `operate-moodle-with-moodlia`: inspect, create, update, publish, synchronize, back up, restore, and verify Moodle entities through the canonical MoodlIA operation contract and the separate `moodlia-sync` lifecycle.
- `design-portable-moodle-content`: create accessible HTML and self-contained interactive content that survives normal Moodle backup and restore workflows.

Each skill is independently documented in its own `SKILL.md` file. The skills depend on public MoodlIA interfaces but do not contain the Moodle plugin or CLI implementation.

## Project Status

This repository is the canonical source for MoodlIA agent skills. Project documentation, source comments, variables, and function names are written in English.

## Current Compatibility

Reviewed on 2026-09-30 against MoodlIA plugin `0.1.215`, `moodlia` and
`moodle-core-cli` `0.4.1`, and `moodlia-sync` `0.1.1`. Live schemas and deployed
capabilities take precedence over this baseline. Unreleased plugin fixes are
identified as unreleased; a local checkout is not proof of a server update.

The operating skill documents the standalone synchronization CLI, one-use
digest approval and recovery, environment-referenced profiles, named text
formats, inline versus attachment drafts, multi-file editor publication,
streamed downloads and transfer limits. Core structural reads do not imply
content-authoring support, and logical version-matrix tests do not substitute
for live qualification.

The reviewed plugin/MCP and MoodlIA CLI contracts declare 250 operations; the
Core CLI contract contains 788 friendly operations across supported versions.
The skill routes all operation families through their authoritative schemas,
including administration, roles, evaluation, participant interactions and
adaptive single-site workflows. It does not duplicate every command or assert
that every operation is available to a live token. Cross-site synchronization
is a separate, narrower capability set.

The portable-content skill keeps authoring separate from publication. Its
validator must run against a package with a `content.html` parent fragment;
static checks do not prove browser behavior, site sanitization or restoration.

Deploy each complete skill directory, including its references, metadata,
scripts and assets, to the agent's skill directory. Refresh both active skills
from this repository and keep historical backups outside the discovery path so
obsolete instructions are not selected as current skills.

## Quality Checks

```bash
npm install
npm run check
```

The tests exercise valid portable packages and reject remote resources, unsafe parent scripts, unsandboxed iframes, dynamic code, and remote runtime requests.

## License

Copyright (C) 2026 Pablo Gallego.

This project is free software released under the GNU General Public License version 3 or later. See `LICENSE`.
