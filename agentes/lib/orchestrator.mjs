import { readData, getAgent } from './data.mjs';
import { ROOT } from './paths.mjs';
import { assertValid } from './schema.mjs';
import { LOCAL_ACTIONS } from './security.mjs';

const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export function routeTask(text, root = ROOT) {
  if(typeof text!=='string' || !text.trim() || text.length>4000) throw new Error('Solicitud vacía o demasiado extensa');
  const router = readData('orchestrator/router.yaml',root);
  assertValid(router,readData('schemas/router.schema.json',root),'router');
  const tokens = new Set(normalize(text).match(/[a-z0-9]+/gu) ?? []);
  const matches = router.routes.map(route=>({agent:route.agent,
    score:route.keywords.filter(keyword=>normalize(keyword).split(/\s+/u).every(word=>tokens.has(word))).length})).filter(item=>item.score>0);
  if(!matches.length) return {status:'needs_clarification',selected:router.fallback,candidates:[]};
  const best = Math.max(...matches.map(item=>item.score));
  const candidates = matches.filter(item=>item.score===best).map(item=>item.agent).sort();
  return {status:candidates.length===1?'routed':'needs_clarification',selected:candidates.length===1?candidates[0]:null,candidates};
}

export function createDelegationPlanner({root = ROOT,now = Date.now} = {}) {
  const seen = new Set();
  let count = 0;
  const counts = new Map();
  const started = now();
  const policy = readData('orchestrator/delegation.yaml',root);
  assertValid(policy,readData('schemas/delegation.schema.json',root),'delegación');
  return { plan({from,to,task_id,depth=1,parallel=1,cost_units=0}) {
    if(typeof task_id!=='string' || !/^[a-z][a-z0-9-]{0,63}$/u.test(task_id)) throw new Error('task_id requerido');
    if(seen.has(task_id)) throw new Error('Tarea duplicada');
    const parent=getAgent(from,root), child=getAgent(to,root);
    for(const agent of [parent,child])assertValid(agent,readData('schemas/agent.schema.json',root),'agente de delegación');
    if(from===to || !parent.delegation.allowed_agents.includes(to)) throw new Error('Delegación no permitida');
    if(!Number.isInteger(depth) || depth<1 || depth>Math.min(policy.max_depth,parent.delegation.max_depth)) throw new Error('Profundidad excedida');
    if(!Number.isInteger(parallel) || parallel<1 || parallel>policy.max_parallel) throw new Error('Concurrencia excedida');
    if(typeof cost_units!=='number' || !Number.isFinite(cost_units) || cost_units<0 || cost_units>policy.cost_budget_units) throw new Error('Presupuesto excedido');
    if(now()-started>policy.timeout_seconds*1000) throw new Error('Plazo del plan agotado');
    if(count>=policy.max_tasks || (counts.get(from)??0)>=parent.delegation.max_tasks) throw new Error('Cantidad de tareas excedida');
    const global=readData('policies/permissions.yaml',root);
    assertValid(global,readData('schemas/permissions.schema.json',root),'política global');
    const allowed=parent.permissions.allow.filter(action=>LOCAL_ACTIONS.includes(action)&&global.allow.includes(action)&&!global.hard_deny.includes(action)&&child.permissions.allow.includes(action) &&
      !parent.permissions.deny.includes(action) && !child.permissions.deny.includes(action));
    seen.add(task_id);count++;counts.set(from,(counts.get(from)??0)+1);
    return {task_id,from,to,depth,permissions:allowed,automatic_start:false,
      execution:'not_implemented',note:'Plan local; no inicia procesos ni concede permisos al runtime externo.'};
  }};
}
