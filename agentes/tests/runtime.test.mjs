import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRuntime,runWorkflow } from '../lib/runtime.mjs';
import { safePath,ROOT } from '../lib/paths.mjs';
import { authorize,SENSITIVE_ACTIONS } from '../lib/security.mjs';
import { getAgent,readData } from '../lib/data.mjs';
import { preNetwork } from '../hooks/pre-network/index.mjs';
import { requireApproval } from '../hooks/approval/index.mjs';
import { workspace,testLink } from './helpers.mjs';

const summary=input=>({agent_id:'finance',tool_id:'summarize-records',input});
test('workflow seguro de extremo a extremo produce suma sintética',()=>{
 const result=runWorkflow();
 assert.deepEqual(result.results.summarize,{classification:'synthetic',count:3,total:180});
 assert.equal(result.events.length,6);
});
test('rechaza transferencias, inversión y demás acciones sensibles aunque el agente las declare',()=>{
 const agent=getAgent('finance');agent.permissions.allow=[...SENSITIVE_ACTIONS];agent.permissions.deny=[];
 for(const action of SENSITIVE_ACTIONS)assert.throws(()=>authorize(agent,action),/sensible bloqueada/u);
});
test('ninguna aprobación declarada por el solicitante habilita acciones',()=>{
 const runtime=createRuntime();
 assert.throws(()=>runtime.runTool({...summary({records:[{label:'Ficticio',value:1}]}),approval:true}),/propiedad desconocida/u);
 assert.throws(()=>runtime.runTool({agent_id:'finance',tool_id:'investment-trade',input:{approval:true}}),/no autorizada/u);
});
test('herramientas planificadas o desconocidas no se ejecutan',()=>{
 const runtime=createRuntime();
 for(const tool_id of ['terminal-command','github-query','constructor','unknown'])assert.throws(()=>runtime.runTool({agent_id:'software',tool_id,input:{}}));
});
test('valida tipos, límites y campos extra antes del cálculo',()=>{
 const runtime=createRuntime();
 for(const records of [[],[{label:'Ficticio',value:'12'}],[{label:'Ficticio',value:Infinity}],Array.from({length:101},()=>({label:'Ficticio',value:1}))]){
   assert.throws(()=>runtime.runTool(summary({records})),/entrada de herramienta/u);
 }
 assert.throws(()=>runtime.runTool(summary({records:[{label:'Ficticio',value:1,command:'texto no ejecutable'}]})),/desconocida/u);
});
test('auditoría usa solo metadatos y registra fallos sin contenido',()=>{
 const runtime=createRuntime();const privateText='TEXTO-FICTICIO-QUE-NO-DEBE-REGISTRARSE';
 runtime.runTool(summary({records:[{label:privateText,value:2}]}));
 assert.throws(()=>runtime.runTool(summary({records:[{label:privateText,value:'bad'}]})));
 assert(!JSON.stringify(runtime.events).includes(privateText));
 assert(runtime.events.some(e=>e.event==='on-error'));
 assert.equal(runtime.events.at(-1).status,'denied');
 for(const event of runtime.events)assert.deepEqual(Object.keys(event).sort(),['agent_id','event','status','timestamp','tool_id']);
});
test('rechaza rutas de escape, absolutas y sintaxis Windows peligrosa',()=>{
 for(const route of ['../private.json','/etc/passwd','C:/secret.json','a\\b','a/../b','file:stream','a//b','a/.. /b','generated./file','CON.json'])assert.throws(()=>safePath(ROOT,route));
 const runtime=createRuntime();
 assert.throws(()=>runtime.runTool({agent_id:'personal',tool_id:'fixture-read',input:{path:'examples/fixtures/../../.env'}}));
 assert.throws(()=>runtime.runTool({agent_id:'personal',tool_id:'fixture-read',input:{path:'config/agents.yaml'}}));
});
test('rechaza enlaces incluso cuando apuntan a un archivo existente del proyecto',t=>{
 const w=workspace(t);
 const target=path.join(w.directory,'real');fs.mkdirSync(target);
 const link=testLink(t,target,path.join(w.directory,'link'));
 assert.throws(()=>safePath(w.directory,path.basename(link)),/Enlace/u);
});
test('fixture con clasificación privada es rechazado por el contrato de salida',t=>{
 const w=workspace(t,{copyProject:true});
 w.set('examples/fixtures/fictional-records.json',{classification:'private',records:[{label:'Dato ficticio',value:1}]});
 assert.throws(()=>createRuntime({root:w.directory}).runTool({agent_id:'personal',tool_id:'fixture-read',input:{path:'examples/fixtures/fictional-records.json'}}),/salida de herramienta/u);
});
test('alterar un manifest no puede conectar un handler a otra acción',t=>{
 const w=workspace(t,{copyProject:true});
 const tool=readData('tools/analytics/summarize-records.yaml',w.directory);tool.action='content.publish';
 w.set('tools/analytics/summarize-records.yaml',tool);
 assert.throws(()=>createRuntime({root:w.directory}).runTool(summary({records:[{label:'Ficticio',value:1}]})),/ejecutor no permitido/u);
 tool.action='analysis.summarize';tool.approval='unavailable';w.set('tools/analytics/summarize-records.yaml',tool);
 assert.throws(()=>createRuntime({root:w.directory}).runTool(summary({records:[{label:'Ficticio',value:1}]})),/ejecutor no permitido/u);
});
test('política global puede revocar una acción segura en tiempo de ejecución',t=>{
 const w=workspace(t,{copyProject:true});
 const runtime=createRuntime({root:w.directory});
 const policy=readData('policies/permissions.yaml',w.directory);policy.allow=[];w.set('policies/permissions.yaml',policy);
 assert.throws(()=>runtime.runTool(summary({records:[{label:'Ficticio',value:1}]})),/denegado/u);
});
test('red y aprobación fallan de forma restrictiva',()=>{
 assert.throws(()=>preNetwork(),/deshabilitada/u);
 assert.throws(()=>requireApproval(),/no implementado/u);
 assert.throws(()=>authorize(getAgent('personal'),'unregistered.action'),/denegado/u);
});
test('workflow falla ante una dependencia futura o duplicada',t=>{
 const w=workspace(t,{copyProject:true});
 const wf=readData('workflows/multi-agent/safe-analysis.yaml',w.directory);
 wf.steps[0].input_from='future.records';w.set('workflows/multi-agent/safe-analysis.yaml',wf);
 assert.throws(()=>runWorkflow('workflows/multi-agent/safe-analysis.yaml',{root:w.directory}),/previa inexistente/u);
});
