import { validateProject } from '../lib/validate.mjs';
const report=validateProject();
console.log(JSON.stringify(report,null,2));
if(!report.ok)process.exitCode=1;
