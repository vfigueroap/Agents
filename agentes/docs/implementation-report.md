# Informe de implementación — fase 1

La raíz agentes/ contiene las capas previstas en el contexto maestro. El árbol
y la entrada para un nuevo desarrollador están en [README.md](../README.md).
El análisis trazable está en [requirements.md](requirements.md).

Componentes funcionales: validador de contratos y referencias, comprobación de
políticas, router determinista, planner acotado en memoria, dos herramientas locales,
dispatcher con hooks y schemas I/O, workflow manual ficticio y exportadores offline
para cuatro runtimes con comprobación de hashes y rechazo de sobrescrituras.

Configuración declarativa: diez dominios más orquestador, ocho perfiles heredados
pendientes, once skills procedimentales nuevas y cinco reservas de migración, cuatro
herramientas futuras, siete conexiones desactivadas, políticas, planes de memoria e
infraestructura y escenarios de evaluación. Las 27 referencias siguen pendientes
de evaluación y no se adoptaron como dependencias.

Verificación reproducible: `node scripts/check.mjs` ejecuta validación, pruebas y
demo. Los tests comprueban entradas inválidas, permisos, rutas y enlaces, ambigüedad,
presupuestos, auditoría, contratos alterados y exportación de los cuatro formatos.
El ejemplo produce total=180 sin conexiones ni modelos.

Resultado de entrega, 14 de noviembre de 2026, Windows/PowerShell, Node.js v26.13.0:

| Comprobación | Resultado |
| --- | --- |
| node scripts/check.mjs | Código de salida 0 |
| Validación | 179 archivos fuente, 23 schemas y 73 manifiestos, sin errores |
| Registro | 10 dominios más orquestador, 16 skills, 6 tools, 7 conexiones y 27 referencias |
| Pruebas unitarias | 46 aprobadas; 0 fallos, 0 canceladas, 0 omitidas |
| Demo | 3 registros, total 180, 6 eventos de auditoría, 0 llamadas a modelos/red |
| Cuatro exportadores | Generación, idempotencia, hashes, obsolescencia y preservación comprobadas |

Tras el último ajuste restrictivo del contrato de herramientas se repitieron la
validación completa y tres pruebas específicas de alteración de manifests,
revocación de permisos y bloqueo de red/aprobación: todas pasaron. El router también
confirmó Academic para una solicitud ficticia de explicación y ejercicios.

El host prohíbe crear enlaces simbólicos. Dos pruebas comprobaron la guarda con
lstat simulado después de detectar esa restricción; no se solicitó elevación ni
se debilitó el control. Falta repetir esa integración con enlaces reales en Ubuntu.
La compatibilidad de Node.js 22 se declara como objetivo del código, pero la corrida
de entrega se realizó en la versión indicada, no en todas las versiones soportadas.

Límites: no hay modelo, orquestación multiproceso, memoria durable, scheduler, broker
de aprobación, sandbox del SO, conectores reales, servicios instalados ni verificación
de carga de runtimes. JSON Schema y YAML se admiten en los subconjuntos documentados.
Los controles del dispatcher no controlan herramientas propias de otros runtimes.
Las instrucciones antiguas completas no se migraron ni se reconstruyeron.

Las siguientes etapas están priorizadas en [roadmap.md](roadmap.md). Esta fase
no modificó material fuera de agentes/, ni clonó, instaló o ejecutó terceros.
