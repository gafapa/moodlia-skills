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
    if (entry.isSymbolicLink()) {
      addIssue(entryPath, 'symbolic-link', 'Bundle real local files rather than symbolic links.');
      continue;
    }
    if (entry.isDirectory()) {
      collectedFiles.push(...collectFiles(entryPath));
    } else {
      collectedFiles.push(entryPath);
    }
  }
  return collectedFiles;
}

const checkedExtensions = new Set(['.html', '.htm', '.css', '.js', '.mjs', '.json', '.svg']);
const issues = [];
const allFiles = collectFiles(targetPath);
const fileSet = new Set(allFiles);
const files = allFiles.filter((filePath) => checkedExtensions.has(path.extname(filePath).toLowerCase()));
const parentPath = path.join(targetPath, 'content.html');
if (!fileSet.has(parentPath) || !fs.readFileSync(parentPath, 'utf8').trim()) {
  addIssue(parentPath, 'package-entrypoint', 'Provide a nonempty root content.html Moodle fragment.');
}

function addIssue(filePath, rule, message) {
  issues.push({
    file: path.relative(targetPath, filePath).replaceAll('\\', '/'),
    rule,
    message,
  });
}

// Inspect literal authoring paths only; this is not an HTML parser or a security boundary.
function readAttribute(tag, name) {
  const expression = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(expression);
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

function checkReference(filePath, reference, active = true) {
  if (reference === null) return;
  const value = reference.trim();
  if (!value || value.startsWith('#')) return;
  if (/&(?:#|[a-z])/i.test(value)) {
    addIssue(filePath, 'encoded-reference', 'Use literal resource paths without HTML entity encoding.');
    return;
  }
  if (/^(?:https?:|mailto:|tel:)/i.test(value) && !active) return;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|\/|\\)/i.test(value)) {
    addIssue(filePath, 'nonlocal-reference', 'Active resources must use local relative package paths.');
    return;
  }
  let localPath;
  try {
    localPath = decodeURIComponent(value.replace(/^@@PLUGINFILE@@\//, '').split(/[?#]/)[0]);
  } catch {
    addIssue(filePath, 'invalid-reference', 'Resource path has invalid percent encoding.');
    return;
  }
  const resolvedPath = path.resolve(path.dirname(filePath), localPath);
  const relativePath = path.relative(targetPath, resolvedPath);
  if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    addIssue(filePath, 'outside-package', 'Resource paths must stay inside the artifact directory.');
  } else if (!fileSet.has(resolvedPath)) {
    addIssue(filePath, 'missing-resource', `Local resource does not exist: ${value}`);
  }
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
  if ((extension === '.js' || extension === '.mjs') && /\b(?:fetch|WebSocket|EventSource|XMLHttpRequest|Worker|SharedWorker|importScripts)\s*\(|\bimport\s*(?:\(|[^;]*?\bfrom\s*['"])/.test(content)) {
    addIssue(filePath, 'runtime-loading', 'Keep these demonstrations self-contained; do not load runtime data, modules or workers.');
  }

  if (extension === '.css' && /(?:@import\s+|url\s*\()\s*['"]?https?:\/\//i.test(content)) {
    addIssue(filePath, 'remote-style-resource', 'Remote CSS imports and assets are not portable.');
  }
  if (extension === '.css' || extension === '.html' || extension === '.htm' || extension === '.svg') {
    if (/@import\b/i.test(content)) addIssue(filePath, 'css-import', 'Bundle styles directly without CSS imports.');
    for (const match of content.matchAll(/\burl\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/gi)) {
      checkReference(filePath, match[1] ?? match[2] ?? match[3]);
    }
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

    if (/<(?:object|embed|base|form)\b/i.test(content) || /\bhttp-equiv\s*=\s*['"]?refresh\b/i.test(content)) {
      addIssue(filePath, 'active-document', 'Do not embed objects, forms, base URLs or automatic redirects.');
    }
    for (const tagMatch of content.matchAll(/<[a-z][\w:-]*\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
      const tag = tagMatch[0];
      const name = tag.match(/^<([\w:-]+)/)[1].toLowerCase();
      checkReference(filePath, readAttribute(tag, 'src'));
      checkReference(filePath, readAttribute(tag, 'poster'));
      checkReference(filePath, readAttribute(tag, 'href'), name !== 'a');
      if (readAttribute(tag, 'srcset') !== null || readAttribute(tag, 'srcdoc') !== null) {
        addIssue(filePath, 'unsupported-resource-syntax', 'Use literal src paths rather than srcset or srcdoc.');
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
        if (tokens.some((token) => token !== 'allow-scripts')) {
          addIssue(filePath, 'iframe-permissions', 'The only permitted sandbox token is allow-scripts.');
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
  else {
    try {
      const metadata = JSON.parse(fs.readFileSync(path.join(directoryPath, 'source.json'), 'utf8'));
      if (metadata.schemaVersion !== 1 || !['type', 'title', 'learningObjective', 'language'].every((key) => typeof metadata[key] === 'string' && metadata[key].trim()) || typeof metadata.accessibility?.summary !== 'string' || !metadata.accessibility.summary.trim()) {
        addIssue(filePath, 'authoring-metadata', 'source.json needs schemaVersion 1, type, title, learningObjective, language and accessibility.summary.');
      }
    } catch {
      addIssue(filePath, 'authoring-metadata', 'source.json must contain valid authoring metadata JSON.');
    }
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const policyTag = [...content.matchAll(/<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)].map((match) => match[0]).find((tag) => readAttribute(tag, 'http-equiv')?.toLowerCase() === 'content-security-policy');
  const policy = policyTag ? readAttribute(policyTag, 'content') ?? '' : '';
  const directives = new Map(policy.split(';').map((directive) => directive.trim().split(/\s+/)).filter(([name]) => name).map(([name, ...values]) => [name.toLowerCase(), values.join(' ')]));
  if (!['default-src', 'connect-src', 'object-src', 'base-uri', 'form-action'].every((name) => directives.get(name) === "'none'") || !['script-src', 'style-src'].every((name) => directives.get(name) === "'self'" || directives.get(name) === "'none'")) {
    addIssue(filePath, 'content-security-policy', 'Use a restrictive CSP: default/connect/object/base/form none and local scripts/styles only.');
  }
  if (!/<noscript\b/i.test(content)) addIssue(filePath, 'noscript-fallback', 'Provide an explanation inside noscript.');
  const parent = fileSet.has(parentPath) ? fs.readFileSync(parentPath, 'utf8') : '';
  const localIndex = path.relative(targetPath, filePath).replaceAll('\\', '/');
  if (![...parent.matchAll(/<a\b[^>]*>/gi)].some((match) => readAttribute(match[0], 'href') === `@@PLUGINFILE@@/${localIndex}`)) {
    addIssue(parentPath, 'direct-demo-link', 'Provide a direct PLUGINFILE link to each interactive index.html.');
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
