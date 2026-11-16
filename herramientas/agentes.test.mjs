import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createApp } from './agentes.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentes-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const manifest = path.join(root, 'Universidad', '.agents', 'equipo.json');
  const reports = path.join(root, 'Universidad', 'reportes');
  fs.mkdirSync(path.dirname(manifest), { recursive: true });
  fs.mkdirSync(path.join(root, '.agents', 'skills', 'lectura'), { recursive: true });
  fs.mkdirSync(reports);
  fs.writeFileSync(path.join(root, '.agents', 'skills', 'lectura', 'SKILL.md'), '# Lectura');
  fs.writeFileSync(path.join(root, 'Universidad', 'AGENTS.md'), '# Universidad');
  fs.writeFileSync(path.join(reports, 'MEMORIA.md'), '# Memoria\n\nDecisión anterior conservada.');
  const data = {
    id: 'universidad', nombre: 'Universidad', objetivo: 'Analizar clases',
    roles: [
      { id: 'uni-lector', nombre: 'Lector', descripcion: 'Analiza fuentes', instrucciones: 'Citar página original.', skills: ['.agents/skills/lectura/SKILL.md'], integraciones: ['archivos-locales'] },
      { id: 'uni-resumen', nombre: 'Resumen', descripcion: 'Resume', instrucciones: 'Conservar condiciones.', skills: [], integraciones: [] },
    ],
    flujos: [{ id: 'clase', nombre: 'Clase', pasos: [{ rol: 'uni-lector', depende_de: [] }, { rol: 'uni-resumen', depende_de: ['uni-lector'] }] }],
  };
  fs.writeFileSync(manifest, JSON.stringify(data));
  return { root, app: createApp(root), reports, data, save: () => fs.writeFileSync(manifest, JSON.stringify(data)) };
}

test('descubre roles y devuelve un encargo sin ejecutar su objetivo', t => {
  const { app, root } = fixture(t);
  assert.deepEqual(app.run(['validar']), { valido: true, areas: 1, roles: 2 });
  assert.equal(app.teams()[0].id, 'universidad');
  assert.equal(app.run(['listar', 'universidad'])[0].roles.length, 2);
  const goal = '$(Remove-Item *) y `echo nada`; solo texto';
  const brief = app.run(['encargo', 'uni-lector', goal]);
  assert.equal(brief.objetivo, goal);
  assert.equal(brief.instrucciones, 'Citar página original.');
  assert.equal(fs.existsSync(path.join(root, 'Universidad', 'reportes', 'tareas')), false);
});

test('asigna, bloquea, reanuda y cierra con evidencia y memoria preservada', t => {
  const { app, reports } = fixture(t);
  const task = app.run(['asignar', 'uni-lector', 'Analizar clase 1']);
  assert.equal(task.estado, 'pendiente');
  assert.equal(app.run(['bloquear', task.id, 'Falta presentación']).estado, 'bloqueada');
  const started = app.run(['iniciar', task.id, '/root/uni-lector']);
  assert.equal(started.estado, 'en_curso');
  assert.equal(started.runtime_agente, '/root/uni-lector');
  assert.equal(started.bloqueo, null);
  const report = path.join(reports, 'clase 1.md');
  fs.writeFileSync(report, '# Resultado\n\nRevisadas las diapositivas 1 a 10.');
  const closed = app.run(['cerrar', task.id, report]);
  assert.equal(closed.estado, 'completada');
  assert.match(closed.evidencia_sha256, /^[a-f0-9]{64}$/);
  const memory = fs.readFileSync(path.join(reports, 'MEMORIA.md'), 'utf8');
  assert.ok(memory.includes('Decisión anterior conservada.'));
  assert.ok(memory.includes(task.id));
  assert.ok(memory.includes('clase%201.md'));
  app.run(['cerrar', task.id, report]);
  assert.equal(fs.readFileSync(path.join(reports, 'MEMORIA.md'), 'utf8'), memory);
  assert.equal(app.run(['estado', 'universidad'])[0].estado, 'completada');
  fs.writeFileSync(report, '# Reemplazo');
  assert.throws(() => app.run(['cerrar', task.id, report]), /no admite reemplazar/);
  assert.throws(() => app.run(['iniciar', task.id, 'otro']), /Solo se inicia/);
  assert.throws(() => app.run(['bloquear', task.id, 'otro']), /Solo se bloquea/);
});

