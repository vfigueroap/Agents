import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { safeDirectory } from './dashboard.mjs';
import { createApp } from './agentes.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const profiles = ['personal', 'finanzas', 'sistema'];
const shellQuote = value => `'${value.replaceAll("'", "'\\''")}'`;
const quote = value => {
  if (typeof value !== 'string' || /[\r\n\x00]/.test(value)) throw new Error('Valor systemd inválido.');
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('%', '%%')}"`;
};
const run = (file, args) => execFileSync(file, args, { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] });

export function buildUnits({ root, appRoot, data, home, node = process.execPath }) {
  for (const directory of [root, appRoot, data, home, node]) if (!path.isAbsolute(directory)) throw new Error('Las rutas del servicio deben ser absolutas.');
  const environment = `Environment=${quote(`HOMELAB_DATA_DIR=${data}`)} ${quote(`DASHBOARD_INBOX_DIR=${path.join(data, 'inbox')}`)}\n`;
  const hardening = 'NoNewPrivileges=true\nProtectSystem=strict\nProtectHome=read-only\nPrivateTmp=true\nRestrictSUIDSGID=true\nUMask=0007\n';
  const reports = createApp(root).teams().map(area => path.join(root, area.directorio, 'reportes'));
  return {
    gateway: `[Service]\n${environment}${hardening}ReadWritePaths=${[path.join(home, '.hermes'), path.join(data, 'inbox'), path.join(data, 'agents-state'), path.join(root, '.agents'), ...reports].map(quote).join(' ')}\nInaccessiblePaths=${[path.join(appRoot, '.env'), path.join(appRoot, '.env.hp'), path.join(data, 'worker-state')].map(value => quote(`-${value}`)).join(' ')}\n`,
    service: `[Unit]\nDescription=Personal OS: telemetría local sin modelo\n\n[Service]\nType=oneshot\nWorkingDirectory=${quote(root)}\n${environment}${hardening}ReadWritePaths=${[path.join(data, 'inbox'), path.join(data, 'agents-state')].map(quote).join(' ')}\nExecStart=${quote(node)} ${quote(path.join(root, 'herramientas', 'telemetria.mjs'))} collect\n`,
    timer: '[Unit]\nDescription=Actualizar estado de Personal OS cada 30 segundos\n\n[Timer]\nOnBootSec=30s\nOnUnitActiveSec=30s\nAccuracySec=2s\nUnit=personal-os-telemetry.service\n\n[Install]\nWantedBy=timers.target\n',
  };
}

function writeManaged(file, contents) {
  safeDirectory(path.dirname(file), true);
  try { if (fs.lstatSync(file).isSymbolicLink()) throw new Error('No se escribe sobre enlaces simbólicos.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const temporary = `${file}.${randomUUID()}.tmp`;
  try { fs.writeFileSync(temporary, contents, { flag: 'wx', mode: 0o600 }); fs.renameSync(temporary, file); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}

export function checkHomelab(root = projectRoot) {
  const available = file => { try { run(file, ['--version']); return true; } catch { return false; } };
  const homes = [path.join(os.homedir(), '.agents', 'skills'), path.join(os.homedir(), '.codex', 'skills')];
  return { platform: process.platform, node: process.version, catalog: createApp(root).run(['validar']), hermes_available: available('hermes'), systemctl_available: process.platform === 'linux' && available('systemctl'), external_skill_roots: homes.filter(directory => fs.existsSync(directory)), profiles: profiles.map(profile => ({ name: profile, present: fs.existsSync(path.join(os.homedir(), '.hermes', 'profiles', profile, 'config.yaml')) })), credentials_checked: false };
}

export function prepareHomelab(appDirectory, dataDirectory = '/srv/personal-os') {
  if (process.platform !== 'linux' || process.getuid?.() === 0) throw new Error('Ejecuta prepare en Ubuntu como usuario hermes-os, nunca como root.');
  if (process.env.HERMES_TUI_GATEWAY_URL) throw new Error('Retira HERMES_TUI_GATEWAY_URL para preparar únicamente este HP.');
  const root = safeDirectory(projectRoot); const appRoot = safeDirectory(appDirectory); const data = safeDirectory(dataDirectory); const home = safeDirectory(os.homedir());
  for (const directory of ['inbox', 'agents-state']) safeDirectory(path.join(data, directory));
  for (const profile of profiles) {
    const profileHome = path.join(home, '.hermes', 'profiles', profile);
    const created = !['config.yaml', 'profile.yaml', 'auth.json', 'SOUL.md'].some(file => fs.existsSync(path.join(profileHome, file)));
    if (created) run('hermes', ['profile', 'create', profile, '--no-credentials']);
    safeDirectory(profileHome);
    run('hermes', ['-p', profile, 'config', 'set', 'terminal.cwd', root]);
    run('hermes', ['-p', profile, 'config', 'set', 'terminal.home_mode', 'profile']);
    const soul = path.join(profileHome, 'SOUL.md');
    if (created || !fs.existsSync(soul)) writeManaged(soul, fs.readFileSync(path.join(root, 'homelab', `${profile}.md`), 'utf8'));
    const skill = path.join(profileHome, 'skills', 'personal-os-dashboard', 'SKILL.md');
    if (!fs.existsSync(skill)) writeManaged(skill, fs.readFileSync(path.join(root, '.agents', 'skills', 'personal-os-dashboard', 'SKILL.md'), 'utf8'));
  }
  const units = buildUnits({ root, appRoot, data, home }); const unitRoot = path.join(home, '.config', 'systemd', 'user');
  const gate = path.join(home, '.hermes', 'profiles', 'personal', 'scripts', 'personal-os-policy.sh');
  writeManaged(gate, `#!/bin/sh\nexec ${shellQuote(process.execPath)} ${shellQuote(path.join(root, 'herramientas', 'politica.mjs'))} ${shellQuote(data)}\n`);
  fs.chmodSync(gate, 0o700);
  writeManaged(path.join(unitRoot, 'hermes-gateway-personal.service.d', 'personal-os.conf'), units.gateway);
  writeManaged(path.join(unitRoot, 'personal-os-telemetry.service'), units.service);
  writeManaged(path.join(unitRoot, 'personal-os-telemetry.timer'), units.timer);
  return { prepared: true, profiles, data_directory: data, services_started: false, credentials_created: false, next: ['hermes -p personal model', 'hermes -p personal gateway setup', 'hermes -p personal gateway install', 'systemctl --user daemon-reload', 'systemctl --user enable --now personal-os-telemetry.timer'] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command = 'check', app, data, ...extra] = process.argv.slice(2);
    if (extra.length || command === 'check' && app || !['check', 'prepare'].includes(command)) throw new Error('Uso: node herramientas/homelab.mjs check|prepare /ruta/Personal-OS [/srv/personal-os]');
    if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Se requiere Node 22 o posterior.');
    console.log(JSON.stringify(command === 'check' ? checkHomelab() : prepareHomelab(app, data), null, 2));
  } catch (error) { console.error(`Homelab: ${error.message}`); process.exitCode = 1; }
}
