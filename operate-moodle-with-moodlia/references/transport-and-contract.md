# Transport and contract discovery

## Source of truth order

Use the first available authoritative source:

1. Live MoodlIA MCP tool schemas.
2. Installed package `contract/operations.json`.
3. Project checkout `contract/operations.json`.
4. Generated manifests under `automation/manifests/` for diagnostics and parity checks.
5. CLI help for invocation syntax.

Do not use prose documentation to override a newer schema.

## MCP

- Use the callable tool whose name matches the canonical snake_case operation.
- Validate required and optional properties from its input schema.
- Treat structured content as the operation result. Do not scrape display text when structured output exists.
- If a needed tool is absent, confirm it through tool discovery before falling back to CLI.
- A transport fallback does not create a capability that is absent from the canonical contract.

## CLI

Preferred public invocation:

```text
moodlia <kebab-case-command> [arguments] --format json
```

Project-development fallback from the repository root:

```text
node cli/moodle-mcp.mjs <kebab-case-command> [arguments] --format json
```

The CLI uses `MOODLE_BASE_URL` and `MOODLE_REST_TOKEN`. It calls REST directly and does not require the MCP endpoint.

For object parameters, generate compact valid JSON and quote it for the active shell. Do not interpolate untrusted learner content into a command string. Prefer argument arrays or a short script when content is large or contains quotes.

## Operation mapping

Canonical operations use snake_case:

```text
create_book_chapter
get_course_contents
backup_course
```

CLI commands use kebab-case:

```text
create-book-chapter
get-course-contents
backup-course
```

Parameters follow the schema; CLI flags generally convert snake_case to kebab-case. Confirm with the installed CLI rather than assuming edge cases.

## File metadata

Inspect the operation-level `files` property:

- `none`: the transport does not attach files for that operation.
- `upload`: the operation accepts an upload reference described by its schema.
- download behavior must be confirmed from the operation parameters and return type.

An `upload_reference` is not an arbitrary local path. It must be produced by the supported Moodle upload flow. Never base64-encode or transform files unless the exact operation documentation says to do so.

