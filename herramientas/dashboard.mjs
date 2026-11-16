import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const MAX_DELIVERY_BYTES = 256 * 1024;
export const areaIds = ['work', 'health', 'spirituality', 'romantic', 'family-friends', 'five-buckets', 'system', 'business', 'education'];
const itemKinds = ['activity', 'current', 'next', 'reflection', 'opportunity', 'contact', 'learning', 'skill', 'resource', 'reputation', 'plan'];
const buckets = ['knowledge', 'skill', 'resources', 'network', 'reputation'];
const states = ['online', 'idle', 'busy', 'error', 'limited', 'offline', 'unconfigured'];
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value, max, optional = false) => optional && value === undefined || typeof value === 'string' && value.trim().length > 0 && value.length <= max && !value.includes('\0');
const keys = (value, allowed) => requireValue(object(value) && Object.keys(value).every(key => allowed.includes(key)), 'Campos de entrega no admitidos.');
const timestamp = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) return false;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
};
const list = (value, max) => Array.isArray(value) && value.length <= max;
const primitive = value => value === null || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value) || typeof value === 'string' && value.length <= 1000;

export function validateDelivery(value) {
  keys(value, ['version', 'id', 'area', 'source', 'observed_at', 'summary', 'metrics', 'items', 'references', 'valuations', 'telemetry']);
  requireValue(value.version === 1 && /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(value.id), 'Versión o UUID de entrega inválido.');
  requireValue(areaIds.includes(value.area) && text(value.source, 100) && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value.source), 'Área o fuente inválida.');
  requireValue(timestamp(value.observed_at) && Date.parse(value.observed_at) <= Date.now() + 30000, 'Fecha de observación inválida o futura.');
  requireValue(typeof value.summary === 'string' && value.summary.length <= 20000, 'Resumen inválido.');
  requireValue(list(value.metrics, 30) && list(value.items, 200) && list(value.references, 100), 'Listas de entrega inválidas.');
  for (const metric of value.metrics) {
    keys(metric, ['key', 'label', 'value', 'unit', 'currency']);
    requireValue(text(metric.key, 100) && text(metric.label, 200) && (typeof metric.value === 'number' && Number.isFinite(metric.value) || text(metric.value, 1000)) && text(metric.unit, 50, true) && (metric.currency === undefined || /^[A-Z]{3}$/.test(metric.currency)), 'Métrica inválida.');
  }
  for (const item of value.items) {
    keys(item, ['id', 'title', 'kind', 'status', 'due_at', 'bucket', 'source_ref']);
    requireValue(text(item.id, 200) && text(item.title, 1000) && itemKinds.includes(item.kind) && text(item.status, 100, true) && (item.due_at === undefined || timestamp(item.due_at)) && (item.bucket === undefined || buckets.includes(item.bucket)) && text(item.source_ref, 500, true), 'Elemento de entrega inválido.');
  }
  for (const reference of value.references) {
    keys(reference, ['source', 'external_id', 'url', 'local_ref']);
    requireValue(text(reference.source, 100) && text(reference.external_id, 1000, true) && text(reference.local_ref, 500, true), 'Referencia inválida.');
    if (reference.local_ref !== undefined) requireValue(/^[a-zA-Z0-9][a-zA-Z0-9:._-]*$/.test(reference.local_ref) && !reference.local_ref.includes('..'), 'Referencia local debe ser opaca, sin ruta.');
    if (reference.url !== undefined) {
      let url;
      try { url = new URL(reference.url); } catch { throw new Error('URL de referencia inválida.'); }
      requireValue(url.protocol === 'https:' && !url.username && !url.password && reference.url.length <= 2000, 'La referencia requiere HTTPS sin credenciales.');
    }
  }
  if (value.valuations !== undefined) {
    requireValue(list(value.valuations, 100) && (!value.valuations.length || value.area === 'work'), 'Las valoraciones corresponden a Trabajo.');
    for (const valuation of value.valuations) {
      keys(valuation, ['account_ref', 'name', 'kind', 'currency', 'amount_minor', 'valued_at', 'source_ref']);
    requireValue(text(valuation.account_ref, 200) && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(valuation.account_ref) && text(valuation.name, 200) && ['asset', 'liability'].includes(valuation.kind) && /^[A-Z]{3}$/.test(valuation.currency) && Number.isSafeInteger(valuation.amount_minor) && valuation.amount_minor >= 0 && timestamp(valuation.valued_at) && Date.parse(valuation.valued_at) <= Date.now() + 30000 && text(valuation.source_ref, 500), 'Valoración inválida.');
    }
  }
  if (value.telemetry !== undefined) {
    requireValue(list(value.telemetry, 100), 'Telemetría inválida.');
    for (const entity of value.telemetry) {
      keys(entity, ['entity_id', 'kind', 'label', 'status', 'observed_at', 'metrics']);
      requireValue(text(entity.entity_id, 200) && ['agent', 'device', 'service', 'connector'].includes(entity.kind) && text(entity.label, 200) && states.includes(entity.status) && timestamp(entity.observed_at) && Date.parse(entity.observed_at) <= Date.now() + 30000, 'Entidad de telemetría inválida.');
      requireValue(object(entity.metrics) && Object.keys(entity.metrics).length <= 30 && Object.entries(entity.metrics).every(([key, metric]) => text(key, 100) && primitive(metric)), 'Métricas de telemetría inválidas.');
    }
  }
  const serialized = JSON.stringify(value);
  requireValue(Buffer.byteLength(serialized) <= MAX_DELIVERY_BYTES, 'La entrega supera 256 KiB.');
  requireValue(!/(?:sb_secret_[\w-]+|\bsk-(?:proj-|svcacct-)?[\w-]{16,}|Bearer\s+\S+|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i.test(serialized), 'La entrega contiene un posible secreto.');
  return value;
}

