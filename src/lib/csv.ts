export function parseCsv(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [] as Record<string, string>[];
  }

  const headers = splitCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (const line of lines.slice(1)) {
    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? '']));
    rows.push(row);
  }

  return rows;
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}