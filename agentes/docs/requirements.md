# Extracción del contexto maestro

Fuente: documento `contextomaestrodelproyecto.md`, conservado localmente en
`privado/` en la raíz del espacio de trabajo,
versión 14 de noviembre de 2026. No se copia su enlace privado ni material personal.
La tabla remite a sus secciones; es una síntesis de requisitos, no una nueva fuente
de instrucciones de los agentes anteriores.

| Secciones | Clasificación | Requisito o decisión | Implementación o pendiente |
| --- | --- | --- | --- |
| 1, 5, 25–27 | Confirmado | Plataforma modular híbrida y fase solo de arquitectura | Árbol agentes/, documentación y utilidades offline |
| 2, 4 | Confirmado | HP, Ubuntu 24.04, almacenamiento local, OneDrive fuera del almacenamiento principal | Plan homelab; inventario e instalaciones pendientes |
| 2–4, 25 | Confirmado como dirección | Git privado, Tailscale, Docker, herramientas de desarrollo y n8n posterior | Sin instalación ni conexión en esta fase |
| 3, 6, 14 | Confirmado | Codex, Cursor, Claude Code y Hermes mediante adapters independientes | Exportación local; integración y versiones pendientes |
| 4 | Estado aportado | Site Homelab OS con estado de navegador y JSON | Sin sincronización automática ni secretos |
| 5–6, 10 | Confirmado | Orquestador, dominios, skills y delegación limitada | Router/planner local; coordinación real pendiente |
| 7–8 | Estructura adoptada | Diez dominios, ocho identidades existentes y Academic con dos perfiles | Registro completo; originales pendientes de migración |
| 7.1, 7.6, 7.9, 8 | Propuesta nueva | Personal, Finance y Commercial | status proposed; no declarados preexistentes |
| 7.6, 10 | Propuesta | Subagentes Quantitative y Acquisitions | No creados; justificar mediante evaluación |
| 7.7 | Objetivo futuro | Consultoría de transformación digital con IA, ML, datos y posible equity | Funciones Business y colaboración con Software; sin empresa ni contratos creados |
| 9, 11–14 | Confirmado | AGENTS.md, agent.yaml, SKILL.md y fuente canónica | Contratos, procedimientos y exportadores |
| 9 | Migración pendiente | corrector, latex, ppt, profesor y word | Reservas no activadas, sin inventar instrucciones |
| 13, 15–17 | Confirmado | Contratos, mínimo privilegio, aprobaciones y controles efectivos | Schemas, dispatcher cerrado, acciones sensibles bloqueadas |
| 15 | Integraciones posibles | GitHub, Workspace, archivos, banca, brokers y redes sociales | Conexiones planned/enabled false, sin endpoints ni credenciales |
| 16 | Confirmado como diseño | pre/post tool, error, audit, red, aprobación y pre-commit | Hooks locales y script disponible; hooks externos pendientes |
| 18, 23 | Confirmado | Memoria privada, secretos, logs y datos fuera de Git | Políticas y ejemplo sintético; persistencia pendiente |
| 19 | Propuesta posterior | Workflows y scheduler/n8n | Workflow manual propio; no es export n8n ni automatización activa |
| 20 | Vistas funcionales | Personal OS, Business OS, Financial OS | No generan dominios adicionales |
| 21 | Afirmaciones aportadas sin verificar | Benchmarks y cifras de investigaciones | No usados como evidencia validada ni garantía de diseño |
| 22 | Candidatos | 27 repositorios de referencia | Catálogo pendiente de evaluación; sin adopción |
| 24–27 | Confirmado | Guías, pruebas, migración, recuperación y continuidad | Docs, plantillas, validación y tests locales |

Decisiones abiertas: runtime de orquestación, modelos, hardware, estrategia de
persistencia, proveedor de secretos, versiones de servicios, broker de aprobación,
protocolo entre procesos, inventario de permisos y criterios cuantitativos de
evaluación. Se eligen valores conservadores: ningún modelo, cero costo externo,
red apagada, conexiones sin scopes, sin scheduler, sin herencia automática y sin
ejecutor de acciones sensibles. La razón y las siguientes etapas están en
[decisiones](decisions.md) y [roadmap](roadmap.md).
