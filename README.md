# MoodlIA Skills

Reusable Codex skills for designing content and operating Moodle through MoodlIA.

## Included Skills

- `operate-moodle-with-moodlia`: inspect, create, update, publish, back up, restore, and verify Moodle entities through the canonical MoodlIA operation contract.
- `design-portable-moodle-content`: create accessible HTML and self-contained interactive content that survives normal Moodle backup and restore workflows.

Each skill is independently documented in its own `SKILL.md` file. The skills depend on public MoodlIA interfaces but do not contain the Moodle plugin or CLI implementation.

## Project Status

This repository is the canonical source for MoodlIA agent skills. Project documentation, source comments, variables, and function names are written in English.

## Quality Checks

```bash
npm install
npm run check
```

The tests exercise valid portable packages and reject remote resources, unsafe parent scripts, unsandboxed iframes, dynamic code, and remote runtime requests.
