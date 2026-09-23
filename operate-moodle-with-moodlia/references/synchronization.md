# Cross-site course synchronization

Use the `moodlia-sync` CLI for content transfer between Moodle sites without creating a Moodle backup. The source and destination may independently expose Moodle Core services, MoodlIA, or both; `moodlia-sync` chooses a provider per capability. It is a separate package (`npm install -g moodlia-sync`) that builds on `moodlia` and `moodle-core-cli`; neither of those runs synchronization since 0.4.0, and there is no synchronization MCP server.

If a command fails with `dependency_unavailable`, the native SQLite driver was not built: run `npm approve-scripts better-sqlite3 && npm rebuild better-sqlite3` in the install location.

## Capability and permission boundary

Discover each endpoint at runtime. A declared operation is not proof that the current token can use it. MoodlIA contextual evidence may prove course, category, activity, grading-form, or Workshop permissions; Core capabilities remain conservative unless exact service-function and field evidence exists. Provider selection is made per planned action and frozen into the immutable plan.

Do not claim complete course parity. Current synchronization covers selected course metadata, explicit hidden target creation, sections when MoodlIA can author them, groups/groupings, portable Page/Label/URL/resource/folder and Book content, selected assignment content and grading forms, Workshop forms, supported standalone and Quiz-private question banks, Quiz slots, portable Lesson pages, Database fields, Feedback items, course-completion criteria, root manual grade items, and safe module-grade-item settings. Existing definitions and locked grading or completion state are protected. Embedded question/Lesson assets, positive Lesson cross-page jumps, custom grade categories, deletion, learner submissions, awarded grades, attempts, logs, and personal content must remain explicit gaps.

## Safe CLI workflow

1. Define source and target profiles whose credentials are environment-variable references. Never store token values in the profile, plan, mapping, or SQLite state.
2. Run `moodlia-sync capabilities --profile <name>` for both endpoints and, where relevant, include the course context with `--course-id`.
3. Create a plan with `moodlia-sync plan --source-profile ... --source-course-id ... --target-profile ... --target-course-id ... --plan-file ...`. To create a course, use `--create-target-category-id` and `--target-shortname`; creation remains hidden.
4. Review actions, conflicts, unsupported items, skipped dependencies, selected providers, effects, byte estimates, preconditions, expiry, and digest.
5. Keep `unsupported-policy=error` unless the user explicitly chooses `skip` or a named registered `degrade` transformation. `skip` removes dependent actions; `degrade` is not a generic lossy switch.
6. Ask the user to approve the exact plan digest. Only after the user approves, run `moodlia-sync approve <plan> --yes`, then `moodlia-sync apply <plan> --plan-digest <digest> --allow-write`. Each approval authorizes one apply or one resume. Never approve on your own initiative and never treat a model-supplied boolean as human approval.
7. Inspect the durable job with `moodlia-sync status --job-id ...`, then verify through a fresh readback with `moodlia-sync verify --plan-id ...`. Re-planning an applied course should produce no actions.

Other commands: `moodlia-sync history`, `moodlia-sync cancel --job-id ...`, `moodlia-sync resume --job-id ... --plan-digest ... --allow-write` (after a new approval), and `moodlia-sync conflicts <plan> [--resolve source-wins|target-wins]`. A conflict, capability gap, partial result, or verification failure still emits structured JSON and uses its documented non-zero exit code; do not discard stdout merely because the process code is non-zero.

Use `moodlia course completion audit` for adaptive completion evidence. `moodlia course completion repair` is dry-run unless both `--allow-write` and `--yes` are present. On a Core-only site it returns a capability-gap plan because Core has no verified activity-completion configuration authoring API; never reinterpret that plan as a successful repair.

Do not replay a timeout blindly. An ambiguous write becomes `unknown_outcome`; resume must first reconcile live state. Plans fail on global drift and again on entity preconditions immediately before each write. Only one job may hold a destination binding lease.

## No synchronization MCP

The former `moodlia-sync-mcp` coordinator is deprecated and does not need to be used. An MCP-driven agent with shell access would run the same CLI, so the approval boundary is the user's explicit approval of a plan digest, recorded by `moodlia-sync approve`. The Moodle-hosted MoodlIA MCP remains a single-site operation surface.

## Content and identity rules

- Numeric Moodle IDs are site-scoped. Persist source-to-target mappings; never copy an ID between sites.
- Hash binary assets before transfer and verify the destination manifest after publication.
- Rewrite only mappings that are proven. Block unresolved source-site links rather than publishing broken absolute URLs.
- Preserve target-only changes under three-way comparison unless an explicit conflict policy authorizes replacement.
- Native `.mbz` backup remains a separate portability and disaster-recovery mechanism, not the synchronization transport.
