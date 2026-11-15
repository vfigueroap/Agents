// Validador del subconjunto cerrado de JSON Schema usado por este repositorio.
// No pretende implementar todo draft 2020-12. Rechaza keywords no soportadas.
const SUPPORTED = new Set(['$schema', '$id', '$defs', '$ref', 'title', 'description',
  'type', 'const', 'enum', 'properties', 'required', 'additionalProperties', 'items',
  'minItems', 'maxItems', 'uniqueItems', 'minLength', 'maxLength', 'pattern', 'minimum', 'maximum']);
const equal = (a, b) => {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a).sort();
  return equalKeys(keys, Object.keys(b).sort()) && keys.every(k => equal(a[k], b[k]));
};
const equalKeys = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const typeMatches = (data, type) => {
  if (type === 'null') return data === null;
  if (type === 'array') return Array.isArray(data);
  if (type === 'object') return data !== null && typeof data === 'object' && !Array.isArray(data);
  if (type === 'integer') return Number.isInteger(data);
  if (type === 'number') return typeof data === 'number' && Number.isFinite(data);
  return typeof data === type;
};

export function assertSupported(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new Error('Schema debe ser objeto');
  for (const key of Object.keys(schema)) if (!SUPPORTED.has(key)) throw new Error(`Keyword no soportada: ${key}`);
  if (schema.$schema && schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') throw new Error('Draft no soportado');
  if (schema.$ref && !/^#\/\$defs\/[a-zA-Z0-9_-]+$/u.test(schema.$ref)) throw new Error('Solo referencias locales a $defs');
  for(const key of ['$schema','$id','$ref','title','description','pattern']) {
    if(key in schema&&typeof schema[key]!=='string')throw new Error(`${key} debe ser texto`);
  }
  if('type' in schema&&!(typeof schema.type==='string'||(Array.isArray(schema.type)&&schema.type.length&&schema.type.every(t=>typeof t==='string')&&new Set(schema.type).size===schema.type.length)))throw new Error('type inválido');
  for (const type of [schema.type].flat().filter(Boolean)) {
    if (!['object','array','string','number','integer','boolean','null'].includes(type)) throw new Error(`Tipo desconocido: ${type}`);
  }
  if (schema.additionalProperties !== undefined && typeof schema.additionalProperties !== 'boolean') throw new Error('additionalProperties debe ser booleano');
  if('uniqueItems' in schema&&typeof schema.uniqueItems!=='boolean')throw new Error('uniqueItems debe ser booleano');
  for(const key of ['minItems','maxItems','minLength','maxLength'])if(key in schema&&(!Number.isInteger(schema[key])||schema[key]<0))throw new Error(`${key} debe ser entero no negativo`);
  for(const key of ['minimum','maximum'])if(key in schema&&(typeof schema[key]!=='number'||!Number.isFinite(schema[key])))throw new Error(`${key} debe ser número finito`);
  if('required' in schema&&(!Array.isArray(schema.required)||!schema.required.every(k=>typeof k==='string')||new Set(schema.required).size!==schema.required.length))throw new Error('required debe ser una lista única de nombres');
  if('enum' in schema&&(!Array.isArray(schema.enum)||!schema.enum.length))throw new Error('enum debe ser una lista no vacía');
  if (schema.pattern) new RegExp(schema.pattern, 'u');
  for (const collection of [schema.properties, schema.$defs]) {
    if(collection!==undefined&&(!collection||typeof collection!=='object'||Array.isArray(collection)))throw new Error('properties/$defs debe ser objeto');
    for (const child of Object.values(collection ?? {})) assertSupported(child);
  }
  if (schema.items) assertSupported(schema.items);
}

export function validateSchema(data, schema) {
  assertSupported(schema);
  const errors = [];
  function visit(value, rule, at, depth = 0) {
    if (depth > 80) throw new Error('Referencia de schema recursiva o profundidad excesiva');
    if (rule.$ref) {
      const definition = schema.$defs?.[rule.$ref.slice(8)];
      if (!definition) throw new Error(`Referencia de schema inexistente: ${rule.$ref}`);
      visit(value, definition, at, depth + 1);
    }
    const fail = message => errors.push(`${at}: ${message}`);
    if (rule.type && ![rule.type].flat().some(type => typeMatches(value, type))) { fail(`tipo esperado ${rule.type}`); return; }
    if ('const' in rule && !equal(value, rule.const)) fail('valor constante incorrecto');
    if (rule.enum && !rule.enum.some(item => equal(value, item))) fail('valor fuera de enum');
    if (typeof value === 'string') {
      const length = [...value].length;
      if (rule.minLength !== undefined && length < rule.minLength) fail('texto demasiado corto');
      if (rule.maxLength !== undefined && length > rule.maxLength) fail('texto demasiado largo');
      if (rule.pattern && !new RegExp(rule.pattern, 'u').test(value)) fail('patrón inválido');
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) fail('número no finito');
      if (rule.minimum !== undefined && value < rule.minimum) fail('menor que mínimo');
      if (rule.maximum !== undefined && value > rule.maximum) fail('mayor que máximo');
    }
    if (Array.isArray(value)) {
      if (rule.minItems !== undefined && value.length < rule.minItems) fail('faltan elementos');
      if (rule.maxItems !== undefined && value.length > rule.maxItems) fail('demasiados elementos');
      if (rule.uniqueItems && value.some((v, i) => value.slice(0, i).some(previous => equal(v, previous)))) fail('elementos duplicados');
      if (rule.items) value.forEach((v, i) => visit(v, rule.items, `${at}/${i}`, depth + 1));
    } else if (value && typeof value === 'object') {
      for (const key of rule.required ?? []) if (!Object.hasOwn(value, key)) fail(`falta ${key}`);
      for (const [key, child] of Object.entries(value)) {
        if (Object.hasOwn(rule.properties ?? {}, key)) visit(child, rule.properties[key], `${at}/${key}`, depth + 1);
        else if (rule.additionalProperties === false) fail(`propiedad desconocida ${key}`);
      }
    }
  }
  visit(data, schema, '$');
  return errors;
}

export function assertValid(data, schema, label = 'documento') {
  const errors = validateSchema(data, schema);
  if (errors.length) throw new Error(`${label}:\n${errors.join('\n')}`);
  return data;
}