test('clon sin memoria permite consultas sin escribir e inicializa al asignar', t => {
  const { app, reports, data, save } = fixture(t);
  data.roles.push({ id: 'uni-memoria', nombre: 'Memoria', descripcion: 'Consolida informes', instrucciones: 'Conservar procedencia.', skills: [], integraciones: [] });
  save();
  const memory = path.join(reports, 'MEMORIA.md');
  fs.unlinkSync(memory);
  fs.rmdirSync(reports);
  assert.equal(app.run(['listar'])[0].id, 'universidad');
  assert.equal(app.run(['validar']).valido, true);
  assert.equal(app.run(['encargo', 'uni-lector', 'Analizar']).rol, 'uni-lector');
  assert.equal(app.teams()[0].id, 'universidad');
  assert.equal(fs.existsSync(reports), false);
  const task = app.run(['asignar', 'uni-lector', 'Primera tarea local']);
  const initial = fs.readFileSync(memory, 'utf8');
  assert.ok(initial.includes('# Memoria de Universidad'));
  assert.ok(initial.includes('`uni-memoria`'));
  assert.ok(initial.includes('Clasificación: personal local'));
  assert.ok(initial.includes('Procedencia: inicialización local'));
  app.run(['asignar', 'uni-resumen', 'Segunda tarea local']);
  assert.equal(fs.readFileSync(memory, 'utf8'), initial);
  app.run(['iniciar', task.id, 'runtime-clon']);
  const report = path.join(reports, 'primera-tarea.md');
  fs.writeFileSync(report, '# Resultado\n\nInforme de prueba para el clon.');
  app.run(['cerrar', task.id, report]);
  const closedMemory = fs.readFileSync(memory, 'utf8');
  assert.ok(closedMemory.startsWith(initial));
  assert.ok(closedMemory.includes(task.id));
});

test('cerrar rechaza memoria eliminada de una tarea existente sin recrearla', t => {
  const { app, reports } = fixture(t);
  const task = app.run(['asignar', 'uni-lector', 'Analizar']);
  app.run(['iniciar', task.id, 'runtime']);
  const report = path.join(reports, 'resultado.md');
  fs.writeFileSync(report, '# Resultado verificado');
  const memory = path.join(reports, 'MEMORIA.md');
  fs.unlinkSync(memory);
  assert.throws(() => app.run(['cerrar', task.id, report]), /ENOENT/);
  assert.equal(fs.existsSync(memory), false);
  assert.equal(app.run(['estado'])[0].estado, 'en_curso');
});

test('retirar un rol conserva su historial y permite operar con roles actuales', t => {
  const { app, reports, data, save } = fixture(t);
  const historical = app.run(['asignar', 'uni-lector', 'Lectura anterior']);
  app.run(['iniciar', historical.id, 'runtime-anterior']);
  const oldReport = path.join(reports, 'lectura-anterior.md');
  fs.writeFileSync(oldReport, '# Lectura anterior\n\nResultado verificado.');
  app.run(['cerrar', historical.id, oldReport]);
  data.roles = data.roles.filter(role => role.id !== 'uni-lector');
  data.flujos[0].pasos = [{ rol: 'uni-resumen', depende_de: [] }];
  save();
  assert.equal(app.run(['validar']).roles, 1);
  assert.equal(app.run(['estado', 'universidad'])[0].rol, 'uni-lector');
  assert.throws(() => app.run(['asignar', 'uni-lector', 'No autorizado por catálogo actual']), /Rol desconocido/);
  const current = app.run(['asignar', 'uni-resumen', 'Trabajo actual']);
  app.run(['iniciar', current.id, 'runtime-actual']);
  const newReport = path.join(reports, 'trabajo-actual.md');
  fs.writeFileSync(newReport, '# Trabajo actual\n\nResultado verificado.');
  app.run(['cerrar', current.id, newReport]);
  const tasks = app.run(['estado']);
  assert.equal(tasks.length, 2);
  assert.ok(tasks.every(task => task.estado === 'completada'));
  assert.ok(fs.readFileSync(path.join(reports, 'MEMORIA.md'), 'utf8').includes(historical.id));
});

