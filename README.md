# Agentes personales

Proyecto local en `C:\Users\vicen\Documents\Agentes`, repositorio [Agents](https://github.com/vfigueroap/Agents). Contiene 12 agentes principales y 85 roles identificables: 12 orquestadores y 73 especialistas, incluidos los 12 responsables de memoria. Las 16 skills anteriores se conservan y se añaden coordinación de equipos, memoria, fitness y una skill de coordinación por área.

Cada principal tiene `AGENTS.md`, `.agents/equipo.json`, `.agents/skills/`, `conexiones/`, `api/`, `mcp/`, `plugins/`, `herramientas/`, `hooks/` y `reportes/`. El catálogo JSON es la fuente de verdad para identificar y asignar responsabilidades. Los perfiles de `.codex/agents/` se generan desde esos catálogos.

| Principal | ID del orquestador | Responsabilidades del equipo |
| --- | --- | --- |
| Compañero de Universidad | `uni-orquestador` | Presentaciones, apuntes, fuentes, resumen, PowerPoint, ejercicios, revisión y memoria |
| Desarrollador de software | `dev-orquestador` | Exploración, arquitectura, frontend, backend, datos, pruebas, revisión y memoria |
| Profesor-Tutor | `tutor-orquestador` | Diagnóstico, tutoría socrática, ejemplos, práctica, evaluación, repaso y memoria |
| Emprendedor-Builder | `builder-orquestador` | Problema, mercado, producto, prototipo, finanzas, ventas y memoria |
| Administrador de sistemas | `sys-orquestador` | Inventario, incidentes, sistemas, contenedores, redes, recuperación y memoria |
| Fitness Coach | `fit-orquestador` | Objetivos, rutina, técnica, registro, progreso y memoria |
| Ingeniero | `ing-orquestador` | Modelo, simulación, optimización, validación y memoria |
| Marketero | `mkt-orquestador` | Audiencia, contenido, SEO, métricas y memoria |
| Abogado en practica | `legal-orquestador` | Fuentes, normativa, contratos, riesgos y memoria |
| Finanzas | `fin-orquestador` | Estados, presupuesto, escenarios, riesgos y memoria |
| Gestor Comercial | `sales-orquestador` | Prospectos, CRM, propuestas, negociación y memoria |
| Asistente Personal | `vida-orquestador` | Agenda, tareas, documentos, hábitos y memoria |

Las seis áreas adicionales se recuperaron como propósitos del catálogo del respaldo anterior. Se conservaron los cambios locales existentes; el runtime anterior y sus archivos eliminados no se restauraron.

## Hermes y dashboard

La [guía del homelab](homelab/README.md) prepara Ubuntu con tres perfiles Hermes, suscripción ChatGPT/Codex, un gateway y telemetría sin modelo. Las nueve áreas del dashboard son independientes de los equipos especialistas. El [contexto Hermes](.hermes.md) y la [skill de publicación](.agents/skills/personal-os-dashboard/SKILL.md) conectan las evidencias con Personal-OS sin compartir credenciales de Supabase.

```powershell
node herramientas/homelab.mjs check
node herramientas/dashboard.mjs validate homelab/delivery.example.json
```

El publicador escribe JSON atómico en una bandeja local; el worker de Personal-OS valida y publica. Documentos y credenciales quedan en el HP. Un timer observa recursos y servicios cada 30 segundos; la inferencia automática usa el cron oficial de Hermes y respeta la pausa reciente del portal. La configuración no acredita que los servicios o cuentas estén ya activos en el HP.

## Uso con Codex

Abre este proyecto en Codex para que lea `AGENTS.md`. También puedes abrir una de las áreas para trabajar con su contexto. Una petición como esta permite seleccionar el equipo:

> Usa Compañero de Universidad para analizar estas presentaciones y mis apuntes, generar un resumen y preparar un PPT. Delega las lecturas independientes y registra los resultados en reportes.

El orquestador elige los roles pertinentes y respeta dependencias, rutas de escritura y concurrencia disponible. Cada rol tiene un ID estable; cada ejecución tiene además el ID runtime devuelto por la herramienta de subagentes. La lista de 85 roles no implica 85 procesos simultáneos. Los agentes se ejecutan durante la sesión y usan su modelo, herramientas y permisos.

Los perfiles nativos usan el formato TOML autónomo documentado por [OpenAI](https://developers.openai.com/codex/subagents). Cuando el host no expone selección de roles personalizados, el orquestador obtiene el encargo con la CLI y entrega las instrucciones a un subagente genérico. Los perfiles quedan preparados para una sesión que cargue este proyecto; la instalación no modifica una conversación ya abierta ni acredita que todos hayan sido invocados.

## Tareas y memoria

Requiere Node 22 o posterior, sin dependencias adicionales. Los comandos se ejecutan desde la raíz:

```powershell
node herramientas/agentes.mjs listar universidad
node herramientas/agentes.mjs encargo uni-presentaciones "Analizar la clase aportada con referencias por diapositiva"
node herramientas/agentes.mjs asignar uni-presentaciones "Analizar la clase aportada con referencias por diapositiva"
node herramientas/agentes.mjs estado universidad
```

`asignar` devuelve un UUID y deja la tarea pendiente. El orquestador entrega el encargo al ejecutor real y registra su identificador. Reemplaza `TASK_UUID`, `RUNTIME_ID` y la ruta del informe por los valores obtenidos:

```powershell
node herramientas/agentes.mjs iniciar TASK_UUID RUNTIME_ID
node herramientas/agentes.mjs bloquear TASK_UUID "Falta el archivo de la clase"
node herramientas/agentes.mjs iniciar TASK_UUID RUNTIME_ID
node herramientas/agentes.mjs cerrar TASK_UUID "Compañero de Universidad/reportes/informe-clase.md"
```

El cierre exige una tarea en curso y un Markdown no vacío dentro de `reportes` del área. Conserva la ruta y el SHA256 del informe y añade un vínculo a `MEMORIA.md`, sin borrar lo anterior. Repetir el mismo cierre es idempotente; también permite completar el registro en memoria si se interrumpió tras guardar el estado. El informe y su hash acreditan qué se guardó, mientras el orquestador verifica la calidad del resultado.

Los estados son `pendiente`, `en_curso`, `bloqueada` y `completada`. Los comandos devuelven JSON y salen con código distinto de cero ante errores. Hay un lock de escritura compartido para evitar perder actualizaciones concurrentes. Si una escritura está activa, reintenta al terminar; tras un cierre forzado comprueba que ya no quede proceso antes de retirar `.agents/tareas.lock`.

La CLI registra y prepara trabajo; Codex ejecuta los modelos y sus herramientas. Los flujos del catálogo describen dependencias para el orquestador, sin programar trabajos en segundo plano. Los directorios `hooks` documentan las transiciones efectivas de la CLI; no registran callbacks automáticos en el host.

Cada responsable `*-memoria` conserva hechos, fuentes, decisiones, resultados, límites y pendientes. Los informes y tareas personales están excluidos de Git; solo el README de cada `reportes` se versiona. En un clon limpio, listar y generar encargos funcionan sin memoria previa; la primera asignación del área crea `MEMORIA.md` sin sobrescribir archivos existentes. OneDrive puede sincronizar esa memoria con tu cuenta. No guardes credenciales allí.

## Integraciones y recursos

[conexiones/catalogo.json](conexiones/catalogo.json) distingue autenticación verificada, herramientas disponibles y candidatos. GitHub, Google Drive, Gmail y Google Calendar respondieron a una consulta de perfil el 15 de noviembre de 2026. Eso no comprueba todas sus operaciones ni comparte OAuth con un proceso Node independiente.

Los plugins y skills de documentos, PDF, presentaciones, hojas de cálculo y escritorio se usan según el entregable. Vercel y Supabase tienen herramientas disponibles en esta sesión, con cuenta y proyecto aún por verificar. Garmin, banca, homelab, CRM y redes sociales carecen de integración comprobada. No se añadieron servidores MCP ni credenciales, y no se cambiaron permisos globales.

El inventario opcional de este equipo (`.agents/recursos-locales.json`, excluido de Git) referencia archivos existentes y evita copiar catálogos completos. La ruta UniversidadTools mencionada en los criterios académicos no se localizó en el escaneo acotado; verifica el ejecutable antes de convertir documentos o usar OCR.

El inventario local y la revisión de las 44 estrellas públicas de GitHub se guardan en `reportes/`. Se revisaron cabeceras y secciones de README de 18 candidatas; no se auditó su código. Se aplicaron ideas de responsabilidades claras, tutoría socrática, procedencia de documentos y separación de entrenamiento previsto y realizado. No se copió ni ejecutó software de terceros.

## Mantenimiento

Edita el catálogo del área para cambiar roles, habilidades o flujos y su `AGENTS.md` para instrucciones compartidas. Después ejecuta:

```powershell
node herramientas/agentes.mjs validar
node herramientas/sincronizar-codex.mjs
node herramientas/sincronizar-codex.mjs --check
node --test herramientas/*.test.mjs
```

La sincronización conserva perfiles manuales y detecta perfiles generados obsoletos. Revisa las diferencias antes de publicar; el repositorio ya contenía cambios y eliminaciones anteriores a esta implementación. Añade capacidades según tareas reales y registra sus pruebas en reportes; una referencia o carpeta por sí sola no demuestra una integración.
