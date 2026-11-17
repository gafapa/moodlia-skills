// Every MoodlIA operation, CLI command and call parameter named in the skills must
// exist in the published plugin contract, so the skills cannot drift from the API.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

// The package does not export its contract, so read it from the installed files.
const contract = JSON.parse(readFileSync(new URL('../node_modules/moodlia/contract/operations.json', import.meta.url), 'utf8'));
const operations = new Map((contract.operations ?? contract).map((operation) => [operation.name, operation]));
const verbs = new Set([...operations.keys()].map((name) => name.split('_')[0]));
const parameterNames = new Set([...operations.values()].flatMap((operation) => Object.keys(operation.parameters ?? {})));

const skillDirectories = ['operate-moodle-with-moodlia', 'design-portable-moodle-content'];

function markdownFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return entry === 'assets' ? [] : markdownFiles(path);
    return entry.endsWith('.md') ? [path] : [];
  });
}

const sources = skillDirectories.flatMap(markdownFiles).map((path) => ({ path, text: readFileSync(path, 'utf8') }));

// A snake_case code span whose first word is an operation verb and which is not a
// parameter name refers to an operation.
function isOperationReference(name) {
  return /^[a-z]+(?:_[a-z0-9]+)+$/.test(name) && verbs.has(name.split('_')[0]) && !parameterNames.has(name);
}

test('the contract dependency is the 255-operation release', () => {
  assert.equal(operations.size, 255);
});

test('every operation named in a skill exists in the contract', () => {
  const missing = [];
  for (const { path, text } of sources) {
    for (const [, name] of text.matchAll(/`([a-z][a-z0-9_]*)(?:\([^`]*\))?`/g)) {
      if (isOperationReference(name) && !operations.has(name)) missing.push(`${path}: ${name}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('every parameter shown in an operation call exists for that operation', () => {
  const wrong = [];
  for (const { path, text } of sources) {
    for (const [, name, args] of text.matchAll(/`([a-z][a-z0-9_]*)\(([^`)]*)\)`/g)) {
      const operation = operations.get(name);
      if (!operation) continue;
      for (const argument of args.split(',').map((value) => value.trim()).filter(Boolean)) {
        if (!(argument in (operation.parameters ?? {}))) wrong.push(`${path}: ${name}(${argument})`);
      }
    }
  }
  assert.deepEqual(wrong, []);
});

test('every CLI plugin command named in a skill maps to an operation', () => {
  const missing = [];
  for (const { path, text } of sources) {
    const commands = [
      ...[...text.matchAll(/moodlia plugin ([a-z][a-z0-9-]*)/g)].map((match) => match[1]),
      ...[...text.matchAll(/`([a-z]+(?:-[a-z0-9]+)+)`/g)].map((match) => match[1]).filter((name) => verbs.has(name.split('-')[0])),
    ];
    for (const command of commands) {
      if (!operations.has(command.replaceAll('-', '_'))) missing.push(`${path}: ${command}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('each skill declares a name and a usage description', () => {
  for (const directory of skillDirectories) {
    const skill = readFileSync(join(directory, 'SKILL.md'), 'utf8').replaceAll('\r\n', '\n');
    assert.match(skill, new RegExp(`^---\\nname: ${directory}\\ndescription: .{80,}\\n---`, 'u'), directory);
  }
});
