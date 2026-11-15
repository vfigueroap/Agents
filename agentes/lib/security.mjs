import { assertValid } from './schema.mjs';
import { readData } from './data.mjs';
import { ROOT } from './paths.mjs';

// Este bloqueo no se puede eliminar editando un prompt ni enviando approval=true.
export const SENSITIVE_ACTIONS = Object.freeze(['finance.transfer','investment.trade',
  'payment.purchase','content.publish','message.external','files.delete',
  'infrastructure.critical','network.expose','permissions.change','legal.commit']);
export const LOCAL_ACTIONS = Object.freeze(['files.read_fixture','analysis.summarize']);

export function authorize(agent, action, root = ROOT) {
  if (SENSITIVE_ACTIONS.includes(action)) throw new Error('Acción sensible bloqueada en esta fase');
  const policy = readData('policies/permissions.yaml', root);
  assertValid(policy, readData('schemas/permissions.schema.json', root), 'política de permisos');
  if (!SENSITIVE_ACTIONS.every(item => policy.hard_deny.includes(item))) throw new Error('Política sensible incompleta');
  if (!LOCAL_ACTIONS.includes(action) || !policy.allow.includes(action) || policy.hard_deny.includes(action) ||
      !agent.permissions.allow.includes(action) || agent.permissions.deny.includes(action)) {
    throw new Error('Permiso denegado por defecto');
  }
  return true;
}
