import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProject } from '../lib/validate.mjs';
import { readData } from '../lib/data.mjs';
import { workspace } from './helpers.mjs';

test('árbol completo, contratos, referencias y políticas son válidos',()=>{
 const report=validateProject();assert.deepEqual(report.errors,[]);
 assert.equal(report.counts.agents,11);assert.equal(report.counts.domains,10);
 assert.equal(report.counts.references,27);assert.equal(report.counts.skills,16);
});
test('validador detecta skill inexistente y permiso sensible añadido',t=>{
 const w=workspace(t,{copyProject:true});const agent=readData('agents/software/agent.yaml',w.directory);
 agent.skills.push('missing-skill');agent.permissions.allow.push('content.publish');w.set('agents/software/agent.yaml',agent);
 const report=validateProject(w.directory);assert.equal(report.ok,false);
 assert(report.errors.some(e=>e.includes('skill inexistente')));assert(report.errors.some(e=>e.includes('permisos excesivos')));
});
test('validador no permite activar una reserva de migración',t=>{
 const w=workspace(t,{copyProject:true});const agent=readData('agents/academic/agent.yaml',w.directory);
 agent.skills.push('word');w.set('agents/academic/agent.yaml',agent);
 assert(validateProject(w.directory).errors.some(e=>e.includes('pendiente no activable')));
});
test('validador verifica identidad y diferenciación de perfiles heredados',t=>{
 const w=workspace(t,{copyProject:true});const agent=readData('agents/academic/agent.yaml',w.directory);
 agent.profiles[0].name='Perfil inventado';w.set('agents/academic/agent.yaml',agent);
 assert(validateProject(w.directory).errors.some(e=>e.includes('Perfil heredado alterado')));
});
test('validador detecta rutas inexistentes y workflows inválidos',t=>{
 const w=workspace(t,{copyProject:true});const wf=readData('workflows/multi-agent/safe-analysis.yaml',w.directory);
 wf.steps[0].tool='missing-tool';wf.steps[1].input_from='future.records';w.set('workflows/multi-agent/safe-analysis.yaml',wf);
 const agent=readData('agents/legal/agent.yaml',w.directory);agent.instructions='agents/legal/missing.md';w.set('agents/legal/agent.yaml',agent);
 const report=validateProject(w.directory);assert.equal(report.ok,false);
 assert(report.errors.some(e=>e.includes('No existe')));assert(report.errors.some(e=>e.includes('paso previo')));
});
test('validador detecta ciclos de skills y red habilitada',t=>{
 const w=workspace(t,{copyProject:true});const skill=readData('skills/shared/task-planning/skill.yaml',w.directory);
 skill.dependencies=['task-planning'];w.set('skills/shared/task-planning/skill.yaml',skill);
 const network=readData('policies/network.yaml',w.directory);network.enabled=true;w.set('policies/network.yaml',network);
 const report=validateProject(w.directory);assert(report.errors.some(e=>e.includes('Ciclo')));
 assert(report.errors.some(e=>e.includes('network.yaml')&&e.includes('constante')));
});
test('validador rechaza manifiestos con forma incorrecta sin abortar el informe',t=>{
 const w=workspace(t,{copyProject:true});
 w.set('tools/browser/browser-query.yaml',null);
 const agent=readData('agents/software/agent.yaml',w.directory);delete agent.delegation;w.set('agents/software/agent.yaml',agent);
 const report=validateProject(w.directory);assert.equal(report.ok,false);
 assert(report.errors.some(e=>e.includes('manifiesto debe ser objeto')));
 assert(report.errors.some(e=>e.includes('falta delegation')));
});
