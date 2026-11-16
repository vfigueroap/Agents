import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createApp } from './agentes.mjs';
import { publishDelivery, safeDirectory } from './dashboard.mjs';

const profiles = ['personal', 'finanzas', 'sistema'];
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const command = (file, args) => execFileSync(file, args, { encoding: 'utf8', timeout: 4000, maxBuffer: 1024 * 1024, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
const digest = value => createHash('sha256').update(value).digest('hex').slice(0, 24);
const taskAreas = { desarrollo: 'work', ingenieria: 'work', finanzas: 'work', fitness: 'health', personal: 'family-friends', sistemas: 'system', emprendimiento: 'business', marketing: 'business', comercial: 'business', universidad: 'education', tutoria: 'education', juridico: 'work' };

export function collectTelemetry({ root = projectRoot, dataDirectory = process.env.HOMELAB_DATA_DIR, run = command, now = new Date().toISOString(), hostname = os.hostname(), platform = process.platform } = {}) {
  const telemetry = [];
  const metrics = { cpu_count: os.availableParallelism(), memory_total_bytes: os.totalmem(), memory_free_bytes: os.freemem(), uptime_seconds: Math.floor(os.uptime()) };
  if (platform !== 'win32') metrics.load_1m = os.loadavg()[0];
  if (dataDirectory) {
    const directory = safeDirectory(dataDirectory);
    const disk = fs.statfsSync(directory);
    if (Number.isSafeInteger(disk.bavail * disk.bsize)) metrics.disk_available_bytes = disk.bavail * disk.bsize;
  }
  telemetry.push({ entity_id: `device:${digest(hostname)}`, kind: 'device', label: hostname, status: 'online', observed_at: now, metrics });
  for (const profile of profiles) {
    let status = 'unconfigured'; const serviceMetrics = { scope: 'user', profile };
    if (platform === 'linux') {
      try {
        const output = run('systemctl', ['--user', 'show', `hermes-gateway-${profile}.service`, '--property=LoadState,ActiveState,SubState,MainPID']);
        const properties = Object.fromEntries(output.trim().split('\n').map(line => { const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)]; }));
        status = properties.LoadState === 'not-found' ? 'unconfigured' : properties.ActiveState === 'active' && Number(properties.MainPID) > 0 ? 'online' : properties.ActiveState === 'failed' ? 'error' : 'offline';
        serviceMetrics.active_state = properties.ActiveState || 'unknown';
        serviceMetrics.sub_state = properties.SubState || 'unknown';
      } catch { status = 'error'; serviceMetrics.reason = 'service_status_unavailable'; }
    } else serviceMetrics.reason = 'linux_service_not_checked';
    telemetry.push({ entity_id: `hermes:${profile}`, kind: 'agent', label: `Hermes ${profile}`, status, observed_at: now, metrics: serviceMetrics });
  }
  try {
    const tailscale = JSON.parse(run('tailscale', ['status', '--json']));
    const online = tailscale.BackendState === 'Running';
    telemetry.push({ entity_id: 'connector:tailscale', kind: 'connector', label: 'Tailscale', status: online ? 'online' : 'offline', observed_at: now, metrics: { backend_state: String(tailscale.BackendState || 'unknown') } });
    for (const peer of Object.values(tailscale.Peer || {}).slice(0, 80)) {
      if (typeof peer.HostName !== 'string' || !peer.HostName) continue;
      telemetry.push({ entity_id: `tailnet:${digest(String(peer.ID || peer.PublicKey || peer.HostName))}`, kind: 'device', label: peer.HostName.slice(0, 200), status: peer.Online === true ? 'online' : 'offline', observed_at: now, metrics: { source: 'tailscale_reachability', os: typeof peer.OS === 'string' ? peer.OS : 'unknown', telemetry_available: false } });
    }
  } catch { telemetry.push({ entity_id: 'connector:tailscale', kind: 'connector', label: 'Tailscale', status: 'error', observed_at: now, metrics: { reason: 'status_unavailable' } }); }
  const app = createApp(root);
  const tasks = app.run(['estado']);
  const counts = Object.fromEntries(['pendiente', 'en_curso', 'bloqueada', 'completada'].map(state => [state, tasks.filter(task => task.estado === state).length]));
  return {
    version: 1, id: randomUUID(), area: 'system', source: `homelab:${digest(hostname)}`, observed_at: now,
    summary: 'Estado observado del homelab. Los dispositivos Tailscale muestran conectividad; una tarea en curso no acredita un proceso activo.',
    metrics: Object.entries(counts).map(([key, value]) => ({ key: `tasks_${key}`, label: `Tareas ${key}`, value })),
    items: tasks.filter(task => task.estado !== 'completada').sort((a, b) => b.actualizada_en.localeCompare(a.actualizada_en)).slice(0, 200).map(task => ({ id: task.id, title: task.objetivo.slice(0, 1000), kind: task.estado === 'en_curso' ? 'current' : 'next', status: task.estado, source_ref: `task:${task.id}` })),
    references: [{ source: 'agents-catalog' }], telemetry,
  };
}

