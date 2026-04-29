import demoConfig from '@/content/demo-config.json';

type CatalogResource = {
  id: string;
  columns: string[];
  rows: Record<string, string>[];
};

const catalog = new Map<string, CatalogResource>();

for (const table of demoConfig.tables) {
  catalog.set(table.id, {
    id: table.id,
    columns: table.columns.map((column) => column.key),
    rows: table.rows.map((row) =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value)]))
    )
  });
}

export function listResources() {
  return Array.from(catalog.values()).map((resource) => ({
    id: resource.id,
    columns: resource.columns,
    rowCount: resource.rows.length
  }));
}

export function getResource(resourceId: string) {
  return catalog.get(resourceId);
}

export function addRows(resourceId: string, rows: Record<string, string>[]) {
  const resource = catalog.get(resourceId);
  if (!resource) {
    return null;
  }

  const normalizedRows = rows.map((row) => {
    const next: Record<string, string> = {};

    for (const column of resource.columns) {
      next[column] = String(row[column] ?? '');
    }

    for (const [key, value] of Object.entries(row)) {
      if (!(key in next)) {
        next[key] = String(value);
      }
    }

    return next;
  });

  resource.rows.unshift(...normalizedRows);
  return resource;
}