# Transport and contract discovery

## Source of truth order

Use the first available authoritative source:

1. Live MoodlIA MCP tool schemas.
2. Installed package `contract/operations.json`.
3. Project checkout `contract/operations.json`.
4. Generated manifests under `automation/manifests/` for diagnostics and parity checks.
5. CLI help for invocation syntax.

Do not use prose documentation to override a newer schema.

## Compatibility baseline

Reviewed against `moodlia` 0.4.1, `moodle-core-cli` 0.4.1, `moodlia-sync` 0.1.1,
and MoodlIA plugin 0.1.215 on 2026-09-30. The clients require Node.js 22.13 or
newer; the plugin's declared Moodle range is 4.5 LTS through 5.3, with 5.3
evidence including beta snapshots. These versions describe the reviewed
implementation, not a requirement to upgrade an unrelated installation.

The operation contract's own `version` is not the plugin release. Obtain the
deployed release from `get_moodlia_status` or MCP server metadata when available.
Local `Unreleased` fixes are not evidence that the target site has those fixes.
Discover live permissions as well as function presence.

## MCP

- Use the callable tool whose name matches the canonical snake_case operation.
- Validate required and optional properties from its input schema.
- Pass object-valued arguments as objects in MCP, not pre-encoded JSON strings; the HTTP adapter handles the REST representation. Reject undeclared tool arguments, especially `wsfunction`, `wstoken`, and `moodlewsrestformat`; authentication and dispatch belong to the transport.
- Treat structured content as the operation result. Do not scrape display text when structured output exists.
- If a needed tool is absent, confirm it through tool discovery before falling back to CLI.
- A transport fallback does not create a capability that is absent from the canonical contract.
- Modern MoodlIA MCP uses the stateless `2026-07-28` request model. Discover it with `server/discover`; each request carries its protocol version, client identity, and capabilities and does not require a session identifier.
- Compatibility clients may fall back to the legacy `initialize` and `notifications/initialized` lifecycle. The Moodle-hosted endpoint remains stateless and does not issue a session id in either era; do not require one for it.
- Let the current client negotiate modern and legacy protocol eras unless a diagnostic task explicitly requires pinning one. Authenticate every request with the Moodle bearer token.

## CLI

Preferred public invocation:

```text
moodlia <kebab-case-command> [arguments] --format json
```

Project-development fallback from the repository root:

```text
node cli/moodlia.mjs <kebab-case-command> [arguments] --format json
```

Direct commands, including `moodlia plugin`, use `MOODLE_BASE_URL` and
`MOODLE_REST_TOKEN`. `moodlia core --profile <name>` resolves the Core credential
from the profile; grouped adaptive workflows use the profile's environment
references. The CLI calls REST directly and does not require the MCP endpoint.
JSON is the only supported output format. Keep structured stdout and stderr
when a non-zero exit reports a capability gap, conflict, or partial outcome.

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

- `none`: no dedicated file-transfer behavior is advertised by that label; inspect documented nested options before deciding whether a draft is supported.
- `upload`: inspect the exact upload reference or draft parameter, including separate inline and attachment drafts.
- `download` and `metadata`: inspect the returned file record and the operation's download behavior; metadata alone does not transfer bytes.

An `upload_reference` is not an arbitrary local path. It is the legacy Base64
input retained for backward compatibility. Current folder-file, course-backup,
and resource-module operations also accept a user-owned Moodle `draft_item_id`.
Book, Page, Label, URL, section, assignment, Lesson, and wiki editor operations
use their supported draft paths. Forum and glossary operations distinguish
`inline_draft_item_id` from `attachment_draft_item_id`.

For those supported operations, prefer the public CLI's `--upload-file <path>`
option. It streams multipart data through Moodle core `/webservice/upload.php`,
then sends only the returned draft item id to the operation. This avoids Base64
size expansion and duplicate in-memory copies. The option is mutually exclusive
with `--upload-reference` and `--draft-item-id`. MoodlIA does not impose a
client-side file-size cap; do not reject a file based on a locally invented
threshold. Moodle's effective upload allowance is authoritative, while PHP or
the fronting web server may still reject a request before Moodle receives it.
A user may set `--max-upload-bytes` or `MOODLE_MAX_UPLOAD_BYTES`. MoodlIA REST
responses default to 64 MiB (`--max-response-bytes` / `MOODLE_MAX_RESPONSE_BYTES`);
streamed downloads default to 2 GiB (`--max-download-bytes` /
`MOODLE_MAX_DOWNLOAD_BYTES`). Explicit Core uploads have a 2 GiB default, so do
not carry MoodlIA's unlimited-upload assumption into a Core-only command.
A `payload_too_large` error names the limit and the option that raises it;
report the evidence and change a limit only when justified by the task.

To pass long HTML or text, prefer a UTF-8 file over an inline argument:
supported top-level text fields accept `--<field>-file`, for example `--content-file`,
`--summary-file`, `--intro-file`, `--message-file`, `--description-file`,
`--definition-file`, or `--question-text-file`. The CLI only reads files from
the working directory or files named on the command line for supported transfer
paths. Text-file input strips a UTF-8 BOM and is mutually exclusive with the
inline field. It does not turn nested JSON properties into CLI file flags.

`create-module --upload-file` is a File resource shortcut only. It does not
upload Page content or arbitrary activity-intro files. For an intro draft on a
plugin that supports it, use `options.intro_draft_item_id` and
`options.intro_format` through the documented client/operation path. For
drag-and-drop questions, `--background-image-file` is supported only by
`create-question` and `update-question` for their declared image question types;
it is not a generic question-editor upload flag.

## Authenticated downloads

Use the returned URL rather than constructing `pluginfile.php` paths or adding
an item id. The 0.4 client accepts browser file URLs from `backup_course` and
normalizes them to the authenticated webservice endpoint. Prefer
`downloadFileToPath(url, destinationPath)` for streamed binary downloads and
verify the recorded size before claiming the local backup is ready.

The plugin checkout contains an unreleased fix for course-backup URLs that
formerly included an extra `/0/`. A 404 on that older deployed URL is not proof
that the backup was never created: inspect its file record and deployed release.
Do not create another backup blindly or claim the local fix is already released.