export function collectTasks(root = projectRoot, now = new Date().toISOString()) {
  const tasks = createApp(root).run(['estado']);
  const deliveries = [];
  for (const area of ['work', 'health', 'family-friends', 'system', 'business', 'education']) {
    const selected = tasks.filter(task => (taskAreas[task.area] || 'work') === area);
    deliveries.push({ version: 1, id: randomUUID(), area, source: 'agents-tasks', observed_at: now, summary: selected.length ? 'Seguimiento de encargos registrados en Agentes; los estados son declarados por su ejecutor.' : 'Todavía no hay encargos registrados para esta área.', metrics: [], items: selected.sort((a, b) => b.actualizada_en.localeCompare(a.actualizada_en)).slice(0, 200).map(task => ({ id: task.id, title: task.objetivo.slice(0, 1000), kind: task.estado === 'completada' ? 'activity' : task.estado === 'en_curso' ? 'current' : 'next', status: task.estado, source_ref: `task:${task.id}` })), references: [{ source: 'agents-catalog' }] });
  }
  return deliveries;
}

export function publishChangedTasks(stateDirectory, root = projectRoot) {
  const directory = safeDirectory(stateDirectory, true);
  const file = path.join(directory, 'tasks-digest.json');
  let previous = {};
  try {
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('El estado no admite enlaces simbólicos.');
    previous = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const next = {}; const results = [];
  for (const delivery of collectTasks(root)) {
    next[delivery.area] = createHash('sha256').update(JSON.stringify({ items: delivery.items, summary: delivery.summary })).digest('hex');
    if (next[delivery.area] !== previous[delivery.area]) results.push(publishDelivery(delivery));
  }
  const temporary = path.join(directory, `tasks-${randomUUID()}.tmp`);
  try { fs.writeFileSync(temporary, JSON.stringify(next), { flag: 'wx', mode: 0o600 }); fs.renameSync(temporary, file); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  return results;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode = 'collect', ...extra] = process.argv.slice(2);
    if (extra.length || !['collect', 'tasks', 'print'].includes(mode)) throw new Error('Uso: node herramientas/telemetria.mjs collect|tasks|print');
    if (mode === 'print') console.log(JSON.stringify(collectTelemetry()));
    else {
      const deliveries = mode === 'tasks' ? collectTasks() : [collectTelemetry()];
      const results = deliveries.map(delivery => publishDelivery(delivery));
      if (mode === 'collect' && process.env.HOMELAB_DATA_DIR) results.push(...publishChangedTasks(path.join(process.env.HOMELAB_DATA_DIR, 'agents-state')));
      console.log(JSON.stringify({ deliveries: results }));
    }
  } catch (error) { console.error(`Telemetría: ${error.message}`); process.exitCode = 1; }
}
