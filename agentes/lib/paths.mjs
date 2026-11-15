import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fs.realpathSync(fileURLToPath(new URL('../', import.meta.url)));

export function inside(root, target) {
  const rel = path.relative(root, target);
  return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`));
}

// Rutas de manifiestos portables; no acepta escapes, ADS de Windows ni enlaces.
export function safePath(root, relative, { mustExist = true } = {}) {
  if (typeof relative !== 'string' || !relative || /[\\:\x00]/u.test(relative) ||
      path.isAbsolute(relative) || relative.split('/').some(p => !p || p === '.' || p === '..' ||
        /[.\s]$/u.test(p) || /[<>"|?*\x00-\x1f]/u.test(p) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(p))) {
    throw new Error(`Ruta relativa no permitida: ${String(relative)}`);
  }
  const base = fs.realpathSync(root);
  const target = path.resolve(base, ...relative.split('/'));
  if (!inside(base, target)) throw new Error('Ruta fuera de la raíz');
  let current = base;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) {
      // existsSync no detecta enlaces rotos.
      try {
        if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Enlace simbólico no permitido');
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (mustExist) throw new Error(`No existe: ${relative}`);
      continue;
    }
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Enlace no permitido: ${relative}`);
    if (!inside(base, fs.realpathSync(current))) throw new Error('Destino fuera de la raíz');
  }
  return target;
}

export function walk(root, relative = '', skip = new Set(['generated', '.test-tmp', 'node_modules', '.git'])) {
  const directory = relative ? safePath(root, relative) : root;
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (skip.has(entry.name)) return [];
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Enlace no permitido: ${rel}`);
    return entry.isDirectory() ? walk(root, rel, skip) : [rel];
  }).sort();
}
