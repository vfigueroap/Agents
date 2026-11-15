import assert from 'node:assert/strict';
import { runWorkflow } from '../lib/runtime.mjs';
const result=runWorkflow();
assert.equal(result.results.summarize.total,180);
assert.equal(result.results.summarize.classification,'synthetic');
console.log(JSON.stringify({workflow:result.workflow_id,summary:result.results.summarize,
  audit_events:result.events.length,network_calls:0,model_calls:0},null,2));
