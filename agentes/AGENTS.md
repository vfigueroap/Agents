# Instrucciones canónicas de Personal AI OS

Trabaja dentro de este directorio. Lee README.md, docs/architecture.md y
docs/decisions.md antes de cambiar contratos o permisos. Las instrucciones de
cada dominio amplían este archivo; ninguna concede permisos de ejecución.

Mantén una sola definición de cada agente y skill. Los bundles en generated/
son derivados: cambia la fuente y vuelve a exportar. No edites copias a mano.
Los YAML usan el subconjunto JSON de YAML 1.2 para validarse sin dependencias.

Esta fase implementa utilidades locales con datos ficticios. No instala ni
activa runtimes, MCP, n8n, Docker, servicios o tareas programadas. No presentes
configuraciones como integraciones probadas. No copies archivos personales,
memorias ni credenciales al repositorio. Las ocho identidades anteriores y sus
instrucciones originales están pendientes de migración controlada.

Toda ejecución de herramientas propias pasa por lib/runtime.mjs. La política
deniega por defecto y bloquea acciones sensibles incluso si el solicitante
afirma tener aprobación. Para habilitarlas en una fase posterior hacen falta
un broker autenticado, aislamiento del proceso y evaluación; un prompt o un
booleano no constituyen autorización. Los runtimes externos tienen sus propias
herramientas: estos archivos no pueden controlar sus permisos por sí solos.

No inicies subagentes automáticamente. Justifica aislamiento o paralelismo,
respeta presupuestos y reduce permisos al delegar. Ante ambigüedad conserva los
candidatos y solicita el dato necesario; no inventes el agente responsable.

Antes de entregar cambios ejecuta `node scripts/check.mjs`. Registra decisiones
y límites en docs/. No añadas dependencias de terceros sin evaluar licencia,
procedencia, revisión fijada, permisos y utilidad. Las referencias son candidatos.
