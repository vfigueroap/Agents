import test from 'node:test';
import assert from 'node:assert/strict';
import { routeTask,createDelegationPlanner } from '../lib/orchestrator.mjs';

test('router reconoce español con acentos y mayúsculas',()=>{
 assert.equal(routeTask('EXPLICAR ejercicios de universidad').selected,'academic');
 assert.equal(routeTask('INGENIERÍA y simulación').selected,'engineering');
});
test('router conserva candidatos ante empate y fallback cuando faltan coincidencias',()=>{
 assert.deepEqual(routeTask('contrato campaña').candidates,['legal','marketing']);
 assert.equal(routeTask('contrato campaña').selected,null);
 assert.deepEqual(routeTask('solicitud sin palabras conocidas'),{status:'needs_clarification',selected:'orchestrator',candidates:[]});
});
test('router usa palabras completas y rechaza entrada vacía o excesiva',()=>{
 assert.equal(routeTask('microssoftwarexyz').status,'needs_clarification');
 for(const text of ['',null,'a'.repeat(4001)])assert.throws(()=>routeTask(text));
});
test('delegación devuelve plan sin iniciar ejecución ni ampliar permisos',()=>{
 const plan=createDelegationPlanner().plan({from:'orchestrator',to:'software',task_id:'demo-task'});
 assert.equal(plan.automatic_start,false);assert.equal(plan.execution,'not_implemented');
 assert.deepEqual(plan.permissions,['files.read_fixture','analysis.summarize']);
});
test('deduplicación y límites de profundidad, concurrencia y costo',()=>{
 const planner=createDelegationPlanner();
 const base={from:'orchestrator',to:'software',task_id:'demo-task'};
 planner.plan(base);assert.throws(()=>planner.plan(base),/duplicada/u);
 for(const extra of [{depth:3},{parallel:3},{cost_units:1},{cost_units:NaN},{depth:-1}])assert.throws(()=>planner.plan({...base,task_id:'another-task',...extra}));
});
test('no delega a sí mismo ni a un dominio fuera de la política',()=>{
 const planner=createDelegationPlanner();
 assert.throws(()=>planner.plan({from:'orchestrator',to:'orchestrator',task_id:'self'}),/no permitida/u);
 assert.throws(()=>planner.plan({from:'software',to:'legal',task_id:'forbidden'}),/no permitida/u);
 assert.throws(()=>planner.plan({from:'orchestrator',to:'software'}),/task_id/u);
});
test('respeta cantidad máxima de tareas por plan',()=>{
 const planner=createDelegationPlanner();
 for(let i=0;i<10;i++)planner.plan({from:'orchestrator',to:'software',task_id:`task-${i}`});
 assert.throws(()=>planner.plan({from:'orchestrator',to:'software',task_id:'task-overflow'}),/Cantidad/u);
});
test('planner se detiene al agotar su plazo sin esperar tiempo real',()=>{
 let current=0;const planner=createDelegationPlanner({now:()=>current});current=61000;
 assert.throws(()=>planner.plan({from:'orchestrator',to:'software',task_id:'expired-task'}),/Plazo/u);
});
