# Cross-site course synchronization

Use the `moodlia-sync` CLI for content transfer between Moodle sites without creating a Moodle backup. The source and destination may independently expose Moodle Core services, MoodlIA, or both; `moodlia-sync` chooses a provider per capability. It is a separate package (`npm install -g moodlia-sync`) that builds on `moodlia` and `moodle-core-cli`; neither of those runs synchronization since 0.4.0, and there is no synchronization MCP server.

The reviewed release is `moodlia-sync` 0.1.1. Keep the same `--config` and
`--state` values throughout planning, approval, apply, recovery, and verification:
the defaults are `.moodle-profiles.json` and `.moodle-sync/state.sqlite` relative
to the working directory. Moving to another directory without explicit paths
can select a different profile file or lose access to the saved approval and job.

If a command fails with `dependency_unavailable`, the native SQLite driver was not built: run `npm approve-scripts better-sqlite3 && npm rebuild better-sqlite3` in the install location.

## Capability and permission boundary

Discover each endpoint at runtime. A declared operation is not proof that the current token can use it. MoodlIA contextual evidence may prove course, category, activity, grading-form, or Workshop permissions; Core capabilities remain conservative unless exact service-function and field evidence exists. Provider selection is made per planned action and frozen into the immutable plan.

Do not claim complete course parity. Current synchronization covers selected course metadata, explicit hidden target creation, sections when MoodlIA can author them, groups/groupings, portable Page/Label/URL/resource/folder and Book content, selected assignment content and grading forms, Workshop forms, supported standalone and Quiz-private question banks, Quiz slots, portable Lesson pages, Database fields, Feedback items, course-completion criteria, root manual grade items, and safe module-grade-item settings. Existing definitions and locked grading or completion state are protected. Embedded question/Lesson assets, positive Lesson cross-page jumps, custom grade categories, deletion, learner submissions, awarded grades, attempts, logs, and personal content must remain explicit gaps.

Do not infer a Core authoring path from a structural read or quick-create API.
Core destinations currently cannot publish full Page, Book, assignment, or
section content. File resources can be replaced on capable MoodlIA targets;
folder-content updates remain blocked. Quiz transfer requires explicit
acceptance of its reported losses. New and existing entities can have different
capabilities; inspect the actual plan rather than flattening them into one claim.

Check the actual write route for each text field. Page, Label, URL and File
formats beyond HTML/plain require the selected destination capability's
`text_formats` (plugin 0.1.215 or later); an unrelated creation/update route
does not establish support. Published 0.1.1 blocks Assignment Markdown and
Moodle-format text despite its release note, and its creation routes can lose
non-HTML formatting. The local 2026-10-01 sync implementation preserves declared
Assignment formats through field-specific updates after creation, and publishes
non-HTML Page/Label/URL drafts through a separate update operation. Every required
route must accept the fields and formats; otherwise planning blocks before writes.
It also preserves course summary formats when raw source text is available,
and preserves literal non-HTML text. Legacy services that return rendered
non-HTML summaries without raw text now produce `source_raw_text_unavailable`;
never publish that rendered HTML as plain/Markdown/Moodle source. Introduction
file URLs from older plugins are normalized against their owned file paths.
Module grade ranges belong to the owning activity: the local implementation
preserves known creation ranges there and blocks unsupported range changes,
rather than sending them to `update_grade_item`.
Assignment plugin settings can remain `selected_configuration_incomplete` even
when text, formats and editor files are portable. The named
`assignment_selected_settings` transformation must be explicit in the reviewed
plan and evidence; it does not establish complete Assignment configuration parity.
Live qualification also found that the legacy plugin's Page/Label/URL readers
returned rendered text and HTML format instead of authored text and its stored
format. The qualification plugin branch fixes those readers; a published-version
label alone does not establish original-format fidelity. Use recorded plugin
commit evidence when making that claim.
Internal links in non-HTML text that require remapping remain explicit gaps. These changes
are unreleased: confirm the executable includes them before relying on this
behavior. Do not silently convert text to HTML.

Cross-version synchronization remains preview. The 100-case logical matrix
reuses capabilities across version labels and does not prove compatibility with
real branch schemas. Live Page/group/section fixtures do not establish Book,
Quiz, Lesson, grading-form or complete-course fidelity. A scheduled test matrix
is not a passing report. Read the project's `docs/CROSS-VERSION-REVIEW.md` when
available and report the exact content families, versions and provider pairings
covered by the actual live evidence. The local implementation refreshes discovery
and compares approved capabilities for pending operations before apply/resume,
then rechecks the returned course context after course creation. A changed
snapshot requires a new reviewed plan; completed actions are retained. Core
permission evidence can remain unknown, and permissions can change between
remote writes. Do not infer unchanged write permission from a successful read.
With `skip`, reference-dependent actions and unused draft stages are pruned;
failure to create the requested target course cannot authorize child writes.
Before live qualification, inspect dependency gaps as well as field gaps.
The local implementation orders forward creation dependencies, preserves deferred
link parameters/fragments and blocks cyclic new links or new self-links.
Interrupted `started` writes require reconciliation before replay; unknown draft
uploads cannot be proven by a course read. Retain their state and resolve the
uncertainty rather than assuming another upload is safe. A lost lease stops
subsequent writes. These protections are part of the unreleased 2026-10-01 changes.

