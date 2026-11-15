import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { exportBundle } from '../adapters/export.mjs';
import { workspace,testLink } from './helpers.mjs';

for(const [runtime,file] of Object.entries({codex:'AGENTS.md',cursor:'.cursor/rules/project.mdc','claude-code':'CLAUDE.md',hermes:'bundle.md'})){
 test(`exportación ${runtime} y comprobación idempotente de hashes`,t=>{
   const w=workspace(t,{generated:true});
   const args={runtime,agentId:'software',out:w.relative};
   const result=exportBundle(args);assert.equal(result.verified_in_runtime,false);
   assert(fs.existsSync(path.join(w.directory,file)));
   assert.equal(exportBundle({...args,check:true}).status,'checked');
   assert.equal(exportBundle(args).files,result.files);
   const manifest=JSON.parse(fs.readFileSync(path.join(w.directory,'manifest.json'),'utf8'));
   assert(manifest.sources['agents/software/AGENTS.md']);
   assert(manifest.sources['skills/software/software-delivery/SKILL.md']);
   assert(!fs.existsSync(path.join(w.directory,'skills/word/SKILL.md')));
   if(runtime==='cursor')assert.match(fs.readFileSync(path.join(w.directory,file),'utf8'),/^---\ndescription:.*\nalwaysApply: true\n---/u);
 });
}
test('no sobrescribe una salida modificada ni la acepta como vigente',t=>{
 const w=workspace(t,{generated:true});const args={runtime:'codex',agentId:'software',out:w.relative};
 exportBundle(args);const file=path.join(w.directory,'AGENTS.md');fs.writeFileSync(file,'Cambio ficticio que se preserva');
 assert.throws(()=>exportBundle({...args,check:true}),/distinto u obsoleto/u);
 assert.throws(()=>exportBundle(args),/distinto u obsoleto/u);
 assert.equal(fs.readFileSync(file,'utf8'),'Cambio ficticio que se preserva');
});
test('detecta cambios de fuente aunque el bundle anterior esté intacto',t=>{
 const w=workspace(t,{copyProject:true});
 const args={runtime:'codex',agentId:'software',out:'generated/test-source',root:w.directory};
 exportBundle(args);fs.appendFileSync(path.join(w.directory,'agents/software/AGENTS.md'),'\nAclaración ficticia.\n');
 assert.throws(()=>exportBundle({...args,check:true}),/distinto u obsoleto/u);
});
test('salida desconocida, ruta de escape y enlaces se rechazan',t=>{
 assert.throws(()=>exportBundle({runtime:'invalid',agentId:'software',out:'generated/demo'}),/desconocido/u);
 assert.throws(()=>exportBundle({runtime:'codex',agentId:'software',out:'../outside'}),/generated/u);
 assert.throws(()=>exportBundle({runtime:'codex',agentId:'software',out:'generated/../../outside'}),/Ruta/u);
 const w=workspace(t,{generated:true});fs.mkdirSync(path.join(w.directory,'target'));
 const link=testLink(t,path.join(w.directory,'target'),path.join(w.directory,'link'));
 assert.throws(()=>exportBundle({runtime:'codex',agentId:'software',out:`${w.relative}/${path.basename(link)}`}),/Enlace/u);
});
test('exportador rechaza archivos ajenos y check de salida ausente',t=>{
 const w=workspace(t,{generated:true});fs.writeFileSync(path.join(w.directory,'foreign.txt'),'Contenido ficticio');
 assert.throws(()=>exportBundle({runtime:'codex',agentId:'software',out:w.relative}),/ajenos/u);
 const absent=workspace(t,{generated:true});
 assert.throws(()=>exportBundle({runtime:'codex',agentId:'software',out:absent.relative,check:true}),/Falta archivo/u);
});
