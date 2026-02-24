const fs = require('node:fs');
const path = require('node:path');

const TEXT_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.css',
  '.html',
  '.md',
  '.mdx',
]);

const SCANABLE_DIR_BLACKLIST = new Set([
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
  'public',
]);

const SIMPLE_CLASS_ALLOWLIST = new Set([
  'absolute',
  'antialiased',
  'block',
  'border',
  'container',
  'fixed',
  'flex',
  'grid',
  'hidden',
  'inline',
  'inline-flex',
  'relative',
  'sr-only',
  'sticky',
]);

const toPosix = (value) => value.split(path.sep).join('/');

const hasWildcard = (pattern) => /[*?{[]/.test(pattern);

const expandBraces = (pattern) => {
  const start = pattern.indexOf('{');
  const end = pattern.indexOf('}');
  if (start === -1 || end === -1 || end < start) return [pattern];
  const head = pattern.slice(0, start);
  const tail = pattern.slice(end + 1);
  return pattern
    .slice(start + 1, end)
    .split(',')
    .flatMap((segment) => expandBraces(`${head}${segment}${tail}`));
};

const escapeRegex = (value) => value.replace(/[.+^${}()|[\]\\]/g, '\\$&');

const globToRegex = (glob) => {
  let source = '^';

  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];

    if (char === '*') {
      const next = glob[i + 1];
      if (next === '*') {
        source += '.*';
        i += 1;
      } else {
        source += '[^/]*';
      }
      continue;
    }

    if (char === '?') {
      source += '.';
      continue;
    }

    source += escapeRegex(char);
  }

  source += '$';
  return new RegExp(source);
};

const getStaticPrefix = (pattern) => {
  const index = pattern.search(/[*?{[]/);
  if (index === -1) return pattern;
  return pattern.slice(0, index);
};

const walkFiles = (directory, files) => {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.storybook') continue;

    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (SCANABLE_DIR_BLACKLIST.has(entry.name)) continue;
      walkFiles(absolutePath, files);
      continue;
    }

    files.push(absolutePath);
  }
};

const collectMatches = (base, pattern) => {
  const normalizedPattern = toPosix(pattern || '**/*');
  const staticPrefix = getStaticPrefix(normalizedPattern);
  const root = path.resolve(base, staticPrefix || '.');

  const allFiles = [];
  walkFiles(root, allFiles);

  const expandedPatterns = expandBraces(normalizedPattern).map((item) => globToRegex(item));

  return allFiles.filter((file) => {
    const relativePath = toPosix(path.relative(path.resolve(base), file));
    return expandedPatterns.some((regex) => regex.test(relativePath));
  });
};

const extractCandidates = (content) => {
  const matches = new Set();

  const attributeRegex = /class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g;
  let attributeMatch = attributeRegex.exec(content);
  while (attributeMatch) {
    const value = attributeMatch[1] || attributeMatch[2] || attributeMatch[3] || '';
    for (const token of value.split(/\s+/)) {
      if (token) matches.add(token.trim());
    }
    attributeMatch = attributeRegex.exec(content);
  }

  const looseTokenRegex = /[A-Za-z0-9_:\/\-\[\]\.()%!]+/g;
  let tokenMatch = looseTokenRegex.exec(content);
  while (tokenMatch) {
    const token = tokenMatch[0];

    if (!token || token.length > 96) {
      tokenMatch = looseTokenRegex.exec(content);
      continue;
    }

    const isLikelyClass =
      SIMPLE_CLASS_ALLOWLIST.has(token) ||
      (token === token.toLowerCase() && /[-:\[\]\/]/.test(token));

    if (isLikelyClass) matches.add(token);
    tokenMatch = looseTokenRegex.exec(content);
  }

  return matches;
};

class Scanner {
  constructor(options = {}) {
    const sources = Array.isArray(options.sources) ? options.sources : [];
    this.sources = sources;
    this.files = [];
    this.globs = sources
      .filter((source) => source && source.pattern)
      .map((source) => ({ base: source.base, pattern: source.pattern }));
  }

  scan() {
    const selectedFiles = new Set();

    for (const source of this.sources) {
      if (!source || !source.base || !source.pattern) continue;

      const matches = collectMatches(source.base, source.pattern);

      if (source.negated) {
        for (const file of matches) selectedFiles.delete(file);
      } else {
        for (const file of matches) selectedFiles.add(file);
      }
    }

    this.files = Array.from(selectedFiles);

    const candidates = new Set();

    for (const file of this.files) {
      const extension = path.extname(file);
      if (!TEXT_EXTENSIONS.has(extension)) continue;

      let content;
      try {
        const stats = fs.statSync(file);
        if (stats.size > 1_200_000) continue;
        content = fs.readFileSync(file, 'utf8');
      } catch {
        continue;
      }

      const extracted = extractCandidates(content);
      for (const token of extracted) candidates.add(token);
    }

    return Array.from(candidates);
  }
}

module.exports = {
  Scanner,
};
