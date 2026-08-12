---
name: operate-moodle-with-moodlia
description: Operate, publish, inspect, back up, restore, and verify Moodle courses through the MoodlIA MCP tools or Node CLI while respecting the shared canonical operation contract. Use when listing or resolving Moodle entities; creating or updating courses, sections, modules, Books, chapters, questions, activities, files, or enrolments; publishing portable HTML produced by another skill; choosing between MCP and CLI; diagnosing transport or schema errors; exporting a native Moodle backup; or verifying Moodle-visible results without inventing unsupported operations.
---

# Operate Moodle With MoodlIA

Use the current MoodlIA contract as the source of truth. Treat MCP and CLI as adapters over the same Moodle operations, not as separate product models.

## Transport decision

1. Read [references/transport-and-contract.md](references/transport-and-contract.md).
2. Prefer callable MoodlIA MCP tools when they are available and satisfy the operation.
3. Use the public `moodlia` CLI when MCP is unavailable, the user requests terminal automation, or a reproducible shell workflow is required.
4. Use the repository CLI only during project development when the public binary is unavailable.
5. Do not switch transports halfway through a mutation unless verifying parity or recovering from a clearly reported transport failure.
6. Never invent an operation, parameter, file upload, or return field. Discover it from the live MCP schema or canonical contract.

## Operating workflow

1. Establish the target site and whether it is production-like, staging, or disposable.
2. Discover the current operation schema and confirm required capabilities.
3. Resolve human names to stable course, section, module, chapter, user, group, or file identifiers with read operations.
4. Read the current target state before any update, move, duplicate, publish, backup, restore, or delete.
5. Validate the complete input locally against the discovered schema.
6. Perform the smallest authorized mutation.
7. Inspect the structured result and retain returned identifiers.
8. Re-read Moodle state through a separate read operation.
9. Use browser-visible verification only when the user needs visual confirmation or API state is insufficient.
10. Report the transport, operation, target identifiers, resulting state, and any unverified assumptions.

For content and course workflows, read [references/publishing-workflows.md](references/publishing-workflows.md). For mutation and credential constraints, read [references/safety-and-verification.md](references/safety-and-verification.md).

## Portable content boundary

When publishing output from `$design-portable-moodle-content`:

- Keep authoring and publication as separate phases.
- Validate the artifact before mutation.
- Confirm that the destination operation supports both its HTML field and its file area.
- Inspect the contract's `files` metadata. If an operation says `files: none`, do not assume that `@@PLUGINFILE@@` assets can be attached through it.
- If the current contract lacks an editor-file upload operation, publish only the universal HTML layer or report the missing capability. Do not silently substitute an external dependency.
- Create a native `.mbz` backup and, when an isolated validation target is available, restore it without relying on MoodlIA at runtime.

## CLI conventions

- Use operation names in kebab-case, for example `get-course-contents` for `get_course_contents`.
- Request JSON output and parse it structurally.
- Pass object parameters as valid JSON, with shell-appropriate quoting.
- Keep `MOODLE_BASE_URL` and `MOODLE_REST_TOKEN` in environment configuration. Never print tokens or place them in command arguments, source files, generated HTML, logs, or final responses.
- Discover usage with `moodlia --help` and the installed contract instead of relying on a memorized command list.

## Completion criteria

- The requested state exists in Moodle and has been re-read.
- No unrelated course or activity was changed.
- Content does not contain temporary authoring URLs, local paths, secrets, or unsupported MoodlIA placeholders.
- Backup requests return a native Moodle backup file record or a clearly reported platform error.
- Destructive operations include explicit user authority and verified identifiers.
- Claims about visible layout are backed by browser inspection when layout matters.

