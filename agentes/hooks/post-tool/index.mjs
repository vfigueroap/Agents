import { assertValid } from '../../lib/schema.mjs';
export function postTool(result, schema) { return assertValid(result, schema, 'salida de herramienta'); }
