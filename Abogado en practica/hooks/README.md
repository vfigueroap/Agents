# Ciclo de tareas de Abogado en práctica

Los hooks efectivos están en la [CLI compartida](../../herramientas/agentes.mjs): `asignar` valida el rol y crea la tarea; `iniciar` vincula el subagente real; `bloquear` registra el motivo; `cerrar` exige informe Markdown local, conserva su hash y añade el cierre a MEMORIA.md.

Usa estos comandos desde el orquestador. Este directorio no registra callbacks automáticos en Codex ni inicia procesos al abrir la carpeta. La consola devuelve errores si el estado, la evidencia o las rutas no son válidos.
