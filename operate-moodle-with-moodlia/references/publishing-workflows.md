# Publishing workflows

## Publish universal HTML

1. Validate the HTML with the producing skill.
2. Resolve the course and destination surface.
3. Read the destination operation schema.
4. Create or update the field using the schema's HTML/content parameter and format value.
5. Re-read the content through `get_course_contents`, a module-specific read operation, or both.
6. Inspect the Moodle page in a browser when visual fidelity matters.

Never add `@@PLUGINFILE@@` references unless the same workflow can attach every referenced file to the correct file area.

## Publish a Book

1. Resolve the course and section.
2. Reuse the intended Book if uniquely identified; otherwise create a standard `book` module.
3. List current chapters before creating, updating, moving, or deleting any chapter.
4. Create chapters in deterministic order and retain every returned `chapter_id`.
5. Use `after_chapter_id` only with a verified chapter from the same Book.
6. Re-list chapters with content and verify title, order, subchapter state, visibility, and HTML.

Current contracts may expose chapter HTML while declaring `files: none` for chapter mutations. In that state, iframe packages and other chapter files cannot be published through that operation. Publish universal HTML or stop and report the contract gap.

## Publish a portable interactive artifact

1. Confirm the target HTML field preserves iframe markup on the target site.
2. Confirm an operation exists for uploading files into that exact field's backed-up file area.
3. Upload the package files and obtain stable field-relative paths.
4. Insert only `@@PLUGINFILE@@` references in the stored HTML.
5. Re-read and render the destination.
6. Back up the course.
7. Prefer a restore test on a clean Moodle without MoodlIA when the user requests portability assurance.

If step 2 is unsupported, do not upload the package to an unrelated Folder activity and claim that it is embedded or self-contained. Offer the Folder as an explicit separate-resource alternative only when the user accepts that change.

## Generate a complete course

Use a blueprint operation when its current schema covers the requested structure. Otherwise create the course and its elements incrementally so each identifier and failure can be verified.

Keep the course hidden or in draft while building when the operation surface supports a publish state. Audit the course before publishing.

## Backup and restore

1. Confirm the course identifier and backup options.
2. Create a native Moodle backup with `backup_course` or its current equivalent.
3. Locate the resulting backup record through the returned data or backup-file listing operation.
4. Do not delete previous backups unless explicitly requested.
5. Restore only to a user-approved target. `existing_delete` is destructive and requires explicit authority.
6. Verify the restored course independently from the source course.

