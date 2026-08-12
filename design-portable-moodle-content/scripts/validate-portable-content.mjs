#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const inputArguments = process.argv.slice(2);
const jsonOutput = inputArguments.includes('--json');
const targetArgument = inputArguments.find((argument) => argument !== '--json');

if (!targetArgument) {
  console.error('Usage: node validate-portable-content.mjs <artifact-directory> [--json]');
  process.exit(2);
}

const targetPath = path.resolve(targetArgument);
if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isDirectory()) {
  console.error(`Artifact directory not found: ${targetPath}`);
  process.exit(2);
}

function collectFiles(directoryPath) {
  const collectedFiles = [];
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      collectedFiles.push(...collectFiles(entryPath));
    } else {
      collectedFiles.push(entryPath);
    }
  }
  return collectedFiles;
}

const checkedExtensions = new Set(['.html', '.htm', '.css', '.js', '.mjs', '.json', '.svg']);
const files = collectFiles(targetPath).filter((filePath) => checkedExtensions.has(path.extname(filePath).toLowerCase()));
const issues = [];

function addIssue(filePath, rule, message) {
  issues.push({
    file: path.relative(targetPath, filePath).replaceAll('\\', '/'),
    rule,
    message,
  });
}

for (const filePath of files) {
  const extension = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf8');

  if (/local_moodlia|\[\[\s*moodlia|data-moodlia-demo|moodlia\.example|localhost/i.test(content)) {
    addIssue(filePath, 'runtime-dependency', 'Remove MoodlIA, shortcode, placeholder, or local authoring-server dependencies.');
  }

  if (/\beval\s*\(|\bnew\s+Function\s*\(/.test(content)) {
    addIssue(filePath, 'dynamic-code', 'Dynamic code execution is not allowed.');
  }

  if (/\b(?:fetch|WebSocket|EventSource)\s*\(\s*['"]https?:\/\//i.test(content)) {
    addIssue(filePath, 'remote-network', 'Remote runtime network requests are not portable.');
  }

  if (extension === '.css' && /(?:@import\s+|url\s*\()\s*['"]?https?:\/\//i.test(content)) {
    addIssue(filePath, 'remote-style-resource', 'Remote CSS imports and assets are not portable.');
  }

  if (extension === '.html' || extension === '.htm') {
    const activeRemoteResource = /<(?:script|iframe|img|audio|video|source|track)\b[^>]*\bsrc\s*=\s*['"]https?:\/\//i;
    const remoteStylesheet = /<link\b[^>]*\bhref\s*=\s*['"]https?:\/\//i;
    if (activeRemoteResource.test(content) || remoteStylesheet.test(content)) {
      addIssue(filePath, 'remote-active-resource', 'Bundle executable and media resources locally.');
    }

    if (path.basename(filePath).toLowerCase() === 'content.html') {
      if (/<script\b/i.test(content)) {
        addIssue(filePath, 'parent-script', 'The parent Moodle fragment must not contain script elements.');
      }
      if (/\son[a-z]+\s*=/i.test(content)) {
        addIssue(filePath, 'parent-event-handler', 'The parent Moodle fragment must not contain event-handler attributes.');
      }
    }

    for (const iframeMatch of content.matchAll(/<iframe\b([^>]*)>/gi)) {
      const attributes = iframeMatch[1];
      const sandboxMatch = attributes.match(/\bsandbox\s*=\s*['"]([^'"]*)['"]/i);
      if (!sandboxMatch) {
        addIssue(filePath, 'iframe-sandbox', 'Every iframe must have a sandbox attribute.');
      } else {
        const tokens = sandboxMatch[1].trim().split(/\s+/).filter(Boolean);
        if (!tokens.includes('allow-scripts')) {
          addIssue(filePath, 'iframe-scripts', 'Interactive iframes must explicitly use allow-scripts.');
        }
        if (tokens.includes('allow-same-origin')) {
          addIssue(filePath, 'iframe-origin', 'Do not combine portable Moodle content with allow-same-origin.');
        }
      }
      if (!/\btitle\s*=\s*['"][^'"]+['"]/i.test(attributes)) {
        addIssue(filePath, 'iframe-title', 'Every iframe must have a descriptive title.');
      }
    }
  }
}

for (const filePath of files.filter((candidate) => path.basename(candidate).toLowerCase() === 'index.html')) {
  const relativePath = path.relative(targetPath, filePath).replaceAll('\\', '/');
  if (!/(^|\/)(interactive|demos?)\//i.test(relativePath)) {
    continue;
  }
  const directoryPath = path.dirname(filePath);
  const siblingNames = new Set(fs.readdirSync(directoryPath).map((name) => name.toLowerCase()));
  const hasFallback = [...siblingNames].some((name) => /^fallback\.(svg|png|jpe?g|webp)$/.test(name));
  if (!hasFallback) {
    addIssue(filePath, 'static-fallback', 'Interactive packages must include a fallback image.');
  }
  if (!siblingNames.has('source.json')) {
    addIssue(filePath, 'authoring-source', 'Interactive packages must include source.json for future editing.');
  }
}

const report = {
  valid: issues.length === 0,
  target: targetPath,
  checkedFiles: files.length,
  issues,
};

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else if (report.valid) {
  console.log(`Portable content validation passed (${report.checkedFiles} files checked).`);
} else {
  console.error(`Portable content validation failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`- ${issue.file}: [${issue.rule}] ${issue.message}`);
  }
}

process.exit(report.valid ? 0 : 1);
