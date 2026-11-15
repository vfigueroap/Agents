import fs from 'node:fs';
import path from 'node:path';
import { ROOT,safePath,walk } from './paths.mjs';
import { readData,readText } from './data.mjs';
import { validateSchema,assertSupported } from './schema.mjs';
import { SENSITIVE_ACTIONS,LOCAL_ACTIONS } from './security.mjs';

const DOMAINS=['personal','academic','engineering','software','infrastructure','finance','business','marketing','commercial','legal'];
const LEGACY={
  'abogado-practica':['Abogado en práctica','legal'],
  'administrador-sistemas':['Administrador de sistemas','infrastructure'],
  'companero-universidad':['Compañero de Universidad','academic'],
  'desarrollador-software':['Desarrollador de software','software'],
  'emprendedor-builder':['Emprendedor-Builder','business'],
  'ingeniero':['Ingeniero','engineering'],
  'marketero':['Marketero','marketing'],
  'profesor-tutor':['Profesor-Tutor','academic']
};
export function validateProject(root=ROOT) {
  const errors=[];
  const check=(condition,message)=>{ if(!condition)errors.push(message); };
  const attempt=(label,fn)=>{try{return fn();}catch(error){errors.push(`${label}: ${error.message}`);return undefined;}};
  const files=attempt('árbol',()=>walk(root))??[];
  const documents=new Map(),schemas=new Map();
  for(const file of files.filter(f=>f.startsWith('schemas/')&&f.endsWith('.schema.json'))) {
    const value=attempt(file,()=>readData(file,root));
    if(value) { attempt(file,()=>assertSupported(value));schemas.set(path.posix.basename(file,'.schema.json'),value); }
  }
  for(const file of files.filter(f=>f.endsWith('.yaml')||f.endsWith('.yml'))) {
    const value=attempt(file,()=>readData(file,root));
    if(value===undefined)continue;
    if(!value||typeof value!=='object'||Array.isArray(value)){errors.push(`${file}: manifiesto debe ser objeto`);continue;}
    const schema=schemas.get(value.kind);
    check(!!schema,`${file}: kind desconocido o sin schema`);
    const invalid=schema?attempt(file,()=>validateSchema(value,schema)):undefined;
    if(invalid)errors.push(...invalid.map(e=>`${file}: ${e}`));
    if(schema&&invalid?.length===0)documents.set(file,value);
  }
  const operational=[...documents].filter(([file])=>!file.startsWith('templates/'));
  const grouped=kind=>operational.filter(([,value])=>value.kind===kind);
  const byId=kind=>{
    const map=new Map();
    for(const [file,value] of grouped(kind)) {
      check(!map.has(value.id),`${file}: id ${kind} duplicado ${value.id}`);
      map.set(value.id,value);
    } return map;
  };
  const agents=byId('agent'),skills=byId('skill'),tools=byId('tool'),connections=byId('connection');
  const policy=documents.get('policies/permissions.yaml');
  check(!!policy,'Falta política de permisos');
  if(policy){
    check(SENSITIVE_ACTIONS.every(action=>policy.hard_deny?.includes(action)),'Bloqueos sensibles incompletos');
    check(policy.allow?.every(action=>LOCAL_ACTIONS.includes(action)),'Política permite acción no implementada');
  }
  const reference=(file,rel)=>attempt(`${file} -> ${rel}`,()=>safePath(root,rel));
  const allAgents=[...documents].filter(([,value])=>value.kind==='agent');
  for(const [file,agent] of allAgents) attempt(file,()=>{
    reference(file,agent.instructions);
    reference(file,agent.approval_policy);
    check(path.posix.dirname(file)===path.posix.dirname(agent.instructions),`${file}: instrucciones deben pertenecer al mismo componente`);
    for(const sid of agent.skills){check(skills.has(sid),`${file}: skill inexistente ${sid}`);check(skills.get(sid)?.status==='implemented',`${file}: skill pendiente no activable ${sid}`);}
    for(const tid of agent.tools){check(tools.has(tid),`${file}: herramienta inexistente ${tid}`);check(tools.get(tid)?.status==='implemented',`${file}: herramienta no implementada ${tid}`);}
    for(const cid of agent.connections)check(connections.has(cid),`${file}: conexión inexistente ${cid}`);
    for(const target of agent.delegation.allowed_agents)check(agents.has(target)&&target!==agent.id,`${file}: delegación inválida ${target}`);
    check(agent.permissions.allow.every(action=>LOCAL_ACTIONS.includes(action)&&policy?.allow?.includes(action)),`${file}: permisos excesivos`);
    check(!agent.permissions.allow.some(action=>agent.permissions.deny.includes(action)),`${file}: permiso simultáneamente permitido y denegado`);
    check(SENSITIVE_ACTIONS.every(action=>agent.permissions.deny.includes(action)),`${file}: debe declarar límites sensibles`);
    for(const tid of agent.tools)check(agent.permissions.allow.includes(tools.get(tid)?.action),`${file}: herramienta sin permiso ${tid}`);
  });
  const registry=documents.get('config/agents.yaml');
  attempt('registro',()=>{
    if(!registry)throw new Error('falta config/agents.yaml');
    const paths=[registry.orchestrator,...registry.agents];
    check(new Set(paths).size===paths.length,'Rutas duplicadas en registro');
    check(registry.orchestrator==='orchestrator/agent.yaml','Orquestador canónico incorrecto');
    for(const rel of paths) { reference('registro',rel);check(documents.get(rel)?.kind==='agent',`Registro apunta a documento que no es agente: ${rel}`); }
    for(const [file] of grouped('agent'))check(paths.includes(file),`Agente no registrado: ${file}`);
    for(const domain of DOMAINS)check(registry.agents.some(rel=>documents.get(rel)?.domain===domain),`Dominio sin agente: ${domain}`);
    for(const domain of ['personal','finance','commercial'])check(agents.get(domain)?.status==='proposed',`Dominio nuevo debe figurar propuesto: ${domain}`);
  });
  const profiles=new Map();
  for(const [file,agent] of grouped('agent'))for(const profile of agent.profiles??[]) {
    check(!profiles.has(profile.id),`${file}: perfil heredado duplicado`);
    profiles.set(profile.id,{...profile,domain:agent.domain});
  }
  check(profiles.size===8,'Deben preservarse exactamente ocho perfiles heredados');
  for(const [id,[name,domain]] of Object.entries(LEGACY)){
    const actual=profiles.get(id);check(actual?.name===name&&actual?.domain===domain&&actual?.migration_status==='pending'&&actual?.source_instructions===null,`Perfil heredado alterado: ${id}`);
  }
  const skillDocs=[...documents].filter(([,value])=>value.kind==='skill');
  for(const [file,skill] of skillDocs)attempt(file,()=>{
    const content=readText(skill.instructions,root);
    const match=/^---\r?\n([\s\S]+?)\r?\n---\r?\n/u.exec(content);
    check(!!match,`${file}: SKILL.md sin frontmatter`);
    const metadata=Object.fromEntries((match?.[1]??'').split(/\r?\n/u).map(line=>{const i=line.indexOf(':');return [line.slice(0,i).trim(),line.slice(i+1).trim()];}));
    check(metadata.name===skill.id&&!!metadata.description,`${file}: frontmatter inconsistente`);
    check(path.posix.dirname(file)===path.posix.dirname(skill.instructions),`${file}: skill fuera de carpeta canónica`);
    for(const dependency of skill.dependencies)check(skills.has(dependency),`${file}: dependencia inexistente ${dependency}`);
    for(const tid of skill.tools)check(tools.has(tid),`${file}: herramienta inexistente ${tid}`);
    for(const cid of skill.connections)check(connections.has(cid),`${file}: conexión inexistente ${cid}`);
  });
  const visited=new Set(),active=new Set();
  function visitSkill(id){
    if(active.has(id)){errors.push(`Ciclo de skills: ${id}`);return;}
    if(visited.has(id))return;
    active.add(id);for(const dep of skills.get(id)?.dependencies??[])visitSkill(dep);active.delete(id);visited.add(id);
  }
  for(const sid of skills.keys())visitSkill(sid);
  for(const sid of ['corrector','latex','ppt','profesor','word'])check(skills.get(sid)?.status==='migration_pending',`Reserva de migración ausente: ${sid}`);
  for(const [file,tool] of [...documents].filter(([,v])=>v.kind==='tool'))attempt(file,()=>{
    for(const rel of [tool.inputs,tool.outputs]){reference(file,rel);check(rel.startsWith('schemas/')&&rel.endsWith('.schema.json'),`${file}: contrato de entrada/salida inválido`);}
    for(const cid of tool.connections)check(connections.has(cid),`${file}: conexión de herramienta inexistente ${cid}`);
    if(tool.status==='implemented'){
      const expected={'fixture-read':'files.read_fixture','summarize-records':'analysis.summarize'}[tool.id];
      check(!!expected&&tool.action===expected&&tool.implementation===tool.id&&tool.execution==='local'&&tool.side_effects==='none'&&tool.connections.length===0&&tool.approval==='not_required',`${file}: binding ejecutable inválido`);
      check(tool.permissions.length===1&&tool.permissions[0]===expected,`${file}: permisos de herramienta excesivos`);
    }else check(tool.implementation===null,`${file}: herramienta planificada no puede declarar ejecutor`);
  });
  const router=documents.get('orchestrator/router.yaml');
  check(!!router,'Falta router');
  for(const route of router?.routes??[])check(agents.has(route.agent),`Router: agente desconocido ${route.agent}`);
  for(const domain of DOMAINS)check(router?.routes?.some(r=>r.agent===domain),`Router: dominio sin ruta ${domain}`);
  check(new Set(router?.routes?.map(r=>r.agent)).size===router?.routes?.length,'Router: destinos duplicados');
  const delegation=documents.get('orchestrator/delegation.yaml');
  check(!!delegation,'Falta política de delegación');
  for(const [file,agent] of allAgents){
    check(agent.delegation?.max_depth<=delegation?.max_depth,`${file}: profundidad mayor que límite global`);
    check(agent.delegation?.max_tasks<=delegation?.max_tasks,`${file}: cantidad mayor que límite global`);
  }
  for(const [file,wf] of grouped('workflow'))attempt(file,()=>{
    const steps=new Map();
    check(wf.steps.length<=wf.max_steps,`${file}: demasiados pasos`);
    for(const step of wf.steps){
      check(!steps.has(step.id),`${file}: paso duplicado`);
      const tool=tools.get(step.tool),agent=agents.get(step.agent);
      check(!!tool&&!!agent,`${file}: referencia de paso inexistente`);
      check(agent?.tools?.includes(step.tool),`${file}: herramienta no autorizada al agente`);
      check(agents.get('orchestrator')?.delegation.allowed_agents.includes(step.agent),`${file}: orquestador no delega a ${step.agent}`);
      if(wf.status==='local_demo')check(tool?.status==='implemented',`${file}: demo usa herramienta planificada`);
      if(step.input_from!==null){
        const match=/^([a-z][a-z0-9-]*)\.records$/u.exec(step.input_from);
        check(!!match&&steps.has(match?.[1]),`${file}: dependencia debe apuntar a un paso previo`);
        check(step.tool==='summarize-records',`${file}: binding de dependencia no implementado`);
      }else if(tool){
        const inputSchema=readData(tool.inputs,root);
        errors.push(...validateSchema(step.input,inputSchema).map(e=>`${file}: ${e}`));
      }
      steps.set(step.id,step);
    }
  });
  for(const [file,hooks] of grouped('hooks'))for(const event of hooks.events??[])reference(file,event.handler);
  const catalog=documents.get('references/catalog.yaml');
  check(!!catalog,'Falta catálogo');
  if(catalog){check(new Set(catalog.repositories.map(r=>r.id)).size===27,'Catálogo duplicado');for(const repo of catalog.repositories)check(repo.url===`https://github.com/${repo.id}`,'URL de catálogo inconsistente');}
  // Se comprueban los enlaces locales de Markdown, no disponibilidad de URLs remotas.
  for(const file of files.filter(f=>f.endsWith('.md')))attempt(file,()=>{
    for(const match of readText(file,root).matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)){
      const target=match[1].split('#')[0];
      if(!target||/^https?:\/\//u.test(target))continue;
      const rel=path.posix.normalize(path.posix.join(path.posix.dirname(file),target));
      reference(file,rel);
    }
  });
  for(const [file,schemaName] of [['examples/fixtures/fictional-records.json','fixture-output'],['memory/example.synthetic.json','memory-record']])attempt(file,()=>errors.push(...validateSchema(readData(file,root),schemas.get(schemaName)).map(e=>`${file}: ${e}`)));
  for(const file of files){
    check(!/(^|\/)\.env(?:\.|$)/u.test(file)||file==='.env.example',`Posible secreto versionado: ${file}`);
    check(!/\.(pem|key|p12|sqlite|db)$/u.test(file),`Archivo privado no permitido: ${file}`);
  }
  return {ok:errors.length===0,errors,counts:{files:files.length,schemas:schemas.size,manifests:documents.size,agents:agents.size,domains:DOMAINS.length,skills:skills.size,tools:tools.size,connections:connections.size,references:catalog?.repositories?.length??0}};
}
