# Pitfalls and lessons

## Operation types

- `backup_course`, `backup_course_module` and `backup_course_section` are typed as reads but create files. Approval policies that only gate writes will not stop them.
- `view_*` operations are typed as writes because they record views and completion.
- Most operations declare `missing_capability` and `not_found`; all declare `invalid_parameters`, `invalid_context`, `moodle_error` and `internal_error`.

## Writes and retries

- There is no exactly-once guarantee. After a timeout or an interrupted response, read the current state and reconcile before repeating a write.
- Creation calls are not idempotent unless the schema says so (for example `create_course_category` with `reuse_existing`).
- Backup files with the same name in the same area replace each other.

## Sites and versions

- Plugins older than the feature you need return unknown-function errors. Check `get_moodlia_status` instead of assuming the latest release.
- Standalone question banks and `quiz_private` banks need Moodle 5.0 or later.
- Some course formats reject direct section creation. Create a `subsection` module and move content with `move_module` when the format allows it.
- Moodle backup and restore do not work on SQLite test sites; use PostgreSQL or MariaDB for backup experiments.
- When a site shows PHP debug messages on screen, they can be mixed into web service responses and make JSON unreadable. Report it to the site administrator instead of parsing around it.
- MoodlIA adds no upload size limit of its own; Moodle, PHP and web server limits apply. The CLI caps responses at 64 MiB and downloads at 2 GiB by default.

## Text and formats

- Text format parameters accept `html`, `plain`, `markdown` and `moodle`. Omitting a format usually keeps the stored one; check the schema.
- Store generated HTML as `html`. Put files in the field's own editor area and reference them with `@@PLUGINFILE@@`.
- Do not paste absolute `pluginfile.php` URLs from one site into another; context and item ids change.

## Not supported

- Installing, updating or removing Moodle plugin code.
- Cross-site synchronisation in the `moodlia` CLI (use `moodlia-sync`).
- Third-party Feedback item types, Lesson cluster and end pages, and third-party Workshop strategies.
