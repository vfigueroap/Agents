export function onError(emit, context) { emit('on-error', {...context,status:'denied'}); }
