import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const validator = path.join(root, 'design-portable-moodle-content', 'scripts', 'validate-portable-content.mjs');

test('accepts the bundled self-contained interactive demonstration', async () => {
  const target = path.join(root, 'design-portable-moodle-content', 'assets', 'interactive-demo');
  const result = await runValidator(target);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.report.valid, true);
  assert.equal(result.report.checkedFiles, 6);
});

test('rejects remote resources, unsafe parent scripts, and unsandboxed iframes', async (context) => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'moodlia-portable-test-'));
  context.after(() => rm(target, { recursive: true, force: true }));
  await writeFile(path.join(target, 'content.html'), [
    '<script>alert(1)</script>',
    '<img src="https://example.test/image.png">',
    '<iframe src="interactive/example/index.html"></iframe>'
  ].join('\n'));

  const result = await runValidator(target);
  assert.equal(result.code, 1);
  assert.equal(result.report.valid, false);
  const rules = new Set(result.report.issues.map((issue) => issue.rule));
  assert.ok(rules.has('parent-script'));
  assert.ok(rules.has('remote-active-resource'));
  assert.ok(rules.has('iframe-sandbox'));
  assert.ok(rules.has('iframe-title'));
});

test('rejects dynamic code and remote runtime requests', async (context) => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'moodlia-portable-test-'));
  context.after(() => rm(target, { recursive: true, force: true }));
  await writeFile(path.join(target, 'app.js'), 'eval("1"); fetch("https://example.test/data");');

  const result = await runValidator(target);
  assert.equal(result.code, 1);
  const rules = new Set(result.report.issues.map((issue) => issue.rule));
  assert.ok(rules.has('dynamic-code'));
  assert.ok(rules.has('remote-network'));
});

function runValidator(target) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [validator, target, '--json'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => resolve({ code, stderr, report: JSON.parse(stdout) }));
  });
}
