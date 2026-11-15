import fs from 'node:fs';
import { ROOT, safePath } from './paths.mjs';

// Política deliberada: YAML 1.2 en sintaxis JSON, sin tags, aliases ni evaluación.
export function parseData(text) {
  const value=JSON.parse(text);
  const stack=[];
  const tokens=/"(?:\\.|[^"\\])*"|[{}\[\]]/gu;
  for(const match of text.matchAll(tokens)) {
    const token=match[0];
    if(token==='{')stack.push(new Set());
    else if(token==='[')stack.push(null);
    else if(token==='}'||token===']')stack.pop();
    else if(/^\s*:/u.test(text.slice(match.index+token.length))) {
      const key=JSON.parse(token),keys=stack.at(-1);
      if(keys?.has(key))throw new Error(`Clave JSON duplicada: ${key}`);
      keys?.add(key);
    }
  }
  return value;
}
export function readData(relative, root = ROOT) {
  return parseData(fs.readFileSync(safePath(root, relative), 'utf8'));
}
export function readText(relative, root = ROOT) {
  return fs.readFileSync(safePath(root, relative), 'utf8');
}
export function loadAgents(root = ROOT) {
  const registry = readData('config/agents.yaml', root);
  return [registry.orchestrator, ...registry.agents].map(file => readData(file, root));
}
export function getAgent(id, root = ROOT) {
  const agent = loadAgents(root).find(item => item.id === id);
  if (!agent) throw new Error(`Agente desconocido: ${id}`);
  return agent;
}
