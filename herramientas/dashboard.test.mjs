import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { validateDelivery, publishDelivery, readDelivery, MAX_DELIVERY_BYTES } from './dashboard.mjs';
import { collectTelemetry, collectTasks, publishChangedTasks } from './telemetria.mjs';
import { runtimePolicyGate } from './politica.mjs';
import { buildUnits } from './homelab.mjs';
import { fileURLToPath } from 'node:url';

const delivery = () => ({ version: 1, id: randomUUID(), area: 'work', source: 'test:synthetic', observed_at: new Date().toISOString(), summary: 'Datos sintéticos para pruebas.', metrics: [], items: [], references: [] });
function temporary(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'agents-dashboard-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('publica de forma atómica, reconoce reintentos y conserva entregas procesadas', t => {
  const directory = temporary(t); const value = delivery();
  assert.deepEqual(publishDelivery(value, directory), { id: value.id, duplicate: false });
  assert.deepEqual(readDelivery(path.join(directory, `${value.id}.json`)), value);
  assert.deepEqual(publishDelivery(value, directory), { id: value.id, duplicate: true });
  assert.throws(() => publishDelivery({ ...value, summary: 'Alterada' }, directory), /otro contenido/);
  fs.mkdirSync(path.join(directory, 'processed'));
  fs.renameSync(path.join(directory, `${value.id}.json`), path.join(directory, 'processed', `${value.id}.${randomUUID()}.json`));
  assert.equal(publishDelivery(value, directory).duplicate, true);
  assert.deepEqual(fs.readdirSync(directory), ['processed']);
});

test('rechaza secretos, payload grande, fechas inválidas, campos ajenos y rutas locales', () => {
  assert.throws(() => validateDelivery({ ...delivery(), token: 'secret' }), /Campos/);
  assert.throws(() => validateDelivery({ ...delivery(), summary: `Bearer ${'x'.repeat(40)}` }), /secreto/);
  assert.throws(() => validateDelivery({ ...delivery(), observed_at: '2026-02-31T10:00:00Z' }), /Fecha/);
  assert.throws(() => validateDelivery({ ...delivery(), observed_at: new Date(Date.now() + 60000).toISOString() }), /futura/);
  assert.throws(() => validateDelivery({ ...delivery(), references: [{ source: 'local', local_ref: '../credenciales' }] }), /opaca/);
  assert.throws(() => validateDelivery({ ...delivery(), references: [{ source: 'web', url: 'https://usuario:secreto@example.com' }] }), /credenciales/);
  assert.throws(() => validateDelivery({ ...delivery(), metrics: [{ key: 'value', label: 'Valor', value: Infinity }] }), /Métrica/);
  assert.throws(() => validateDelivery({ ...delivery(), items: Array.from({ length: 200 }, (_, index) => ({ id: String(index), title: 'a'.repeat(1000), kind: 'activity', source_ref: 'b'.repeat(500) })) }), /256 KiB/);
});

test('valida patrimonio por moneda y rechaza pérdidas de precisión o área equivocada', () => {
  const value = delivery();
  value.valuations = [{ account_ref: 'banco-principal', name: 'Saldo sintético', kind: 'asset', currency: 'CLP', amount_minor: 123456, valued_at: value.observed_at, source_ref: 'statement:synthetic' }];
  assert.equal(validateDelivery(value).valuations[0].amount_minor, 123456);
  assert.throws(() => validateDelivery({ ...value, area: 'health' }), /Trabajo/);
  assert.throws(() => validateDelivery({ ...value, valuations: [{ ...value.valuations[0], amount_minor: Number.MAX_SAFE_INTEGER + 1 }] }), /Valoración/);
  assert.throws(() => validateDelivery({ ...value, valuations: [{ ...value.valuations[0], valued_at: new Date(Date.now() + 60000).toISOString() }] }), /Valoración/);
});

test('no sigue symlinks ni junctions en entrada, bandeja o processed', t => {
  const directory = temporary(t); const outside = temporary(t);
  const link = path.join(directory, 'link');
  fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => publishDelivery(delivery(), link), /enlaces/);
  const value = delivery(); fs.writeFileSync(path.join(outside, `${value.id}.json`), JSON.stringify(value));
  fs.symlinkSync(outside, path.join(directory, 'processed'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => publishDelivery(value, directory), /enlaces/);
  assert.equal(fs.existsSync(path.join(directory, `${value.id}.json`)), false);
  const large = path.join(outside, 'large.json'); fs.writeFileSync(large, ' '.repeat(MAX_DELIVERY_BYTES + 1));
  assert.throws(() => readDelivery(large), /demasiado grande/);
});

test('telemetría consulta servicios reales y reduce Tailscale sin publicar claves ni direcciones', () => {
  const calls = [];
  const run = (file, args) => {
    calls.push([file, args]);
    if (file === 'systemctl') return args[2].includes('personal') ? 'LoadState=loaded\nActiveState=active\nSubState=running\nMainPID=42\n' : 'LoadState=not-found\nActiveState=inactive\nMainPID=0\n';
    return JSON.stringify({ BackendState: 'Running', Peer: { privatekey: { ID: 'peer-id', PublicKey: 'private-key', HostName: 'Equipo de prueba', OS: 'linux', Online: true, TailscaleIPs: ['100.0.0.1'] } } });
  };
  const value = validateDelivery(collectTelemetry({ run, platform: 'linux', hostname: 'HP sintético' }));
  assert.equal(value.telemetry.find(item => item.entity_id === 'hermes:personal').status, 'online');
  assert.equal(value.telemetry.find(item => item.entity_id === 'hermes:finanzas').status, 'unconfigured');
  assert.equal(value.telemetry.find(item => item.label === 'Equipo de prueba').metrics.telemetry_available, false);
  assert.ok(calls.every(([file]) => ['systemctl', 'tailscale'].includes(file)));
  assert.ok(!JSON.stringify(value).includes('private-key'));
  assert.ok(!JSON.stringify(value).includes('100.0.0.1'));
});

