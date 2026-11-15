import { routeTask } from '../lib/orchestrator.mjs';
try { console.log(JSON.stringify(routeTask(process.argv.slice(2).join(' ')),null,2)); }
catch(error) { console.error(error.message);process.exitCode=1; }
