const identity = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,63}$/u.test(value) ? value : 'unknown';
// Solo metadatos permitidos. Nunca registra solicitudes, contenidos o secretos.
export function auditEvent(event, { agent_id, tool_id, status = 'pending' } = {}) {
  if (!['pre-tool','post-tool','on-error','audit'].includes(event)) throw new Error('Evento no permitido');
  return Object.freeze({event,agent_id:identity(agent_id),tool_id:identity(tool_id),
    status:['pending','completed','denied'].includes(status) ? status : 'denied',timestamp:new Date().toISOString()});
}