Live [run 36937166691](https://github.com/gafapa/moodlia-sync/actions/runs/36937166691)
passed both directions between Moodle 4.5.12 and 5.3 beta on SQLite and
PostgreSQL. Each combination verified 16 Page/Label/URL/Assignment cases across
all four formats, 32 owned-file hashes, strict summary/Assignment gaps and a
zero-action re-plan. Assignment configuration used only the declared
`assignment_selected_settings` transformation. This is unreleased sync commit
`47f6c2ed8c0b12f448259e2378d675a741447dfa` with plugin commit
`765834aa2cdb0c325c6fe5d064febfd6de808b0f`, not proof about the published npm
package or unpatched plugin. Subsequent general plugin qualification resolved
the earlier PHPUnit/static/REST failures: full
[run 36942721255](https://github.com/gafapa/moodle-local_moodlia/actions/runs/36942721255)
passed ten Moodle 4.5–5.3 beta PHP/database profiles, and
[run 36943122019](https://github.com/gafapa/moodle-local_moodlia/actions/runs/36943122019)
passed at plugin commit `2a58ca4`. These plugin results have separate provenance
from synchronization; they do not establish complete course parity or qualify
every combination of later changes.

## Safe CLI workflow

1. Define source and target profiles whose credentials are environment-variable references. Never store token values in the profile, plan, mapping, or SQLite state.
2. Run `moodlia-sync capabilities --profile <name>` for both endpoints and, where relevant, include the course context with `--course-id`.
3. Create a plan with `moodlia-sync plan --source-profile ... --source-course-id ... --target-profile ... --target-course-id ... --plan-file ...`. To create a course, use `--create-target-category-id` and `--target-shortname`; creation remains hidden.
4. Review actions, conflicts, unsupported items, skipped dependencies, selected providers, effects, byte estimates, preconditions, expiry, and digest.
5. Keep `unsupported-policy=error` unless the user explicitly chooses `skip` or a named registered `degrade` transformation. `skip` removes dependent actions; `degrade` is not a generic lossy switch.
6. Establish explicit user approval of the exact reviewed plan digest. If the user has already approved that digest and execution in this session, retain that authority instead of asking again. Only after the user approves, run `moodlia-sync approve <plan> --yes`, then `moodlia-sync apply <plan> --plan-digest <digest> --allow-write`. The equivalent inline form adds `--approve --yes` to apply; those flags record existing authority, not a substitute for it. Each approval authorizes one apply or one resume.
7. Inspect the durable job with `moodlia-sync status --job-id ...`, then verify through a fresh readback with `moodlia-sync verify --plan-id ...`. Re-planning an applied course should produce no actions.

Other commands: `moodlia-sync history`, `moodlia-sync cancel --job-id ...`, `moodlia-sync resume --job-id ... --plan-digest ... --allow-write` (after a new approval), and `moodlia-sync conflicts <plan> [--resolve source-wins|target-wins]`. A conflict, capability gap, partial result, or verification failure still emits structured JSON and uses its documented non-zero exit code; do not discard stdout merely because the process code is non-zero.

Conflict resolution writes a newly planned file, optionally selected with
`--plan-file`; it does not edit an approved plan in place. Review the new digest
and obtain authority for that plan before executing it. A resume needs a fresh,
unconsumed approval of its plan and can use `--approve --yes` after that authority
is established. Preserve mappings and the SQLite state; do not fix recovery by
deleting them or starting another destination binding.

Use `moodlia course completion audit` for adaptive completion evidence. `moodlia course completion repair` is dry-run unless both `--allow-write` and `--yes` are present. On a Core-only site it returns a capability-gap plan because Core has no verified activity-completion configuration authoring API; never reinterpret that plan as a successful repair.

Do not replay a timeout blindly. An ambiguous write becomes `unknown_outcome`; resume must first reconcile live state. Plans fail on global drift and again on entity preconditions immediately before each write. Only one job may hold a destination binding lease.

Course updates rejected by Moodle warnings now fail with `validation_error`
through Core 0.4.1, including a conflicting shortname. Preserve the warning codes
and inspect the target; a returned transport response alone is not a successful
write. When both adaptive providers fail, MoodlIA 0.4.1 reports each provider's
cause. Diagnose those causes separately instead of treating them as one missing
plugin or retrying an unchanged token.

## No synchronization MCP

The former `moodlia-sync-mcp` coordinator is deprecated and does not need to be used. An MCP-driven agent with shell access would run the same CLI, so the approval boundary is the user's explicit approval of a plan digest, recorded by `moodlia-sync approve`. The Moodle-hosted MoodlIA MCP remains a single-site operation surface.

## Content and identity rules

- Numeric Moodle IDs are site-scoped. Persist source-to-target mappings; never copy an ID between sites.
- Hash binary assets before transfer and verify the destination manifest after publication.
- Rewrite only mappings that are proven. Block unresolved source-site links rather than publishing broken absolute URLs.
- Preserve target-only changes under three-way comparison unless an explicit conflict policy authorizes replacement.
- Native `.mbz` backup remains a separate portability and disaster-recovery mechanism, not the synchronization transport.

## Evidence boundary

The 100 source/target/provider combinations are a logical test matrix, not 100
live deployment tests. Live qualification records Moodle 4.5.12 and 5.3 beta in
both directions with four provider pairings. A documented capability gap can
be a passing qualification result while transferring no content for that field.
Use the installed capability evidence and current project's qualification report
before claiming support for a particular site, token, version, or field.
