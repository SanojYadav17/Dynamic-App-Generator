import type { AppConfig } from '@/lib/config';

type BlueprintTable = {
  table: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    unique: boolean;
  }>;
};

type BlueprintResult = {
  provider: string;
  tables: BlueprintTable[];
  issues: string[];
  sqlPreview: string[];
};

// SQL_TYPE_MAP kept for future use when database generation is enhanced
// const SQL_TYPE_MAP: Record<string, string> = {
//   string: 'TEXT',
//   number: 'INTEGER',
//   boolean: 'BOOLEAN',
//   datetime: 'TIMESTAMP',
//   json: 'JSONB'
// };

function toSnakeCase(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function buildDatabaseBlueprint(config: AppConfig): BlueprintResult {
  const issues: string[] = [];
  const tables: BlueprintTable[] = [];
  const sqlPreview: string[] = [];
  const seenTables = new Set<string>();

  // Config doesn't have database property - database is defined in Prisma schema
  // This function is for future database generation features
  if (!config.tables || config.tables.length === 0) {
    return {
      provider: 'postgresql',
      tables: [],
      issues: ['No tables defined in configuration'],
      sqlPreview: []
    };
  }

  for (const table of config.tables || []) {
    const normalizedTable = toSnakeCase(table.title || table.id);
    if (!normalizedTable) {
      issues.push('Skipped table with invalid name.');
      continue;
    }

    if (seenTables.has(normalizedTable)) {
      issues.push(`Duplicate table name ignored: ${normalizedTable}`);
      continue;
    }
    seenTables.add(normalizedTable);

    // Tables in config have 'columns' not 'fields'
    const columns = (table as { columns?: Array<{ key: string; label: string }> }).columns;
    const fields = columns
      ? columns.map((col) => ({
          name: toSnakeCase(col.key || col.label),
          type: 'TEXT',
          required: false,
          unique: false
        }))
      : [];

    const effectiveFields =
      fields.length > 0
        ? fields
        : [{ name: 'notes', type: 'TEXT', required: false, unique: false }];

    tables.push({
      table: normalizedTable,
      fields: effectiveFields
    });
  }

  if (tables.length === 0) {
    issues.push('No valid database tables found in config. Added fallback table.');
    tables.push({
      table: 'generated_records',
      fields: [{ name: 'payload', type: 'JSONB', required: false, unique: false }]
    });
  }

  for (const table of tables) {
    const fieldSql = table.fields.map((field) => {
      const required = field.required ? ' NOT NULL' : '';
      const unique = field.unique ? ' UNIQUE' : '';
      return `  ${field.name} ${field.type}${required}${unique}`;
    });
    const createTableSql = [
      `CREATE TABLE IF NOT EXISTS ${table.table} (`,
      '  id TEXT PRIMARY KEY,',
      ...fieldSql.map((line, index) => `${line}${index === fieldSql.length - 1 ? '' : ','}`),
      ');'
    ].join('\n');
    sqlPreview.push(createTableSql);
  }

  return {
    provider: 'postgresql',
    tables,
    issues,
    sqlPreview
  };
}