export function safeDirectory(input, create = false) {
  requireValue(typeof input === 'string' && path.isAbsolute(input), 'Configura una ruta absoluta para la bandeja.');
  const directory = path.resolve(input);
  let current = path.parse(directory).root;
  for (const segment of path.relative(current, directory).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      const stat = fs.lstatSync(current);
      requireValue(!stat.isSymbolicLink() && stat.isDirectory(), 'No se permiten enlaces simbólicos ni archivos en la ruta.');
    } catch (error) {
      if (error.code !== 'ENOENT' || !create) throw error;
      fs.mkdirSync(current, { mode: 0o770 });
    }
  }
  return fs.realpathSync(directory);
}

export function readDelivery(input) {
  const absolute = path.resolve(input);
  safeDirectory(path.dirname(absolute));
  const handle = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const stat = fs.fstatSync(handle);
    requireValue(stat.isFile() && stat.size <= MAX_DELIVERY_BYTES && !fs.lstatSync(absolute).isSymbolicLink(), 'Archivo de entrega inválido o demasiado grande.');
    return validateDelivery(JSON.parse(fs.readFileSync(handle, 'utf8')));
  } finally { fs.closeSync(handle); }
}

export function publishDelivery(value, inbox = process.env.DASHBOARD_INBOX_DIR) {
  const delivery = validateDelivery(value);
  const directory = safeDirectory(inbox, true);
  const serialized = JSON.stringify(delivery);
  const name = `${delivery.id}.json`;
  const target = path.join(directory, name);
  const processed = path.join(directory, 'processed');
  let processedNames = [];
  try { processedNames = fs.readdirSync(safeDirectory(processed)).filter(file => file === name || file.startsWith(`${delivery.id}.`) && file.endsWith('.json')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const candidate of [target, ...processedNames.map(file => path.join(processed, file))]) {
    try {
      const existing = readDelivery(candidate);
      requireValue(JSON.stringify(existing) === serialized, 'El UUID ya existe con otro contenido.');
      return { id: delivery.id, duplicate: true };
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const lock = path.join(directory, `${delivery.id}.lock`);
  const handle = fs.openSync(lock, 'wx', 0o660);
  const temporary = path.join(directory, `${delivery.id}.${randomUUID()}.tmp`);
  try {
    if (fs.existsSync(target)) {
      requireValue(JSON.stringify(readDelivery(target)) === serialized, 'El UUID ya existe con otro contenido.');
      return { id: delivery.id, duplicate: true };
    }
    fs.writeFileSync(temporary, serialized, { flag: 'wx', mode: 0o660 });
    fs.chmodSync(temporary, 0o660);
    fs.renameSync(temporary, target);
    return { id: delivery.id, duplicate: false };
  } finally {
    fs.closeSync(handle);
    fs.unlinkSync(lock);
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, input, ...extra] = process.argv.slice(2);
    requireValue(['validate', 'publish'].includes(command) && input && !extra.length, 'Uso: node herramientas/dashboard.mjs validate|publish archivo.json|-');
    let delivery;
    if (input === '-') {
      let bytes = 0; const chunks = [];
      for await (const chunk of process.stdin) { bytes += chunk.length; requireValue(bytes <= MAX_DELIVERY_BYTES, 'La entrega supera 256 KiB.'); chunks.push(chunk); }
      delivery = validateDelivery(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    } else delivery = readDelivery(input);
    console.log(JSON.stringify(command === 'validate' ? { valid: true, id: delivery.id } : publishDelivery(delivery)));
  } catch (error) { console.error(`Dashboard: ${error instanceof SyntaxError ? 'JSON inválido.' : error.message}`); process.exitCode = 1; }
}
