import demoConfig from '@/content/demo-config.json';
import { AppRuntime } from '@/components/app-runtime';
import { normalizeConfig } from '@/lib/config';
import { listRunsByOwner } from '@/lib/storage';

export default async function HomePage() {
  const normalized = normalizeConfig(demoConfig);
  const runs = await listRunsByOwner('demo-user');

  return <AppRuntime initialConfig={normalized.config} issues={normalized.issues} runs={runs} />;
}