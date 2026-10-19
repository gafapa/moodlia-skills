# Authoring examples

## A Page that works in a sanitized field

Request: "Create a Spanish Moodle Page explaining IPv4 subnet masks for first-year vocational students, with one worked example and a practice question."

Choose `universal-html`. Deliver `content.html` with the explanation, worked
example, practice question and a native `details` solution. Keep the reasoning
available as text; do not use an iframe for answer revelation. Validate the
package and inspect narrow-screen wrapping and keyboard access. No Moodle
connection is required to prepare the package.

## A Book chapter with local illustrations

Request: "Turn these approved notes and diagrams into an accessible Book chapter that can move with the course."

Use a root `content.html` and local images referenced through `@@PLUGINFILE@@`.
Provide meaningful image alternatives and preserve the source's instructional
meaning. Confirm the chapter's editor file area before an authorized publication;
upload the related files in one draft and verify the stored chapter and image
delivery. A source-site absolute image URL is not portable.

## A proportionality demonstration

Request: "Create a demonstration of y = 2x with a slider and a useful printable explanation."

Adapt `assets/interactive-demo/`. The learner should predict and then observe
that increasing x by one increases y by two. Keep that relationship and a worked
example outside the iframe. Test the control with the keyboard and reset it;
then disable JavaScript and remove the iframe to inspect the alternatives.
If the destination cannot serve the HTML inline or preserves no iframe, publish
the static explanation and offer the local demonstration file separately.

## Requested portability verification

Request: "Publish this demonstration and verify it survives backup and restore without MoodlIA."

Validate and publish to the authorized source course. Create a native backup,
restore it only to an authorized isolated Moodle without MoodlIA, and inspect
the restored explanation, file requests, interaction and fallback. Report exact
site/version evidence and remaining restrictions. If no isolated destination is
available, deliver the package and report restore verification as unperformed.
