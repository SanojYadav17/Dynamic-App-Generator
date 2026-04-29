import { z } from 'zod';
import { buildGithubExportPayload } from '@/lib/github-export';

const payloadSchema = z.object({
  repositoryUrl: z.string().url().optional(),
  branch: z.string().min(1).optional()
});

export async function GET() {
  const payload = await buildGithubExportPayload();
  return Response.json(payload);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid GitHub export payload.' }, { status: 400 });
  }

  const payload = await buildGithubExportPayload();
  return Response.json({
    ...payload,
    repositoryUrl: parsed.data.repositoryUrl ?? null,
    branch: parsed.data.branch ?? 'main',
    pushPrepared: Boolean(parsed.data.repositoryUrl),
    message: parsed.data.repositoryUrl
      ? 'Repository structure generated and push commands prepared.'
      : 'Repository structure generated. Provide repositoryUrl to prepare push target metadata.'
  });
}
