import demoConfig from '@/content/demo-config.json';
import { normalizeConfig } from '@/lib/config';
import { listResources } from '@/lib/runtime-catalog';

export async function GET() {
  const normalized = normalizeConfig(demoConfig);
  return Response.json({ ...normalized, resources: listResources() });
}