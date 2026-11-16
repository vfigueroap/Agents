import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { syncCodex } from './sincronizar-codex.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-sync-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const area = path.join(root, 'Universidad');
  fs.mkdirSync(path.join(area, '.agents'), { recursive: true });
  fs.mkdirSync(path.join(area, 'reportes'));
  fs.mkdirSync(path.join(root, '.agents', 'skills', 'lectura'), { recursive: true });
  fs.writeFileSync(path.join(root, '.agents', 'skills', 'lectura', 'SKILL.md'), '# Lectura');
  fs.writeFileSync(path.join(area, 'AGENTS.md'), '# Universidad');
  fs.writeFileSync(path.join(area, 'reportes', 'MEMORIA.md'), '# Memoria');
  const role = { id: 'uni-lector', nombre: 'Lector', descripcion: 'Analiza apuntes y "citas".', instrucciones: 'Cita página.\nConserva fórmulas.', skills: ['.agents/skills/lectura/SKILL.md'], integraciones: [] };
  fs.writeFileSync(path.join(area, '.agents', 'equipo.json'), JSON.stringify({ id: 'universidad', nombre: 'Universidad', objetivo: 'Leer clases', roles: [role], flujos: [] }));
  return { root, role, directory: path.join(root, '.codex', 'agents'), profile: path.join(root, '.codex', 'agents', 'uni-lector.toml') };
}

test('genera datos del rol, instrucciones y rutas de skills en TOML y es idempotente', t => {
  const { root, role, profile } = fixture(t);
  assert.deepEqual(syncCodex(root), { perfiles: 1, actualizados: 1, verificado: false });
  const content = fs.readFileSync(profile, 'utf8');
  const fields = Object.fromEntries(content.trim().split('\n').slice(1).map(line => {
    const separator = line.indexOf(' = ');
    return [line.slice(0, separator), JSON.parse(line.slice(separator + 3))];
  }));
  assert.equal(fields.name, role.id);
  assert.equal(fields.description, role.descripcion);
  assert.ok(fields.developer_instructions.includes(role.instrucciones));
  assert.ok(fields.developer_instructions.includes(role.skills[0]));
  assert.ok(fields.developer_instructions.includes('Universidad/AGENTS.md'));
  assert.ok(fields.developer_instructions.includes('task_id'));
  assert.ok(fields.developer_instructions.includes('runtime'));
  assert.deepEqual(Object.keys(fields), ['name', 'description', 'developer_instructions']);
  assert.equal(syncCodex(root).actualizados, 0);
  assert.equal(syncCodex(root, { check: true }).verificado, true);
});

test('--check detecta ausencia y cambios sin crear ni escribir perfiles', t => {
  const { root, directory, profile } = fixture(t);
  assert.throws(() => syncCodex(root, { check: true }), /desincronizados/);
  assert.equal(fs.existsSync(directory), false);
  syncCodex(root);
  fs.appendFileSync(profile, '# Cambio local\n');
  const before = fs.readFileSync(profile, 'utf8');
  assert.throws(() => syncCodex(root, { check: true }), /desincronizados/);
  assert.equal(fs.readFileSync(profile, 'utf8'), before);
  assert.equal(syncCodex(root).actualizados, 1);
});

test('preserva un perfil manual aunque colisione con un rol canónico', t => {
  const { root, directory, profile } = fixture(t);
  fs.mkdirSync(directory, { recursive: true });
  const manual = 'name = "uni-lector"\n# Perfil personal\n';
  fs.writeFileSync(profile, manual);
  assert.throws(() => syncCodex(root), /manuales conservados/);
  assert.throws(() => syncCodex(root, { check: true }), /manuales conservados/);
  assert.equal(fs.readFileSync(profile, 'utf8'), manual);
  fs.renameSync(profile, path.join(directory, 'personal.toml'));
  syncCodex(root);
  assert.equal(fs.readFileSync(path.join(directory, 'personal.toml'), 'utf8'), manual);
});

test('informa perfiles generados obsoletos sin borrarlos', t => {
  const { root, directory, profile } = fixture(t);
  syncCodex(root);
  const obsolete = path.join(directory, 'uni-anterior.toml');
  fs.copyFileSync(profile, obsolete);
  const before = fs.readFileSync(obsolete, 'utf8');
  assert.throws(() => syncCodex(root, { check: true }), /obsoletos.*uni-anterior/);
  assert.throws(() => syncCodex(root), /obsoletos.*uni-anterior/);
  assert.equal(fs.readFileSync(obsolete, 'utf8'), before);
});

test('preserva colisiones con mayúsculas en sistemas insensibles al caso', t => {
  const { root, directory } = fixture(t);
  fs.mkdirSync(directory, { recursive: true });
  const profile = path.join(directory, 'UNI-LECTOR.TOML');
  fs.writeFileSync(profile, '# Perfil manual');
  assert.throws(() => syncCodex(root), /nombre no canónico/);
  assert.equal(fs.readFileSync(profile, 'utf8'), '# Perfil manual');
});

test('rechaza junctions en .codex y en agents antes de leer o escribir', t => {
  const { root, directory } = fixture(t);
  const target = path.join(root, 'destino');
  fs.mkdirSync(target);
  const codex = path.dirname(directory);
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(target, codex, linkType);
  assert.throws(() => syncCodex(root), /enlaces simbólicos/);
  fs.unlinkSync(codex);
  fs.mkdirSync(codex);
  fs.symlinkSync(target, directory, linkType);
  assert.throws(() => syncCodex(root, { check: true }), /enlaces simbólicos/);
  assert.deepEqual(fs.readdirSync(target), []);
});