test('comandos inaccesibles producen estados de error y las tareas no simulan procesos vivos', () => {
  const value = validateDelivery(collectTelemetry({ platform: 'linux', run: () => { throw new Error('denied'); } }));
  assert.equal(value.telemetry.find(item => item.entity_id === 'hermes:personal').status, 'error');
  assert.equal(value.telemetry.find(item => item.entity_id === 'connector:tailscale').status, 'error');
  assert.ok(collectTasks().every(item => validateDelivery(item).source === 'agents-tasks'));
});

test('pre-check omite modelo ante pausa, política antigua, inválida, futura o inaccesible', t => {
  const directory = temporary(t); const control = path.join(directory, 'control'); fs.mkdirSync(control);
  const file = path.join(control, 'runtime-policy.json'); const now = Date.now();
  const write = value => fs.writeFileSync(file, JSON.stringify(value));
  assert.equal(runtimePolicyGate(directory, now).wakeAgent, false);
  write({ paused: false, observed_at: new Date(now).toISOString(), autonomy: 'read_and_propose' });
  assert.equal(runtimePolicyGate(directory, now).wakeAgent, true);
  write({ paused: true, observed_at: new Date(now).toISOString(), autonomy: 'read_and_propose' });
  assert.equal(runtimePolicyGate(directory, now).wakeAgent, false);
  write({ paused: false, observed_at: new Date(now - 90001).toISOString(), autonomy: 'read_and_propose' });
  assert.equal(runtimePolicyGate(directory, now).context.reason, 'policy_stale');
  write({ paused: false, observed_at: new Date(now + 60000).toISOString(), autonomy: 'read_and_propose' });
  assert.equal(runtimePolicyGate(directory, now).wakeAgent, false);
  write({ paused: false, observed_at: new Date(now).toISOString(), autonomy: 'full' });
  assert.equal(runtimePolicyGate(directory, now).wakeAgent, false);
  write({ paused: false, observed_at: new Date(now).toISOString(), autonomy: 'read_and_propose', token: 'ignored' });
  assert.equal(runtimePolicyGate(directory, now).wakeAgent, false);
  fs.unlinkSync(file);
  const outside = temporary(t); fs.symlinkSync(outside, file, process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal(runtimePolicyGate(directory, now).wakeAgent, false);
});

test('exporta tareas solo al cambiar y no reemplaza una caché dañada', t => {
  const root = temporary(t); const reports = path.join(root, 'Fixture', 'reportes');
  fs.mkdirSync(path.join(root, 'Fixture', '.agents'), { recursive: true }); fs.mkdirSync(reports);
  fs.writeFileSync(path.join(root, 'Fixture', 'AGENTS.md'), '# Fixture');
  fs.writeFileSync(path.join(root, 'Fixture', '.agents', 'equipo.json'), JSON.stringify({ id: 'personal', nombre: 'Fixture', objetivo: 'Probar', roles: [{ id: 'vida-memoria', nombre: 'Memoria', descripcion: 'Fixture', instrucciones: 'Fixture', skills: [], integraciones: [] }], flujos: [] }));
  const inbox = path.join(root, 'inbox'); const state = path.join(root, 'state'); const previous = process.env.DASHBOARD_INBOX_DIR;
  process.env.DASHBOARD_INBOX_DIR = inbox;
  try {
    assert.equal(publishChangedTasks(state, root).length, 6);
    assert.equal(publishChangedTasks(state, root).length, 0);
    const cache = path.join(state, 'tasks-digest.json'); fs.writeFileSync(cache, 'corrupt');
    assert.throws(() => publishChangedTasks(state, root), SyntaxError);
    assert.equal(fs.readFileSync(cache, 'utf8'), 'corrupt');
  } finally { if (previous === undefined) delete process.env.DASHBOARD_INBOX_DIR; else process.env.DASHBOARD_INBOX_DIR = previous; }
});

test('units restringen escrituras y no montan capturas/control como escritura para Hermes', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const data = path.join(os.tmpdir(), 'personal-os-data');
  const units = buildUnits({ root, appRoot: path.resolve(root, '..', 'Personal-OS'), data, home: path.join(os.tmpdir(), 'hermes home'), node: process.execPath });
  assert.ok(units.gateway.includes('ProtectSystem=strict'));
  assert.ok(units.gateway.includes('NoNewPrivileges=true'));
  const writable = units.gateway.split('\n').find(line => line.startsWith('ReadWritePaths='));
  assert.ok(!writable.includes('captures') && !writable.includes('control'));
  assert.ok(units.gateway.includes('.env.hp'));
  assert.ok(units.timer.includes('OnUnitActiveSec=30s'));
  assert.ok(units.service.includes('telemetria.mjs') && !units.service.includes('hermes chat'));
  assert.throws(() => buildUnits({ root, appRoot: root, data: `${data}\nExecStart=/bin/evil`, home: os.tmpdir() }), /systemd/);
});
