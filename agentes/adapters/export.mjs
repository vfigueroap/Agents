import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { ROOT,safePath,walk } from '../lib/paths.mjs';
import { readData,readText,getAgent } from '../lib/data.mjs';
import { validateProject } from '../lib/validate.mjs';

const RUNTIMES=Object.freeze({codex:'AGENTS.md','claude-code':'CLAUDE.md',
  cursor:'.cursor/rules/project.mdc',hermes:'bundle.md'});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const posix=value=>value.split(path.sep).join('/');

export function exportBundle({runtime,agentId,out,check=false,root=ROOT}) {
  if(!Object.hasOwn(RUNTIMES,runtime))throw new Error('Runtime desconocido');
  if(typeof out!=='string'||!out.startsWith('generated/'))throw new Error('Salida debe estar dentro de generated/');
  const destination=safePath(root,out,{mustExist:false});
  const validation=validateProject(root);
  if(!validation.ok)throw new Error(`Proyecto inválido: ${validation.errors.join('; ')}`);
  const agent=getAgent(agentId,root);
  const registry=readData('config/agents.yaml',root);
  const agentPath=[registry.orchestrator,...registry.agents].find(file=>readData(file,root).id===agentId);
  const sources=new Map();
  const source=file=>{const value=readText(file,root);sources.set(file,hash(value));return value;};
  const instructionFile=RUNTIMES[runtime];
  const instructionDirectory=path.dirname(path.join(destination,instructionFile));
  const rewrite=(content,file)=>content.replace(/\[([^\]]*)\]\(([^)]+)\)/gu,(whole,label,target)=>{
    if(/^https?:\/\//u.test(target)||target.startsWith('#'))return whole;
    const [local,fragment]=target.split('#');
    const canonical=safePath(root,path.posix.normalize(path.posix.join(path.posix.dirname(file),local)));
    return `[${label}](${posix(path.relative(instructionDirectory,canonical))}${fragment?`#${fragment}`:''})`;
  });
  const general=rewrite(source('AGENTS.md'),'AGENTS.md');
  const specific=rewrite(source(agent.instructions),agent.instructions);
  source(agentPath);source(`adapters/${runtime}/adapter.yaml`);
  for(const file of ['policies/permissions.yaml','policies/approvals.yaml','policies/network.yaml','config/agents.yaml'])source(file);
  if(agentId==='orchestrator')for(const file of ['orchestrator/router.yaml','orchestrator/delegation.yaml'])source(file);
  const outputs=new Map();
  const skills=walk(root,'skills').filter(file=>file.endsWith('/skill.yaml')).map(file=>({file,data:readData(file,root)}));
  const skillIndex=[];
  const selectedSkills=new Set();
  function includeSkill(id){
    if(selectedSkills.has(id))return;
    const found=skills.find(item=>item.data.id===id);
    if(!found||found.data.status!=='implemented')throw new Error(`Skill no publicable: ${id}`);
    selectedSkills.add(id);
    for(const dep of found.data.dependencies)includeSkill(dep);
    source(found.file);
    outputs.set(`skills/${id}/SKILL.md`,source(found.data.instructions));
    const location=posix(path.relative(instructionDirectory,path.join(destination,`skills/${id}/SKILL.md`)));
    skillIndex.push(`- ${id}: [cargar cuando corresponda](${location}).`);
  }
  for(const id of agent.skills)includeSkill(id);
  const relativeRoot=posix(path.relative(instructionDirectory,root));
  let text=`<!-- Generado: editar únicamente las fuentes canónicas. -->\n\n# Bundle ${runtime}: ${agentId}\n\nRaíz canónica relativa a este archivo: \`${relativeRoot}\`. Los comandos y rutas de desarrollo pertenecen a esa raíz. Este bundle requiere conservar el repositorio original. No configura herramientas, conexiones, permisos ni hooks del runtime externo.\n\n${general}\n\n${specific}\n\n## Skills disponibles bajo demanda\n\n${skillIndex.join('\n')}\n`;
  if(runtime==='cursor')text=`---\ndescription: Instrucciones generadas de Personal AI OS para ${agentId}\nalwaysApply: true\n---\n\n${text}`;
  outputs.set(instructionFile,text);
  outputs.set('agent.snapshot.json',`${JSON.stringify(agent,null,2)}\n`);
  outputs.set('manifest.json',`${JSON.stringify({schema_version:'1.0',runtime,agent:agentId,status:'export_only',
    verified_in_runtime:false,sources:Object.fromEntries([...sources].sort()),
    outputs:Object.fromEntries([...outputs].map(([file,value])=>[file,hash(value)]).sort())},null,2)}\n`);
  // Preflight completo: nunca sobrescribe un archivo distinto, ni sigue enlaces.
  const existing=fs.existsSync(destination)?walk(root,out,new Set()):[];
  for(const file of existing)if(!outputs.has(file.slice(out.length+1)))throw new Error('Salida contiene archivos ajenos al bundle');
  for(const [file,value] of outputs){
    const target=safePath(root,`${out}/${file}`,{mustExist:false});
    if(fs.existsSync(target)&&fs.readFileSync(target,'utf8')!==value)throw new Error(`Bundle distinto u obsoleto: ${file}. Usar otra salida y revisar diferencias.`);
    if(check&&!fs.existsSync(target))throw new Error(`Falta archivo generado: ${file}`);
  }
  if(!check)for(const [file,value] of outputs){
    const target=safePath(root,`${out}/${file}`,{mustExist:false});
    fs.mkdirSync(path.dirname(target),{recursive:true});
    if(!fs.existsSync(target))fs.writeFileSync(target,value,{flag:'wx'});
  }
  return {runtime,agent:agentId,status:check?'checked':'exported',files:outputs.size,out,verified_in_runtime:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{
    const args=process.argv.slice(2),values={};
    for(let i=0;i<args.length;i++){
      if(args[i]==='--check'){values.check=true;continue;}
      const name={'--runtime':'runtime','--agent':'agentId','--out':'out'}[args[i]];
      if(!name||!args[i+1])throw new Error('Uso: --runtime <id> --agent <id> --out generated/<nombre> [--check]');
      values[name]=args[++i];
    }
    console.log(JSON.stringify(exportBundle(values),null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
