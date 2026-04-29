import { z } from 'zod';
import { parseCsv } from '@/lib/csv';
import { addRows } from '@/lib/runtime-catalog';

const payloadSchema = z.object({
  resource: z.string().min(1),
  csv: z.string().min(1)
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid CSV import payload.' }, { status: 400 });
  }

  const rows = parseCsv(parsed.data.csv);
  if (rows.length === 0) {
    return Response.json({ error: 'CSV has no data rows.' }, { status: 400 });
  }

  const updated = addRows(parsed.data.resource, rows);
  if (!updated) {
    return Response.json({ error: `Unknown resource: ${parsed.data.resource}` }, { status: 404 });
  }

  return Response.json({
    imported: rows.length,
    resource: updated.id,
    rowCount: updated.rows.length
  });
}