# Connection, configuration and errors

## MCP endpoint

- URL: `https://<moodle>/local/moodlia/mcp.php`, not `/webservice/rest/server.php`.
- Header: `Authorization: Bearer <token>`. Never put the token in the URL.
- The token is a normal Moodle web service token for the MoodlIA service. REST, MCP and CLI share it.
- The user needs: web services and REST enabled, membership of the MoodlIA service's authorised users, `webservice/rest:use` and `local/moodlia:useapi` at system level, and each operation's own capability in the target context. Role capabilities alone are not enough without the service authorisation.
- Requests are `POST` with `Content-Type: application/json`. Clients that send a browser `Origin` header must match the site.
- Supported protocol versions: stateless `2026-07-28` (`server/discover`) and legacy `2025-03-26`, `2025-06-18` and `2025-11-25` (`initialize`). No session id is issued.
- `tools/listChanged` is false. After a plugin upgrade, reconnect the client to load new tools.
- Results carry text content and `structuredContent`. Failures are JSON-RPC errors, not `isError: true`; read the canonical code from `error.data.code` and Moodle's original code from `error.data.details.moodle_errorcode`.
- Each tool call is forwarded to the REST endpoint with a 60 second timeout. For long backups or restores that may exceed it, prefer the CLI.
- Claude Code and Codex can use a static bearer token directly. Hosted connectors that require OAuth cannot use a static token without an OAuth gateway.
- Plugin releases before 0.1.221 published empty schemas as `[]`; strict clients reject them (`[] is not of type "object"`). Install 0.1.221 or later and reconnect.

Safe first calls: `get_current_user`, `get_moodlia_status`, `get_courses` with a
small limit, then one read of the course you will work on.

## CLI

- Install `moodlia` from npm (Node.js 22.13 or later).
- Configure `MOODLE_BASE_URL` (HTTPS; may include a subdirectory, never `/webservice/rest/server.php`) and `MOODLE_REST_TOKEN`. A `.env` file in the working directory is also read. Redirects are not followed.
- Command names: `moodlia plugin <operation-in-kebab-case>`; flags are parameter names in kebab-case (`--course-id`). Object parameters are JSON strings.
- Every text parameter also has a `--<field>-file` form that reads UTF-8 text from a local file; the path is never sent to Moodle.
- `moodlia --help` lists commands; `moodlia <command> --help` shows the live options.
- Output is JSON on stdout. Errors are JSON `{error, code, message, details}` on stderr.
- `moodlia audit-course`, `moodlia course audit`, `course-progress`, `course completion audit|repair` and `enrolments sync` run adaptive workflows that need `--profile`. Use `moodlia plugin audit-course` for the plugin operation itself.
- Profiles live in `.moodle-profiles.json` and point to token environment variables; they never store tokens. Direct `moodlia plugin` commands ignore profiles.
- Direct plugin writes run immediately; there is no generic dry run. Built-in previews: `repair_course_completion` with `dry_run`, the adaptive `course completion repair` (dry run unless `--allow-write --yes`), and `enrolments sync` plans applied with `--apply-plan --plan-digest --allow-write --yes`.

### Exit codes

| Code | Meaning |
| ---: | --- |
| 0 | Success |
| 1 | Internal error |
| 2 | Invalid configuration, arguments, plan or local state (includes `not_found`, `invalid_parameters`, `payload_too_large`) |
| 3 | Unsupported capability or provider gap |
| 4 | Conflict or failed precondition |
| 5 | Remote Moodle, authentication, permission or transport failure |
| 6 | Partial execution or unknown write outcome |
| 7 | Response or verification failure |

## Error mapping

Both the CLI client and MCP map Moodle errors to canonical codes:

- `invalid_parameters`: Moodle codes containing "invalid" or "parameter";
- `missing_capability`: codes containing "capability", "permission" or "access";
- `not_found`: codes containing "notfound";
- `internal_error`: `coding_exception`;
- `moodle_error`: anything else.

The original Moodle code and exception stay in `details`. Use them when
reporting a failure.

## Authorisation model

- There are no course-scoped tokens. A token can act wherever its user has the capability; a teacher can edit every course where they hold editing rights.
- A course-level editing teacher role does not grant the system-level `local/moodlia:useapi`.
- For teacher self-service tokens, administrators use a dedicated system role with only `local/moodlia:useapi`, `webservice/rest:use` and `moodle/webservice:createtoken`. Never use or share an administrator token for teaching work.
- Account search needs `moodle/user:viewdetails` and `moodle/user:viewalldetails` at system level; course roles are not enough.
