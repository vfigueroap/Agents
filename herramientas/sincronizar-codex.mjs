import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createApp } from './agentes.mjs';

const header = '# Generado desde .agents/equipo.json; no editar.';

export function syncCodex(projectRoot, { check = false } = {}) {
  const root = fs.realpathSync(projectRoot);
  const expected = new Map();
  for (const area of createApp(root).teams()) {
    for (const role of area.roles) {
      const instructions = [
        `Rol: ${role.id} (${role.nombre}). Área: ${area.nombre}.`,
        role.instrucciones,
        `Instrucciones del área: ${area.directorio}/AGENTS.md. Las rutas son relativas a la raíz del proyecto.`,
        `Skills disponibles para este rol; lee solo las pertinentes:\n${role.skills.map(skill => `- ${skill}`).join('\n') || '- Ninguna específica.'}`,
        'Si recibes task_id e identificador runtime del agente, consérvalos en el resultado y en el informe de reportes del área; no inventes identificadores.',
      ].join('\n\n');
      expected.set(`${role.id}.toml`, `${header}\nname = ${JSON.stringify(role.id)}\ndescription = ${JSON.stringify(role.descripcion)}\ndeveloper_instructions = ${JSON.stringify(instructions)}\n`);
    }
  }

  const directory = path.join(root, '.codex', 'agents');
  for (const target of [path.join(root, '.codex'), directory]) {
    try {
      const stat = fs.lstatSync(target);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`No se permiten enlaces simbólicos, junctions ni archivos en ${target}.`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }

  const current = new Map();
  if (fs.existsSync(directory)) {
    for (const name of fs.readdirSync(directory).filter(name => name.toLowerCase().endsWith('.toml'))) {
      const file = path.join(directory, name);
      const stat = fs.lstatSync(file);
      if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`Perfil inválido o enlazado: ${name}.`);
      current.set(name, fs.readFileSync(file, 'utf8'));
    }
  }

  const generated = content => content.split(/\r?\n/, 1)[0] === header;
  const noncanonical = [...current.keys()].filter(name => name !== name.toLowerCase() && expected.has(name.toLowerCase()));
  if (noncanonical.length) throw new Error(`Perfiles con nombre no canónico conservados; revisa las mayúsculas: ${noncanonical.join(', ')}.`);
  const manual = [...expected.keys()].filter(name => current.has(name) && !generated(current.get(name)));
  const obsolete = [...current.keys()].filter(name => generated(current.get(name)) && !expected.has(name));
  if (manual.length) throw new Error(`Perfiles manuales conservados; resuelve la colisión: ${manual.join(', ')}.`);
  if (obsolete.length) throw new Error(`Perfiles generados obsoletos; revísalos antes de retirarlos: ${obsolete.join(', ')}.`);
  const changed = [...expected].filter(([name, content]) => current.get(name) !== content);
  if (check && changed.length) throw new Error(`Perfiles desincronizados: ${changed.map(([name]) => name).join(', ')}.`);
  if (!check && changed.length) {
    fs.mkdirSync(directory, { recursive: true });
    for (const [name, content] of changed) {
      const temporary = path.join(directory, `.${name}.${randomUUID()}.tmp`);
      try {
        fs.writeFileSync(temporary, content, { flag: 'wx' });
        fs.renameSync(temporary, path.join(directory, name));
      } finally {
        if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
      }
    }
  }
  return { perfiles: expected.size, actualizados: check ? 0 : changed.length, verificado: check };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) throw new Error('Usa node herramientas/sincronizar-codex.mjs [--check].');
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    console.log(JSON.stringify(syncCodex(root, { check: args[0] === '--check' }), null, 2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
