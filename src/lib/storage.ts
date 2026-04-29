import type { AppConfig } from '@/lib/config';
import { prisma } from '@/lib/prisma';

export type GeneratedRun = {
  id: string;
  title: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  status: 'draft' | 'live';
  config: AppConfig;
};

const runs: GeneratedRun[] = [
  {
    id: 'run-1',
    title: 'Operations dashboard',
    slug: 'ops-dashboard',
    ownerId: 'demo-user',
    createdAt: new Date().toISOString(),
    status: 'live',
    config: {
      slug: 'ops-dashboard',
      title: 'Operations dashboard',
      subtitle: 'Internal tooling for dispatch teams',
      theme: { accent: '#2563eb', accentSecondary: '#f59e0b', surface: '#f7f4ee' },
      metrics: [],
      forms: [],
      tables: [],
      sections: [],
      auth: { mode: 'email-password', methods: ['password'] }
    }
  }
];

function canUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function parseStoredConfig(raw: string) {
  try {
    return JSON.parse(raw) as { ownerId?: string; status?: GeneratedRun['status']; config?: AppConfig };
  } catch {
    return {};
  }
}

export async function listRunsByOwner(ownerId: string) {
  if (!canUseDatabase()) {
    return runs.filter((run) => run.ownerId === ownerId);
  }

  try {
    const dbRuns = await prisma.workspaceRun.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return dbRuns
      .map((item) => {
        const parsed = parseStoredConfig(item.configJson);
        if (!parsed.config) {
          return null;
        }

        return {
          id: item.id,
          title: item.title,
          slug: item.slug,
          ownerId: parsed.ownerId ?? 'demo-user',
          createdAt: item.createdAt.toISOString(),
          status: parsed.status ?? 'draft',
          config: parsed.config
        } satisfies GeneratedRun;
      })
      .filter((run): run is GeneratedRun => Boolean(run))
      .filter((run) => run.ownerId === ownerId);
  } catch {
    return runs.filter((run) => run.ownerId === ownerId);
  }
}

export async function createRun(run: GeneratedRun) {
  if (!canUseDatabase()) {
    runs.unshift(run);
    return run;
  }

  try {
    const saved = await prisma.workspaceRun.create({
      data: {
        title: run.title,
        slug: `${run.slug}-${Date.now()}`,
        configJson: JSON.stringify({
          ownerId: run.ownerId,
          status: run.status,
          config: run.config
        })
      }
    });

    return {
      id: saved.id,
      title: saved.title,
      slug: saved.slug,
      ownerId: run.ownerId,
      createdAt: saved.createdAt.toISOString(),
      status: run.status,
      config: run.config
    };
  } catch {
    runs.unshift(run);
    return run;
  }
}

export async function getRun(id: string) {
  if (!canUseDatabase()) {
    return runs.find((run) => run.id === id) || null;
  }

  try {
    const dbRun = await prisma.workspaceRun.findUnique({
      where: { id }
    });

    if (!dbRun) return null;

    const parsed = parseStoredConfig(dbRun.configJson);
    if (!parsed.config) return null;

    return {
      id: dbRun.id,
      title: dbRun.title,
      slug: dbRun.slug,
      ownerId: parsed.ownerId ?? 'demo-user',
      createdAt: dbRun.createdAt.toISOString(),
      status: parsed.status ?? 'draft',
      config: parsed.config
    } satisfies GeneratedRun;
  } catch {
    return runs.find((run) => run.id === id) || null;
  }
}

export async function updateRun(id: string, updates: { title?: string; status?: GeneratedRun['status'] }) {
  if (!canUseDatabase()) {
    const index = runs.findIndex((run) => run.id === id);
    if (index === -1) return null;
    runs[index] = { ...runs[index], ...updates };
    return runs[index];
  }

  try {
    const dbRun = await prisma.workspaceRun.findUnique({
      where: { id }
    });

    if (!dbRun) return null;

    const parsed = parseStoredConfig(dbRun.configJson);
    const updated = await prisma.workspaceRun.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title }),
        configJson: JSON.stringify({
          ownerId: parsed.ownerId ?? 'demo-user',
          status: updates.status ?? parsed.status ?? 'draft',
          config: parsed.config
        })
      }
    });

    return {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      ownerId: parsed.ownerId ?? 'demo-user',
      createdAt: updated.createdAt.toISOString(),
      status: updates.status ?? parsed.status ?? 'draft',
      config: parsed.config
    };
  } catch {
    const index = runs.findIndex((run) => run.id === id);
    if (index === -1) return null;
    runs[index] = { ...runs[index], ...updates };
    return runs[index];
  }
}

export async function deleteRun(id: string) {
  if (!canUseDatabase()) {
    const index = runs.findIndex((run) => run.id === id);
    if (index === -1) return false;
    runs.splice(index, 1);
    return true;
  }

  try {
    await prisma.workspaceRun.delete({
      where: { id }
    });
    return true;
  } catch {
    const index = runs.findIndex((run) => run.id === id);
    if (index === -1) return false;
    runs.splice(index, 1);
    return true;
  }
}