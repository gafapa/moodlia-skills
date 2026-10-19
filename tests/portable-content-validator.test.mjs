import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
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

test('accepts a static package with instructional external links', async (context) => {
  const target = await fixture(context);
  await writeFile(path.join(target, 'content.html'), '<h2>Subnet masks</h2><p>Compare network prefixes.</p><a href="https://example.test/reading">Further reading</a>');
  const result = await runValidator(target);
  assert.equal(result.code, 0, JSON.stringify(result.report));
});

test('rejects empty packages and missing or empty parent fragments', async (context) => {
  const target = await fixture(context);
  for (const content of [null, '   ']) {
    if (content !== null) await writeFile(path.join(target, 'content.html'), content);
    const result = await runValidator(target);
    assert.equal(result.code, 1);
    assert.ok(result.report.issues.some((issue) => issue.rule === 'package-entrypoint'));
  }
});

test('rejects broken, escaping and remote resource paths', async (context) => {
  const target = await fixture(context);
  for (const resourcePath of ['missing.png', '../outside.png', '%2e%2e/outside.png', '//example.test/image.png', '/absolute.png', 'data:image/png;base64,abc', 'https&#58;//example.test/a.png']) {
    await writeFile(path.join(target, 'content.html'), `<img src="${resourcePath}" alt="Diagram">`);
    const result = await runValidator(target);
    assert.equal(result.code, 1, resourcePath);
  }
});

test('accepts local nested resources in HTML and CSS', async (context) => {
  const target = await fixture(context);
  await mkdir(path.join(target, 'images'));
  await writeFile(path.join(target, 'images/chart.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  await writeFile(path.join(target, 'content.html'), '<img src="@@PLUGINFILE@@/images/chart.svg" alt="Chart"><link rel="stylesheet" href="styles.css">');
  await writeFile(path.join(target, 'styles.css'), '.chart { background: url("images/chart.svg"); }');
  assert.equal((await runValidator(target)).code, 0);
  await writeFile(path.join(target, 'styles.css'), '.chart { background: url("missing.svg"); }');
  assert.equal((await runValidator(target)).code, 1);
});

test('rejects every extra iframe permission', async (context) => {
  const target = await fixture(context);
  for (const permission of ['allow-same-origin', 'allow-forms', 'allow-popups', 'allow-top-navigation', 'allow-downloads', 'unknown']) {
    await writeFile(path.join(target, 'content.html'), `<iframe title="Demo" sandbox="allow-scripts ${permission}"></iframe>`);
    const result = await runValidator(target);
    assert.equal(result.code, 1, permission);
    assert.ok(result.report.issues.some((issue) => issue.rule === 'iframe-permissions'));
  }
});

test('rejects hidden networking and inline executable parent content', async (context) => {
  const target = await fixture(context);
  await writeFile(path.join(target, 'content.html'), '<p onclick="alert(1)">Example</p><a href="javascript:alert(1)">Open</a>');
  await writeFile(path.join(target, 'app.js'), 'const endpoint = "https://example.test"; fetch(endpoint);');
  const result = await runValidator(target);
  const rules = new Set(result.report.issues.map((issue) => issue.rule));
  assert.ok(rules.has('parent-event-handler'));
  assert.ok(rules.has('nonlocal-reference'));
  assert.ok(rules.has('runtime-loading'));
});

test('rejects incomplete interactive evidence and metadata', async (context) => {
  const target = await fixture(context);
  await cp(path.join(root, 'design-portable-moodle-content/assets/interactive-demo'), target, { recursive: true });
  const indexPath = path.join(target, 'interactive/example/index.html');
  await writeFile(indexPath, '<h1>Demo</h1>');
  await writeFile(path.join(target, 'interactive/example/source.json'), '{}');
  await writeFile(path.join(target, 'content.html'), '<p>Static explanation</p>');
  const result = await runValidator(target);
  const rules = new Set(result.report.issues.map((issue) => issue.rule));
  for (const rule of ['content-security-policy', 'noscript-fallback', 'authoring-metadata', 'direct-demo-link']) assert.ok(rules.has(rule), rule);
});

test('rejects active objects and unsupported resource syntax', async (context) => {
  const target = await fixture(context);
  await writeFile(path.join(target, 'content.html'), '<object data="remote"></object><iframe title="Example" sandbox="allow-scripts" srcdoc="text"></iframe><img srcset="remote 2x">');
  const result = await runValidator(target);
  assert.ok(result.report.issues.some((issue) => issue.rule === 'active-document'));
  assert.ok(result.report.issues.some((issue) => issue.rule === 'unsupported-resource-syntax'));
});

async function fixture(context) {
  const target = await mkdtemp(path.join(os.tmpdir(), 'moodlia-portable-test-'));
  context.after(() => rm(target, { recursive: true, force: true }));
  return target;
}

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
