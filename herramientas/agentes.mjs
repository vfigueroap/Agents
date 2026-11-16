import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const taskPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const states = ['pendiente', 'en_curso', 'bloqueada', 'completada'];
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const text = value => typeof value === 'string' && value.trim().length > 0;
const inside = (base, target) => {
  const relative = path.relative(base, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};

export function createApp(projectRoot) {
  const root = fs.realpathSync(projectRoot);

  function safePath(input) {
    const target = path.resolve(root, input);
    requireValue(inside(root, target), 'La ruta debe quedar dentro del proyecto.');
    let current = root;
    for (const segment of path.relative(root, target).split(path.sep).filter(Boolean)) {
      current = path.join(current, segment);
      if (fs.existsSync(current)) {
        requireValue(!fs.lstatSync(current).isSymbolicLink(), 'No se permiten enlaces simbólicos ni junctions.');
        requireValue(inside(root, fs.realpathSync(current)), 'La ruta real sale del proyecto.');
      } else {
        // lstat también detecta enlaces rotos que existsSync no reconoce.
        try {
          requireValue(!fs.lstatSync(current).isSymbolicLink(), 'No se permiten enlaces simbólicos rotos.');
        } catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
    }
    return target;
  }

  function file(input) {
    const target = safePath(input);
    requireValue(fs.statSync(target).isFile(), `No es un archivo: ${input}`);
    return target;
  }

  function readJson(input) {
    return JSON.parse(fs.readFileSync(file(input), 'utf8'));
  }

  function atomicWrite(input, content) {
    const target = safePath(input);
    const temporary = safePath(`${target}.${randomUUID()}.tmp`);
    try {
      fs.writeFileSync(temporary, content, { flag: 'wx' });
      fs.renameSync(temporary, target);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }

  function locked(action) {
    const lock = safePath('.agents/tareas.lock');
    let handle;
    try { handle = fs.openSync(lock, 'wx'); }
    catch (error) {
      if (error.code === 'EEXIST') throw new Error('Otra escritura está activa: reintenta al terminar. Si hubo un cierre forzado, comprueba el proceso antes de retirar .agents/tareas.lock.');
      throw error;
    }
    try { return action(); }
    finally { fs.closeSync(handle); fs.unlinkSync(lock); }
  }

  function catalog() {
    const areas = [];
    const identifiers = new Set();
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (entry.isSymbolicLink() && fs.existsSync(path.join(root, entry.name, '.agents', 'equipo.json'))) safePath(entry.name);
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const manifest = path.join(entry.name, '.agents', 'equipo.json');
      if (!fs.existsSync(path.join(root, manifest))) continue;
      const area = readJson(manifest);
      requireValue(idPattern.test(area.id) && !identifiers.has(area.id), `ID de área inválido o repetido: ${area.id}`);
      identifiers.add(area.id);
      requireValue(text(area.nombre) && text(area.objetivo), `Área incompleta: ${area.id}`);
      requireValue(Array.isArray(area.roles) && area.roles.length > 0, `Área sin roles: ${area.id}`);
      requireValue(Array.isArray(area.flujos), `Flujos inválidos: ${area.id}`);
      area.directorio = entry.name;
      file(path.join(entry.name, 'AGENTS.md'));
      const memory = safePath(path.join(entry.name, 'reportes', 'MEMORIA.md'));
      if (fs.existsSync(memory)) file(memory);
      for (const role of area.roles) {
        requireValue(idPattern.test(role.id) && !identifiers.has(role.id), `ID de rol inválido o repetido: ${role.id}`);
        identifiers.add(role.id);
        requireValue(text(role.nombre) && text(role.descripcion) && text(role.instrucciones), `Rol incompleto: ${role.id}`);
        requireValue(Array.isArray(role.skills) && Array.isArray(role.integraciones) && role.integraciones.every(text), `Recursos inválidos: ${role.id}`);
        for (const skill of role.skills) {
          requireValue(text(skill) && !path.isAbsolute(skill), `Skill debe usar ruta relativa: ${role.id}`);
          file(skill);
        }
      }
      const flowIds = new Set();
      for (const flow of area.flujos) {
        requireValue(idPattern.test(flow.id) && !flowIds.has(flow.id) && text(flow.nombre), `Flujo inválido o repetido: ${area.id}`);
        flowIds.add(flow.id);
        requireValue(Array.isArray(flow.pasos) && flow.pasos.length > 0, `Flujo sin pasos: ${flow.id}`);
        const steps = new Map();
        for (const step of flow.pasos) {
          requireValue(area.roles.some(role => role.id === step.rol) && !steps.has(step.rol), `Rol inválido o repetido en flujo: ${step.rol}`);
          requireValue(Array.isArray(step.depende_de) && step.depende_de.every(text), `Dependencias inválidas: ${step.rol}`);
          steps.set(step.rol, step.depende_de);
        }
        const visiting = new Set();
        const visited = new Set();
        function visit(id) {
          requireValue(steps.has(id), `Dependencia ausente del flujo: ${id}`);
          requireValue(!visiting.has(id), `Ciclo de dependencias: ${flow.id}`);
          if (visited.has(id)) return;
          visiting.add(id);
          for (const dependency of steps.get(id)) visit(dependency);
          visiting.delete(id);
          visited.add(id);
        }
        for (const id of steps.keys()) visit(id);
      }
      areas.push(area);
    }
    requireValue(areas.length > 0, 'No se encontraron áreas con .agents/equipo.json.');
    return areas;
  }

  function taskFiles(area) {
    const directory = safePath(path.join(area.directorio, 'reportes', 'tareas'));
    if (!fs.existsSync(directory)) return [];
    requireValue(fs.statSync(directory).isDirectory(), 'La ruta de tareas no es un directorio.');
    return fs.readdirSync(directory).filter(name => name.endsWith('.json')).map(name => {
      requireValue(taskPattern.test(name.slice(0, -5)), `Nombre de tarea inválido: ${name}`);
      const task = readJson(path.join(directory, name));
      requireValue(task.id === name.slice(0, -5) && task.area === area.id && text(task.rol) && idPattern.test(task.rol), `Identidad de tarea inválida: ${name}`);
      requireValue(states.includes(task.estado) && text(task.objetivo), `Tarea inválida: ${name}`);
      return task;
    });
  }

  function taskPath(area, id) {
    return safePath(path.join(area.directorio, 'reportes', 'tareas', `${id}.json`));
  }

  function saveTask(area, task) {
    atomicWrite(taskPath(area, task.id), `${JSON.stringify(task, null, 2)}\n`);
  }

  function run(argv) {
    const commands = { listar: [0, 1], encargo: [2, 2], asignar: [2, 2], iniciar: [2, 2], bloquear: [2, 2], cerrar: [2, 2], estado: [0, 1], validar: [0, 0] };
    const [command, ...args] = argv;
    requireValue(Object.hasOwn(commands, command), `Comando desconocido. Usa: ${Object.keys(commands).join(', ')}.`);
    requireValue(args.length >= commands[command][0] && args.length <= commands[command][1] && args.every(value => text(value) && !value.startsWith('--')), 'Argumentos inválidos o faltantes. No hay opciones con flags.');
    const areas = catalog();
    if (command === 'validar') return { valido: true, areas: areas.length, roles: areas.reduce((count, area) => count + area.roles.length, 0) };
    if (command === 'listar' || command === 'estado') {
      const selected = args[0] ? areas.filter(area => area.id === args[0]) : areas;
      requireValue(selected.length > 0, `Área desconocida: ${args[0]}`);
      return command === 'listar' ? selected : selected.flatMap(taskFiles);
    }
    if (command === 'encargo' || command === 'asignar') {
      const area = areas.find(item => item.roles.some(role => role.id === args[0]));
      requireValue(area, `Rol desconocido: ${args[0]}`);
      const role = area.roles.find(item => item.id === args[0]);
      if (command === 'encargo') return { rol: role.id, area: area.id, objetivo: args[1], instrucciones: role.instrucciones, skills: role.skills, integraciones: role.integraciones, reportes: path.join(area.directorio, 'reportes') };
      return locked(() => {
        const now = new Date().toISOString();
        const task = { id: randomUUID(), area: area.id, rol: role.id, objetivo: args[1], estado: 'pendiente', creada_en: now, actualizada_en: now, runtime_agente: null, bloqueo: null, informe: null };
        fs.mkdirSync(safePath(path.join(area.directorio, 'reportes', 'tareas')), { recursive: true });
        const memory = safePath(path.join(area.directorio, 'reportes', 'MEMORIA.md'));
        if (!fs.existsSync(memory)) {
          const owner = area.roles.find(item => item.id.endsWith('-memoria'))?.id ?? area.id;
          fs.writeFileSync(memory, `# Memoria de ${area.nombre}\n\n- Propietario: \`${owner}\`.\n- Clasificación: personal local.\n- Fecha de habilitación: ${now}.\n- Procedencia: inicialización local al asignar una tarea; no se importó memoria previa.\n\n## Cierres\n`, { flag: 'wx' });
        }
        saveTask(area, task);
        return task;
      });
    }
    requireValue(taskPattern.test(args[0]), 'ID de tarea inválido.');
    return locked(() => {
      const matches = areas.flatMap(area => taskFiles(area).filter(task => task.id === args[0]).map(task => ({ area, task })));
      requireValue(matches.length === 1, 'Tarea ausente o repetida entre áreas.');
      const { area, task } = matches[0];
      if (command === 'iniciar') {
        requireValue(['pendiente', 'bloqueada'].includes(task.estado), 'Solo se inicia una tarea pendiente o bloqueada.');
        requireValue(args[1].length <= 256 && !/[\r\n\x00]/.test(args[1]), 'Identificador de agente de ejecución inválido.');
        Object.assign(task, { estado: 'en_curso', runtime_agente: args[1], bloqueo: null });
      } else if (command === 'bloquear') {
        requireValue(['pendiente', 'en_curso'].includes(task.estado), 'Solo se bloquea una tarea pendiente o en curso.');
        Object.assign(task, { estado: 'bloqueada', bloqueo: args[1] });
      } else {
        requireValue(['en_curso', 'completada'].includes(task.estado), 'Solo se cierra una tarea en curso.');
        const report = file(args[1]);
        const reportsDirectory = safePath(path.join(area.directorio, 'reportes'));
        requireValue(inside(reportsDirectory, report) && path.extname(report).toLowerCase() === '.md', 'El informe debe ser un .md dentro de reportes del área.');
        requireValue(!['MEMORIA.MD', 'README.MD'].includes(path.basename(report).toUpperCase()), 'MEMORIA.md y README.md no reemplazan el informe de evidencia.');
        const content = fs.readFileSync(report, 'utf8');
        requireValue(content.trim().length > 0, 'El informe está vacío.');
        const relativeReport = path.relative(root, report).split(path.sep).join('/');
        const hash = createHash('sha256').update(content).digest('hex');
        if (task.estado === 'completada') {
          requireValue(task.informe === relativeReport && task.evidencia_sha256 === hash, 'Una tarea completada no admite reemplazar su evidencia.');
        } else {
          Object.assign(task, { estado: 'completada', informe: relativeReport, evidencia_sha256: hash, completada_en: new Date().toISOString() });
        }
        const memory = file(path.join(area.directorio, 'reportes', 'MEMORIA.md'));
        const previous = fs.readFileSync(memory, 'utf8');
        const marker = `<!-- tarea:${task.id} -->`;
        task.actualizada_en = new Date().toISOString();
        saveTask(area, task);
        if (!previous.includes(marker)) {
          const entry = `\n\n${marker}\n## ${task.completada_en} | ${task.id}\n\n- Rol: ${task.rol}\n- Objetivo (dato): ${JSON.stringify(task.objetivo)}\n- Informe: [evidencia](${path.relative(reportsDirectory, report).split(path.sep).map(encodeURIComponent).join('/')})\n- SHA256: ${hash}\n`;
          atomicWrite(memory, previous + entry);
        }
        return task;
      }
      task.actualizada_en = new Date().toISOString();
      saveTask(area, task);
      return task;
    });
  }
  return { run, teams: catalog };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    console.log(JSON.stringify(createApp(projectRoot).run(process.argv.slice(2)), null, 2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
