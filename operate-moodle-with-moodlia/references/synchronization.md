# Cross-site course synchronization

Use the shared synchronization engine for content transfer between Moodle sites without creating a Moodle backup. The source and destination may independently expose Moodle Core services, MoodlIA, or both. `moodlia` is the adaptive CLI; `moodle-core` is a Core-only foundation and intentionally has no MCP server.

## Capability and permission boundary

Discover each endpoint at runtime. A declared operation is not proof that the current token can use it. MoodlIA contextual evidence may prove course, category, activity, grading-form, or Workshop permissions; Core capabilities remain conservative unless exact service-function and field evidence exists. Provider selection is made per planned action and frozen into the immutable plan.

Do not claim complete course parity. Current synchronization covers selected course metadata, explicit hidden target creation, sections when MoodlIA can author them, groups/groupings, selected portable modules, file resources, Books, selected assignment content and new rubrics, and new Workshop forms. Existing grading definitions are protected. Unsupported module authoring, deletion, learner submissions, grades, attempts, logs, and personal content must remain explicit gaps.

## Safe CLI workflow

1. Define source and target profiles whose credentials are environment-variable references. Never store token values in the profile, plan, mapping, or SQLite state.
2. Run `moodlia capabilities --profile <name>` for both endpoints and, where relevant, include the course or category context.
3. Create a plan with `moodlia course sync --source-profile ... --source-course-id ... --target-profile ... --target-course-id ... --plan ...`. To create a course, use an explicit target category and short name; creation remains hidden.
4. Review actions, conflicts, unsupported items, skipped dependencies, selected providers, effects, byte estimates, preconditions, expiry, and digest.
5. Keep `unsupported-policy=error` unless the user explicitly chooses `skip` or a named registered `degrade` transformation. `skip` removes dependent actions; `degrade` is not a generic lossy switch.
6. Approve the exact plan digest outside an MCP model call. Apply with `--allow-write`; never treat a model-supplied boolean as human approval.
7. Inspect the durable job, then verify through a fresh readback. Use history, cancellation, resume, and verify commands against the same SQLite state when recovery is required.

Do not replay a timeout blindly. An ambiguous write becomes `unknown_outcome`; resume must first reconcile live state. Plans fail on global drift and again on entity preconditions immediately before each write. Only one job may hold a destination binding lease.

## Coordinator MCP

Use `moodlia-sync-mcp` when an MCP client must coordinate two sites. This is separate from the Moodle-hosted MoodlIA MCP, which operates one site. Policy must allowlist profiles, direction, source course IDs, target course IDs or categories, and effects. The coordinator exposes planning, externally approved application, status, cancellation, resume, conflict inspection/replanning, verification, and history.

For local clients prefer stdio. The Streamable HTTP server requires a strong Bearer credential, host allowlisting, and a TLS-authenticated reverse proxy for any non-loopback deployment. Run one coordinator per trust domain; Moodle credentials remain downstream secrets and never become MCP arguments or results.

## Content and identity rules

- Numeric Moodle IDs are site-scoped. Persist source-to-target mappings; never copy an ID between sites.
- Hash binary assets before transfer and verify the destination manifest after publication.
- Rewrite only mappings that are proven. Block unresolved source-site links rather than publishing broken absolute URLs.
- Preserve target-only changes under three-way comparison unless an explicit conflict policy authorizes replacement.
- Native `.mbz` backup remains a separate portability and disaster-recovery mechanism, not the synchronization transport.
