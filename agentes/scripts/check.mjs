import { spawnSync } from 'node:child_process';
import { ROOT } from '../lib/paths.mjs';
// Invocación de utilidades de desarrollo conocidas; no accesible como tool de agente.
for(const args of [['scripts/validate.mjs'],['--test','tests/'],['examples/safe-demo.mjs']]) {
  const result=spawnSync(process.execPath,args,{cwd:ROOT,stdio:'inherit',shell:false});
  if(result.error){console.error(result.error.message);process.exit(1);}
  if(result.status!==0)process.exit(result.status??1);
}
