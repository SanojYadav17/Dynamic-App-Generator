import { z } from 'zod';
import { addRows, getResource } from '@/lib/runtime-catalog';

type RouteContext = {
  params: Promise<{ resource: string }>;
};

const payloadSchema = z.object({
  row: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
});

export async function GET(_request: Request, context: RouteContext) {
  const { resource } = await context.params;
  const found = getResource(resource);

  if (!found) {
    return Response.json({ error: `Unknown resource: ${resource}` }, { status: 404 });
  }

  return Response.json({ resource: found });
}

export async function POST(request: Request, context: RouteContext) {
  const { resource } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid row payload.' }, { status: 400 });
  }

  const row = Object.fromEntries(
    Object.entries(parsed.data.row).map(([key, value]) => [key, value == null ? '' : String(value)])
  );

  const updated = addRows(resource, [row]);
  if (!updated) {
    return Response.json({ error: `Unknown resource: ${resource}` }, { status: 404 });
  }

  return Response.json(updated, { status: 201 });
}