test('rechaza transiciones e informes inexistentes, vacíos o fuera de reportes', t => {
  const { app, reports, root } = fixture(t);
  const task = app.run(['asignar', 'uni-lector', 'Analizar clase']);
  assert.throws(() => app.run(['cerrar', task.id, path.join(reports, 'no.md')]), /Solo se cierra/);
  app.run(['iniciar', task.id, 'runtime-1']);
  assert.throws(() => app.run(['iniciar', task.id, 'runtime-2']), /Solo se inicia/);
  assert.throws(() => app.run(['cerrar', task.id, path.join(reports, 'no.md')]), /ENOENT/);
  const empty = path.join(reports, 'vacio.md');
  fs.writeFileSync(empty, ' \n');
  assert.throws(() => app.run(['cerrar', task.id, empty]), /vacío/);
  assert.throws(() => app.run(['cerrar', task.id, path.join(reports, 'MEMORIA.md')]), /no reemplazan/);
  const readme = path.join(reports, 'README.md');
  fs.writeFileSync(readme, '# Instrucciones');
  assert.throws(() => app.run(['cerrar', task.id, readme]), /no reemplazan/);
  const outsideReports = path.join(root, 'afuera.md');
  fs.writeFileSync(outsideReports, '# Dato ajeno');
  assert.throws(() => app.run(['cerrar', task.id, outsideReports]), /dentro de reportes/);
  assert.throws(() => app.run(['cerrar', task.id, '../escape.md']), /dentro del proyecto/);
  assert.equal(app.run(['estado'])[0].estado, 'en_curso');
});

test('valida identidades, skills y dependencias reales y acíclicas', t => {
  const { app, data, save } = fixture(t);
  data.roles[1].id = 'uni-lector'; save();
  assert.throws(() => app.run(['validar']), /repetido/);
  data.roles[1].id = 'uni-resumen';
  data.roles[0].skills = ['../SKILL.md']; save();
  assert.throws(() => app.run(['validar']), /dentro del proyecto/);
  data.roles[0].skills = ['no-existe.md']; save();
  assert.throws(() => app.run(['validar']), /ENOENT/);
  data.roles[0].skills = [];
  data.flujos[0].pasos[1].depende_de = ['no-existe']; save();
  assert.throws(() => app.run(['validar']), /ausente/);
  data.flujos[0].pasos[1].depende_de = ['uni-lector'];
  data.flujos[0].pasos[0].depende_de = ['uni-resumen']; save();
  assert.throws(() => app.run(['validar']), /Ciclo/);
});

test('lock exclusivo impide pérdida concurrente sin modificar tareas o memoria', t => {
  const { app, root, reports } = fixture(t);
  const task = app.run(['asignar', 'uni-lector', 'Analizar']);
  const before = fs.readFileSync(path.join(reports, 'tareas', `${task.id}.json`), 'utf8');
  const lock = path.join(root, '.agents', 'tareas.lock');
  fs.writeFileSync(lock, 'otro proceso');
  assert.throws(() => app.run(['iniciar', task.id, 'runtime']), /Otra escritura/);
  assert.throws(() => app.run(['asignar', 'uni-lector', 'Otra tarea']), /Otra escritura/);
  assert.equal(fs.readFileSync(path.join(reports, 'tareas', `${task.id}.json`), 'utf8'), before);
  assert.equal(fs.readFileSync(lock, 'utf8'), 'otro proceso');
});

test('rechaza junctions hacia rutas internas y externas', t => {
  const { app, root, reports } = fixture(t);
  const task = app.run(['asignar', 'uni-lector', 'Analizar']);
  app.run(['iniciar', task.id, 'runtime']);
  const target = path.join(root, 'destino');
  fs.mkdirSync(target);
  fs.writeFileSync(path.join(target, 'evidencia.md'), '# Evidencia');
  const link = path.join(reports, 'enlace');
  fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => app.run(['cerrar', task.id, path.join(link, 'evidencia.md')]), /enlaces simbólicos/);
  fs.unlinkSync(link);
  fs.symlinkSync(os.tmpdir(), link, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => app.run(['cerrar', task.id, path.join(link, 'evidencia.md')]), /enlaces simbólicos/);
});

test('CLI termina con error ante comandos y argumentos inválidos', t => {
  const { app } = fixture(t);
  for (const args of [[], ['borrar'], ['listar', '--todo'], ['encargo'], ['encargo', 'uni-lector', ''], ['asignar', 'no-existe', 'meta'], ['iniciar', '../escape', 'runtime']]) {
    assert.throws(() => app.run(args));
  }
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./agentes.mjs', import.meta.url)), 'desconocido'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Comando desconocido/);
});
