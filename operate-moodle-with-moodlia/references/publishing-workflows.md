# Publishing workflows

## Publish universal HTML

1. Validate the HTML with the producing skill.
2. Resolve the course and destination surface.
3. Read the destination operation schema.
4. Create or update the field using the schema's HTML/content parameter and format value.
5. Re-read the content through `get_course_contents`, a module-specific read operation, or both.
6. Inspect the Moodle page in a browser when visual fidelity matters.

Never add `@@PLUGINFILE@@` references unless the same workflow can attach every referenced file to the correct file area.

Use `html` for generated HTML instead of relying on a field's default format.
Plugin 0.1.215 exposes `html`, `plain`, `markdown`, and `moodle` for applicable
text fields. Book and Lesson `content_format` accept these names as well as
legacy numeric aliases; wiki `content_format` remains `html`, `creole`, or
`nwiki` where declared. Do not extrapolate one field's enum to another.

## Editor assets and attachments

Confirm the destination field, draft parameter, and ownership before uploading:

| Destination | Editor draft | Important distinction |
| --- | --- | --- |
| Book chapter, Page, Label, URL, section summary | Supported `draft_item_id` or documented module options | Publish files into the exact owner's editor area |
| Assignment description or instructions | `draft_item_id` with `file_area` | `intro` and `activity` are separate file areas |
| Forum discussion or post | `inline_draft_item_id` | Downloadable files use `attachment_draft_item_id` separately |
| Glossary entry | `inline_draft_item_id` | Definition files and attachments are separate |
| Lesson or wiki page | `draft_item_id` | A file-capable field can still sanitize HTML or iframes |
| New activity intro | `options.intro_draft_item_id` when supported | Confirm plugin support; the CLI resource shortcut does not populate this field |

`--upload-file` stages one inline/editor file; `--attachment-file` stages one
attachment only for operations that declare it. Keep both draft identifiers
when a supported operation uses both paths. Attachment-only publication does
not make a `@@PLUGINFILE@@` reference in the editor valid.

For a multi-file package, upload every member into one current-user draft,
preserving its nested `filepath` and `filename`. The public Node client accepts
`client.uploadDraftFile(localPath, { filename, filepath, itemId })`: start with
`itemId: 0`, retain the returned `draft_item_id`, and reuse it as `itemId` for
subsequent files. Pass the final draft id to the chosen operation only after
all files are staged. Use the same site, token, and owner throughout; do not
publish a separate draft per asset or treat a ZIP as automatically extracted.

Re-read the owner's file manifest, paths and content hashes after publication.
Rendered asset URLs can encode Unicode names differently; preserve stable,
field-relative `@@PLUGINFILE@@` paths and never copy source context ids or token
query parameters into generated HTML.

## Publish a Book

1. Resolve the course and section.
2. Reuse the intended Book if uniquely identified; otherwise create a standard `book` module.
3. List current chapters before creating, updating, moving, or deleting any chapter.
4. Create chapters in deterministic order and retain every returned `chapter_id`.
5. Use `after_chapter_id` only with a verified chapter from the same Book.
6. Re-list chapters with content and verify title, order, subchapter state, visibility, and HTML.

Current chapter mutations support editor-file uploads with `draft_item_id`. Upload through the CLI's `--upload-file` path, use `@@PLUGINFILE@@/filename` in chapter HTML, and verify the final `mod_book/chapter` file manifest. If live discovery reports a different contract, obey the discovered contract and report the gap instead of assuming upload support.

For more than one chapter asset, use the shared-draft workflow above and retain
the chapter id. Do not recreate an existing Book or chapter merely to attach files.

## Publish a portable interactive artifact

1. Confirm the target HTML field preserves iframe markup on the target site.
2. Confirm an operation exists for uploading files into that exact field's backed-up file area.
3. Upload the package files and obtain stable field-relative paths.
4. Insert only `@@PLUGINFILE@@` references in the stored HTML.
5. Re-read and render the destination.
6. When backup or portability assurance is requested, create a native course backup.
7. For portability assurance, restore on an authorized isolated Moodle without MoodlIA, or explicitly report that restore behavior remains unverified.

If step 2 is unsupported, do not upload the package to an unrelated Folder activity and claim that it is embedded or self-contained. Offer the Folder as an explicit separate-resource alternative only when the user accepts that change.

## Replace a File resource

1. Resolve the existing File resource and record its course-module and instance identifiers.
2. Confirm that `update_resource` declares `files: upload` in the current contract.
3. Run `update_resource` through MCP or `update-resource --upload-file <path>` through the CLI.
4. Re-read the resource and verify its filename, file metadata, course-module identifier, and instance identifier.
5. When portability matters, back up and restore the course and verify the replacement file after restoration.

Do not delete and recreate a File resource merely to replace its file. Recreation changes activity identity and can disrupt links, completion state, restrictions, grades, logs, or external references.

## Work with question banks

1. Use `get_question_banks` to discover existing course-shared and quiz-private locations.
2. Use `bank_scope=course_shared` for questions intended to be reusable across the course.
3. Pass a verified `question_bank_module_id` when targeting a specific existing shared bank. When creating a category or importing a blueprint and no shared bank exists, omit that identifier so MoodlIA can provision the course `qbank` activity on branches that support it. Moodle 4.5 can use its shared course-context bank without that optional activity; verify the returned scope rather than demanding a `qbank` module on every branch.
4. Use `bank_scope=quiz_private` only for questions intentionally owned by one quiz, and provide the verified `quiz_module_id`.
5. Verify the returned scope, category, and owning module identifiers. Include the question bank in a course backup when portability is required.

Do not treat the absence of an existing `qbank` activity as a platform limitation or silently substitute a quiz-private bank. The two scopes have different ownership and reuse semantics.

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

Use the returned file record and authenticated client download path; do not
construct a backup URL from context/item ids. Record separately whether the
backup was created, downloaded, and restored. An unreleased URL fix in a local
checkout does not prove that a deployed server has it.
