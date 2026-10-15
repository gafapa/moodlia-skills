# Operation and workflow routing

Read this reference when a task goes beyond content publication or when choosing
between a direct operation, an adaptive workflow, and course synchronization.
Inspect only the selected operation's schema rather than loading a full catalogue.

## Reviewed surfaces

The reviewed plugin and bundled MoodlIA CLI contracts each contain 250 operations
(103 reads and 147 writes), declared for REST, MCP, and CLI. This establishes
contract coverage, not that a particular connected server exposes or authorizes
all 250 tools. The Moodle Core CLI contract contains 788 friendly operations
across the supported branches; compatibility and service membership still vary
by version and token. These counts are a 2026-09-30 snapshot, not limits to enforce.

| Request | Route | Source of exact invocation |
| --- | --- | --- |
| A plugin operation on one Moodle site | Discovered MCP tool or `moodlia plugin <command>` | Live tool schema or `moodlia/contract`; command help |
| A standard Moodle Core operation | `moodle-core <command>` or `moodlia core <command> --profile <name>` | `moodle-core-cli` contract and command help |
| A provider-adaptive evidence or enrolment workflow | Grouped `moodlia` workflow below | Grouped workflow help; contextual discovery |
| Supported content between two sites | `moodlia-sync` | Synchronization reference; plan and capability evidence |
| Portable authoring without publication | `$design-portable-moodle-content` | Output profiles and package validation |

Core is a static contract client, not an arbitrary third-party-function dispatcher.
Do not translate a plugin operation to Core merely by reusing its name: parameters,
ownership and results can differ. Profile credentials select the provider; direct
`moodlia plugin` commands use the direct environment configuration.

## Single-site operation families

These are routing examples, not a copied operation catalogue. Discover the exact
read and write needed within the family and follow its declared schema.

| Family | Representative plugin operations | Decisions to verify |
| --- | --- | --- |
| Diagnostics and plugin state | `get_moodlia_status`, `list_plugins`, `set_plugin_enabled` | Inspect deployed version, dependency evidence and system capability; enabling is not installation or upgrade |
| Courses and categories | `get_course_details`, `apply_course_blueprint`, `set_course_publish_state` | Target identity, existing content and publication visibility; deletion or destructive replacement needs scoped authority |
| People, cohorts and roles | `get_user_details`, `create_user`, `add_cohort_member`, `assign_course_role` | System versus course context; site-scoped user/role identifiers; account deletion is distinct from unenrolment |
| Groups and groupings | `get_groups`, `update_group`, `add_group_to_grouping` | Membership and grouping ownership; visibility/participation constraints; do not disclose enrolment keys |
| Calendar and collaboration | `create_calendar_event`, `create_forum_discussion_post`, `update_wiki_page`, `update_glossary_entry` | Course/activity context, author identity, format and separate inline/attachment drafts |
| Gradebook and completion | `update_grade_value`, `set_course_completion_criteria`, `set_activity_completion_status` | Grade item/user identity, scale and locks; completion configuration differs from learner completion history |
| Assignment assessment | `get_assignment_grading_form`, `set_assignment_rubric`, `grade_assignment_with_rubric` | Definition ids, score semantics, active method and submission; content editing must not reset an existing grading definition |
| Workshop | `set_workshop_phase`, `allocate_workshop_submission`, `evaluate_workshop_assessment` | Phase, submission/reviewer identities and current grading strategy; definition and awarded-grade changes are different actions |
| Question banks and Quiz structure | `get_question_banks`, `import_question_bank_blueprint`, `add_question_to_quiz` | Shared/private ownership, mapped question ids and quiz slots; follow publishing-workflows.md |
| Participant interactions | `save_assignment_submission`, `start_quiz_attempt`, `process_quiz_attempt`, `submit_choice_response` | Act only for the intended authorized user; confirm attempt state before submission or finalization |
| Activity-specific definitions and reports | `create_lesson_page`, `create_data_field`, `get_feedback_analysis` | Activity-specific schema, dependencies, authoring versus participant APIs and readback availability |
| Files, backups and restoration | `update_resource`, `backup_course`, `restore_course_backup` | File owner and identity, returned download record and restoration mode; follow publishing-workflows.md |

Classify effects from `type` in the plugin contract or `kind` in the Core contract,
not just the command spelling. In particular, `view_*` operations can record
view events, and an attempt-start or submission operation writes learner state.
The exclusion of learner submissions, grades, attempts and logs from cross-site
synchronization does not mean those explicit single-site APIs are unsupported.

For Core-only messaging, analytics, privacy, AI, reports or other standard-service
families, select a compatible friendly operation from the Core contract. Do not
invent an equivalent MoodlIA MCP tool or claim that every Core function has a
plugin counterpart.

## Adaptive single-site workflows

| Workflow | Behavior |
| --- | --- |
| `moodlia capabilities --profile <name>` | Discover providers; not a synchronization plan or a grant of permissions |
| `moodlia course audit --profile <name> --course-id <id>` | Prefer the plugin audit, otherwise compose available Core reads |
| `moodlia course progress --profile <name> --course-id <id> --maximum-users 100` | Report available evidence; Core also accepts explicit `--user-ids`; unavailable fields remain unknown |
| `moodlia course completion audit --profile <name> --course-id <id>` | Inspect completion evidence using the selected provider |
| `moodlia course completion repair --profile <name> --course-id <id> --mode book_view_only` | Dry-run unless `--allow-write --yes` accompanies authorized execution; Core returns a configuration-authoring gap |
| `moodlia enrolments sync --profile <name> --course-id <id> --desired-file <path> --plan-file <path>` | Plan add-only manual enrolments on one site; not cross-site course-content synchronization |

For direct plugin semantics use the explicit namespace, for example
`moodlia plugin audit-course`, instead of the default adaptive alias.
Apply a reviewed manual-enrolment plan with
`moodlia enrolments sync --apply-plan <path> --plan-digest <digest> --allow-write --yes`
only under the user's authority for that exact plan. This workflow does not use
`moodlia-sync approve` or its durable course-sync job lifecycle. Desired Core
entries use `role_id`; desired MoodlIA entries use `role_archetype`. Do not mix
them or interpret add-only synchronization as removing existing enrolments.

Completion repair supports the modes declared in help, including
`book_view_only`, `all_grade_to_view`, and `disable_all`. Inspect a dry-run first;
resetting completion states requires its own requested scope. Do not apply a
dry-run result, Core gap or partial report as though it had changed Moodle.
