import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'figures.json');

function normalizeFigure(row, index) {
  return {
    id: String(row.id || '').trim(),
    name: String(row.name || '').trim(),
    description: String(row.description || '').trim(),
    image:
      row.image == null || row.image === ''
        ? null
        : String(row.image).trim(),
    sortOrder:
      typeof row.sortOrder === 'number' ? row.sortOrder : index,
  };
}

export async function readFigures() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeFigure);
}

export async function writeFigures(figures) {
  const normalized = figures.map(normalizeFigure);
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(
    DATA_FILE,
    `${JSON.stringify(normalized, null, 2)}\n`,
    'utf8'
  );
}

export function sortFigures(list) {
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function toPublicFigure(f) {
  return {
    id: f.id,
    name: f.name,
    description: f.description,
    image: f.image,
    sortOrder: f.sortOrder ?? 0,
  };
}
