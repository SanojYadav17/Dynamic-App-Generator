import { readdir } from 'node:fs/promises';
import path from 'node:path';

const INCLUDED_ROOTS = ['src', 'prisma', 'package.json', 'README.md', 'next.config.mjs', 'tsconfig.json'];
const EXCLUDED_DIRS = new Set(['node_modules', '.next', '.git']);
const MAX_DEPTH = 4;
const MAX_ENTRIES = 500;

type TreeNode = {
  name: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
};

async function readTree(absolutePath: string, depth: number, entryCounter: { value: number }): Promise<TreeNode[]> {
  if (depth > MAX_DEPTH || entryCounter.value >= MAX_ENTRIES) {
    return [];
  }

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (entryCounter.value >= MAX_ENTRIES) {
      break;
    }

    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }

    entryCounter.value += 1;
    const nodePath = path.join(absolutePath, entry.name);
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        type: 'directory',
        children: await readTree(nodePath, depth + 1, entryCounter)
      });
    } else {
      nodes.push({
        name: entry.name,
        type: 'file'
      });
    }
  }

  return nodes.sort((a, b) => a.name.localeCompare(b.name));
}

function flattenTree(nodes: TreeNode[], prefix = ''): string[] {
  const lines: string[] = [];
  for (const node of nodes) {
    const current = prefix ? `${prefix}/${node.name}` : node.name;
    lines.push(current);
    if (node.children) {
      lines.push(...flattenTree(node.children, current));
    }
  }
  return lines;
}

export async function buildGithubExportPayload() {
  const root = process.cwd();
  const counter = { value: 0 };
  const structure: TreeNode[] = [];

  for (const entry of INCLUDED_ROOTS) {
    const absolute = path.join(root, entry);
    try {
      const statEntries = await readTree(absolute, 1, counter);
      if (statEntries.length > 0) {
        structure.push({ name: entry, type: 'directory', children: statEntries });
      } else {
        structure.push({ name: entry, type: 'file' });
      }
    } catch {
      // Skip missing entries to keep export resilient.
    }
  }

  const flattened = flattenTree(structure);

  return {
    generatedAt: new Date().toISOString(),
    includedRoots: INCLUDED_ROOTS,
    fileCount: flattened.length,
    structure,
    pushGuide: [
      'git init',
      'git add .',
      'git commit -m "feat: export generated app"',
      'git remote add origin <github-repo-url>',
      'git push -u origin main'
    ]
  };
}
