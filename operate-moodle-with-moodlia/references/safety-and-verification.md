# Safety and verification

## Credentials

- Read credentials from environment configuration or the connected MCP transport.
- Never echo, log, paste, commit, or return bearer tokens.
- Do not use `--show-token` or equivalent output unless the user explicitly requests it and the terminal is not logged.
- Redact authentication material from errors before reporting them.

## Mutation rules

- Resolve and re-read identifiers; do not mutate by a guessed numeric ID.
- Prefer idempotent create-or-update logic based on a stable id number or an exact, scoped match.
- If multiple names match, stop before mutation and request a choice.
- Treat delete, destructive restore, course reset, bulk enrolment changes, and publication to learners as high-impact actions.
- Never broaden a request for inspection into a write.
- Do not use cleanup scripts on a production-like Moodle unless the user explicitly authorizes their exact scope.

## Verification levels

### Contract verification

Confirm operation name, transport, schema, file behavior, capabilities, and return shape.

### State verification

Use a read operation after every mutation. Compare the requested and observed fields, not merely a success flag.

### Visual verification

Use a browser when checking HTML rendering, iframe behavior, theme interaction, responsive layout, keyboard focus, or learner-visible ordering.

### Portability verification

Create a native backup, restore it on an isolated clean Moodle, and verify that:

- no MoodlIA runtime is required;
- no authoring-site absolute file URL remains;
- local resources load;
- sanitized surfaces retain a useful fallback;
- no browser console error prevents the learning content from working.

## Error handling

- Preserve the canonical error code, message, and relevant details.
- Distinguish schema rejection, missing capability, missing operation, Moodle business error, transport error, and visual rendering failure.
- Do not retry a write blindly after a timeout. Re-read state first because the original mutation may have succeeded.
- Report unsupported file-area publication as a capability gap, not as malformed HTML.
