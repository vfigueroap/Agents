import fs from 'node:fs';
import { ROOT, safePath, walk } from './paths.mjs';
import { readData, getAgent,parseData } from './data.mjs';
import { assertValid } from './schema.mjs';
import { preTool } from '../hooks/pre-tool/index.mjs';
import { postTool } from '../hooks/post-tool/index.mjs';
import { onError } from '../hooks/on-error/index.mjs';
import { auditEvent } from '../hooks/audit/index.mjs';

// Lista cerrada: un manifest no puede registrar imports ni comandos arbitrarios.
const BINDINGS = Object.freeze({
  'fixture-read': {action:'files.read_fixture',run(input, root) {
    if (!input.path.startsWith('examples/fixtures/') || !input.path.endsWith('.json')) throw new Error('Solo fixtures JSON');
    const file = safePath(root, input.path);
    const descriptor = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    try {
      const info = fs.fstatSync(descriptor);
      if (!info.isFile() || info.size > 65536) throw new Error('Fixture debe ser archivo de hasta 64 KiB');
      return parseData(fs.readFileSync(descriptor, 'utf8'));
    } finally { fs.closeSync(descriptor); }
  }},
  'summarize-records': {action:'analysis.summarize',run(input) {
    return {classification:'synthetic',count:input.records.length,
      total:input.records.reduce((sum, record) => sum + record.value, 0)};
  }}
});

export function createRuntime({ root = ROOT, auditSink = () => {} } = {}) {
  const events = [];
  const emit = (event, context) => { const item = auditEvent(event,context); auditSink(item); events.push(item); };
  return {
    get events() { return [...events]; },
    runTool(request) {
      const context = {agent_id:request?.agent_id,tool_id:request?.tool_id};
      try {
        emit('pre-tool',context);
        assertValid(request,readData('schemas/action-request.schema.json',root),'solicitud');
        const agent = getAgent(request.agent_id,root);
        assertValid(agent,readData('schemas/agent.schema.json',root),'agente');
        const binding = BINDINGS[request.tool_id];
        if (!Object.hasOwn(BINDINGS,request.tool_id) || !binding || !agent.tools.includes(request.tool_id)) throw new Error('Herramienta no autorizada o sin implementación');
        const manifests = walk(root,'tools').filter(file=>file.endsWith('.yaml')).map(file=>readData(file,root));
        const matching = manifests.filter(tool=>tool.id===request.tool_id);
        if(matching.length!==1) throw new Error('Registro de herramientas ambiguo');
        const tool = matching[0];
        assertValid(tool,readData('schemas/tool.schema.json',root),'herramienta');
        if(tool.status!=='implemented' || tool.execution!=='local' || tool.side_effects!=='none' || tool.approval!=='not_required' ||
           tool.implementation!==request.tool_id || tool.action!==binding.action || tool.connections.length ||
           tool.permissions.length!==1 || tool.permissions[0]!==binding.action) throw new Error('Contrato de ejecutor no permitido');
        preTool(agent,tool,root);
        assertValid(request.input,readData(tool.inputs,root),'entrada de herramienta');
        const result = binding.run(request.input,root);
        postTool(result,readData(tool.outputs,root));
        emit('post-tool',{...context,status:'completed'});
        emit('audit',{...context,status:'completed'});
        return result;
      } catch(error) {
        onError(emit,context);
        emit('audit',{...context,status:'denied'});
        throw error;
      }
    }
  };
}

export function runWorkflow(file = 'workflows/multi-agent/safe-analysis.yaml', {root = ROOT} = {}) {
  const workflow = readData(file,root);
  assertValid(workflow,readData('schemas/workflow.schema.json',root),'workflow');
  if(workflow.status!=='local_demo' || workflow.steps.length>workflow.max_steps) throw new Error('Workflow no ejecutable');
  const runtime = createRuntime({root});
  const orchestrator = getAgent('orchestrator',root);
  const results = Object.create(null);
  for(const step of workflow.steps) {
    if(Object.hasOwn(results,step.id)) throw new Error('ID de paso duplicado');
    if(!orchestrator.delegation.allowed_agents.includes(step.agent)) throw new Error('Dominio no permitido en workflow');
    let input = step.input;
    if(step.input_from!==null) {
      const match = /^([a-z][a-z0-9-]*)\.records$/u.exec(step.input_from);
      if(!match || !Object.hasOwn(results,match[1])) throw new Error('Dependencia previa inexistente');
      input = {records:results[match[1]].records};
    }
    results[step.id] = runtime.runTool({agent_id:step.agent,tool_id:step.tool,input});
  }
  return {workflow_id:workflow.id,results,events:runtime.events};
}
