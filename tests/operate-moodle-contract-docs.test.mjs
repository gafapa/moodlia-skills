import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillPath = path.join(root, 'operate-moodle-with-moodlia', 'SKILL.md');
const transportPath = path.join(
  root,
  'operate-moodle-with-moodlia',
  'references',
  'transport-and-contract.md'
);
const publishingPath = path.join(
  root,
  'operate-moodle-with-moodlia',
  'references',
  'publishing-workflows.md'
);
const synchronizationPath = path.join(
  root,
  'operate-moodle-with-moodlia',
  'references',
  'synchronization.md'
);

test('documents current MCP negotiation and CLI entry point', async () => {
  const transport = await readFile(transportPath, 'utf8');

  assert.match(transport, /stateless `2026-07-28`/);
  assert.match(transport, /legacy `initialize`/);
  assert.match(transport, /node cli\/moodlia\.mjs/);
  assert.doesNotMatch(transport, /node cli\/moodle-mcp\.mjs/);
});

test('documents local file uploads without a MoodlIA size cap', async () => {
  const [skill, transport] = await Promise.all([
    readFile(skillPath, 'utf8'),
    readFile(transportPath, 'utf8')
  ]);

  assert.match(skill, /--upload-file <path>/);
  assert.match(skill, /streams multipart data/);
  assert.match(transport, /--upload-file <path>/);
  assert.match(transport, /\/webservice\/upload\.php/);
  assert.match(transport, /returned draft item id/);
  assert.doesNotMatch(transport, /reads and base64-encodes/);
  assert.match(transport, /does not impose a\s+client-side file-size cap/);
  assert.match(transport, /Moodle's effective upload allowance is authoritative/);
});

test('preserves File resource identity during replacement', async () => {
  const [skill, publishing] = await Promise.all([
    readFile(skillPath, 'utf8'),
    readFile(publishingPath, 'utf8')
  ]);

  assert.match(skill, /Replace a File resource through `update_resource`/);
  assert.match(publishing, /Do not delete and recreate a File resource/);
  assert.match(publishing, /course-module identifier, and instance identifier/);
});

test('distinguishes shared and quiz-private question banks', async () => {
  const [skill, publishing] = await Promise.all([
    readFile(skillPath, 'utf8'),
    readFile(publishingPath, 'utf8')
  ]);

  assert.match(skill, /bank_scope=course_shared/);
  assert.match(skill, /not a reason to fall back to `quiz_private`/);
  assert.match(publishing, /MoodlIA can provision the course `qbank` activity/);
  assert.match(publishing, /different ownership and reuse semantics/);
});

test('documents adaptive synchronization approval and recovery boundaries', async () => {
  const [skill, synchronization] = await Promise.all([
    readFile(skillPath, 'utf8'),
    readFile(synchronizationPath, 'utf8')
  ]);

  assert.match(skill, /references\/synchronization\.md/);
  assert.match(skill, /Prefer `moodlia` for adaptive operation/);
  assert.match(synchronization, /`moodle-core` is a Core-only foundation and intentionally has no MCP server/);
  assert.match(synchronization, /Approve the exact plan digest outside an MCP model call/);
  assert.match(synchronization, /`unknown_outcome`/);
  assert.match(synchronization, /moodlia-sync-mcp/);
  assert.match(synchronization, /does not need one MCP tool per synchronized entity/);
  assert.match(synchronization, /root manual grade items/);
  assert.match(synchronization, /Numeric Moodle IDs are site-scoped/);
});
