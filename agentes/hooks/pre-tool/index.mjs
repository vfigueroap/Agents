import { authorize } from '../../lib/security.mjs';
export function preTool(agent, tool, root) { return authorize(agent, tool.action, root); }
