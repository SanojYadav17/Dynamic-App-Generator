import demoConfig from '@/content/demo-config.json';
import { normalizeConfig } from '@/lib/config';
import { buildDatabaseBlueprint } from '@/lib/database-blueprint';

export async function GET() {
  const { config, issues } = normalizeConfig(demoConfig);
  const blueprint = buildDatabaseBlueprint(config);

  return Response.json({
    blueprint: {
      provider: blueprint.provider,
      tables: blueprint.tables,
      sqlPreview: blueprint.sqlPreview,
      issues: [...issues, ...blueprint.issues]
    }
  });
}
