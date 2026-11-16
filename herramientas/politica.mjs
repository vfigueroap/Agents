import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { safeDirectory } from './dashboard.mjs';

export function runtimePolicyGate(dataDirectory = process.env.HOMELAB_DATA_DIR, now = Date.now()) {
  try {
    const directory = safeDirectory(path.join(dataDirectory, 'control'));
    const file = path.join(directory, 'runtime-policy.json');
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('symlink');
    const handle = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    let policy;
    try {
      const stat = fs.fstatSync(handle);
      if (!stat.isFile() || stat.size > 4096) throw new Error('invalid_file');
      policy = JSON.parse(fs.readFileSync(handle, 'utf8'));
    } finally { fs.closeSync(handle); }
    if (!policy || typeof policy !== 'object' || Object.keys(policy).some(key => !['paused', 'observed_at', 'autonomy'].includes(key)) || typeof policy.paused !== 'boolean' || policy.autonomy !== 'read_and_propose') throw new Error('invalid_policy');
    const observed = Date.parse(policy.observed_at);
    if (!Number.isFinite(observed) || observed > now + 30000 || now - observed > 90000) return { wakeAgent: false, context: { reason: 'policy_stale' } };
    return { wakeAgent: !policy.paused, context: { reason: policy.paused ? 'dashboard_paused' : 'read_and_propose' } };
  } catch { return { wakeAgent: false, context: { reason: 'policy_unavailable' } }; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // A failed pre-check must skip inference, never fall back to Hermes' default wake=true.
  console.log(JSON.stringify(runtimePolicyGate(process.argv[2])));
}
