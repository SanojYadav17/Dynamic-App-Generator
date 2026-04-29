import { createRun, listRunsByOwner } from '@/lib/storage';
import { normalizeConfig } from '@/lib/config';
import demoConfig from '@/content/demo-config.json';
import { emitNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  const ownerId = request.headers.get('x-owner-id') ?? request.headers.get('x-user-id') ?? 'demo-user';
  const runs = await listRunsByOwner(ownerId);
  return Response.json({ runs });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const normalized = normalizeConfig(payload.config ?? demoConfig);
  const ownerId = String(payload.ownerId ?? 'demo-user');
  const run = await createRun({
    id: crypto.randomUUID(),
    title: String(payload.title ?? normalized.config.title),
    slug: String(payload.slug ?? normalized.config.slug),
    ownerId,
    createdAt: new Date().toISOString(),
    status: 'draft',
    config: normalized.config
  });

  emitNotification({
    type: 'runtime.run.created',
    level: 'info',
    message: `Generated run ${run.slug}`,
    actor: ownerId
  });

  return Response.json({ run, issues: normalized.issues }, { status: 201 });
}