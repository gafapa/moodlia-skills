# Procedures

Parameter lists below name the important parameters only. Confirm the full,
current list in the live schema before calling an operation.

## Audit a course before publishing

1. `audit_course(course_id)` returns `ready`, `issue_count` and `issues_json`. Errors (`no_teachable_sections`, `no_activities`) block readiness; warnings (`course_hidden`, `course_summary_empty`, `no_enrolled_users`, `section_empty`) and the info `completion_disabled` do not. Section 0 is not audited.
2. `audit_course_completion(course_id, include_ok)` lists completion problems.
3. If repairs are needed, run `repair_course_completion(course_id, mode, dry_run)` with `dry_run` true, show the plan, and apply it only after confirmation with `dry_run` false and `reset_completion_states` true. Modes: `book_view_only`, `all_grade_to_view`, `disable_all`.
4. Check grade items with `get_grade_items` and learner progress with `get_course_progress_report`.
5. Publish with `set_course_publish_state(course_id, publish_state)`. Only `published` makes the course visible; `draft`, `ready` and `archived` keep it hidden.

## Copy one activity or one section between courses

Requires plugin 0.1.224 or later. In 0.1.223 every backup without a filename was
stored as `backup.mbz` and replaced the previous one, invalidating its `file_id`.

1. Export:
   - an activity: `backup_course_module(course_id, module_id, filename)`;
   - a section: `backup_course_section(course_id, section_number, include_activities, filename)`.
   Give each backup a distinct `filename`. Without one, Moodle's default name is used and two backups of the same item in the same minute replace each other.
2. Keep the returned `file_id`. Without user data, the file is stored in the caller's own backup area and survives deletion of the source activity. With `include_users`, it is stored in the activity or section backup area and is deleted with the activity.
3. Import: `restore_course_item_backup(backup_file_id, target_course_id, target_section_number)`. It adds content and deletes nothing.
   - An activity goes to the section with the same number as in the source, or to section 0 when the target has no such section. With `target_section_number`, it moves to the end of that existing section; a missing section is rejected before anything is restored.
   - A section merges into the section with the same number; Moodle creates it if missing. An existing section keeps its own name and summary. `target_section_number` is rejected for section backups.
   - Whole-course backups are rejected; use `restore_course_backup`.
   - In Moodle 5.x, modules inside a restored subsection stay in that subsection when top-level modules are moved.
4. Read `modules_json` (new module ids and sections) and `warnings_json`. Verify with `get_course_contents` on the target course.
5. To import from another site, upload the `.mbz` first with `upload_course_backup` and use the returned `file_id`.
6. List stored backups with `get_course_backup_files(course_id, include_private)`. Delete backups that are no longer needed with `delete_course_backup_file(file_id)` after confirmation.

Permissions: `moodle/backup:backupactivity` or `moodle/backup:backupsection` to
export, plus `moodle/backup:userinfo` with user data; `moodle/course:manageactivities`
and `moodle/restore:restoreactivity` or `moodle/restore:restoresection` in the
target to import. A user can restore only backups stored in their own files or
in a context where they hold the backup capability.

## Back up and restore a whole course

1. `backup_course(course_id, filename, include_users)` and keep the `file_id`.
2. `restore_course_backup(backup_file_id, target)`:
   - `new_course` (default) needs `category_id`, `fullname` and `shortname`; a failed restore removes the incomplete course;
   - `existing_add` adds into `target_course_id`;
   - `existing_delete` deletes the target course's content first. Treat it as destructive and confirm it explicitly.
3. Moodle precheck warnings are returned and do not stop the restore; precheck errors do.
4. `export_course_blueprint` produces MoodlIA JSON, not a Moodle backup. Use it to recreate structure, not to preserve content and files.

## Manage users

Requires plugin 0.1.222 or later.

1. Find accounts with `list_users(search, suspended, limit)`. `search` is a literal substring of username, names or email; `limit` is at most 100. Deleted, guest and remote accounts are excluded.
2. Suspend or reactivate with `set_user_suspended(user_id, suspended)`. Suspension ends the user's sessions; reactivation keeps the profile and enrolments.
3. Prefer suspension to `delete_user`, which cannot be undone.
4. Enrolment is separate: `enrol_user` and `unenrol_user`. `sync_course_enrolments` with `unenrol_missing` removes users and needs confirmation.
5. Protected accounts cannot be changed: guest, deleted and remote accounts, other site administrators unless the caller is one, and the caller's own account for suspension or deletion.

## Edit a quiz introduction

Requires plugin 0.1.220 or later. Call `update_module(course_id, module_id, options)`
with `options` containing `intro` and, if needed, `intro_format`
(`html`, `plain`, `markdown` or `moodle`). Omitting `intro_format` keeps the stored
format; an empty `intro` clears the description. Settings, questions, attempts,
grades and existing files are kept. This path does not upload new editor files.

## Publish HTML with files into an editor field

1. Prepare the content first (see the `design-portable-moodle-content` skill).
2. For a section summary, `update_section(course_id, section_number, summary, summary_format, filename)` with exactly one of `upload_reference` or `draft_item_id`. Reference uploaded files as `@@PLUGINFILE@@/<filename>`.
3. With the CLI, `--upload-file` streams a local file to the caller's draft area and passes its `draft_item_id`. Commands with file uploads include `update-assignment`, `create-book-chapter`, `update-book-chapter`, `update-resource`, `upload-folder-file` and resource creation through `create-module`.
4. Forum, glossary, Lesson and wiki content accept draft item ids; `create_module` accepts `options.intro_draft_item_id` for activity introductions.
5. Read the field back and open the stored files before reporting success.

## Change completion settings

- `update_module` needs `reset_completion_states` true when it changes completion rules of an activity with existing completion data.
- To clear stale grade conditions, set `completion_use_grade` and `completion_pass_grade` to false.
- `set_course_completion_criteria` takes course module ids and refuses to replace criteria after learners have completion records.
