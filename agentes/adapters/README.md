# Exportadores locales y compatibilidad

`export.mjs` genera artefactos desde AGENTS.md raíz, agent.yaml, AGENTS.md del
agente y sus skills canónicas. Publica solo las skills declaradas y dependencias,
con un índice para carga bajo demanda. No instala esas skills en el catálogo
nativo de ningún runtime. Los hashes SHA-256 detectan cambios de fuente o salida.

Desde la raíz del proyecto:

```sh
node adapters/export.mjs --runtime codex --agent software --out generated/codex-software
node adapters/export.mjs --runtime codex --agent software --out generated/codex-software --check
```

Para regenerar una versión distinta use otra carpeta, revise las diferencias y
retire la anterior manualmente. No se sobrescriben cambios existentes. La salida
se limita a generated/ dentro del proyecto y rechaza enlaces simbólicos. Las
referencias a instrucciones originales dependen de conservar el repositorio.

| Adapter | Artefacto implementado | Compatibilidad externa | Pendiente |
| --- | --- | --- | --- |
| Codex | AGENTS.md + skills + manifiesto | Convención documentada de AGENTS.md | Probar carga en versión instalada y mapear herramientas aisladas |
| Cursor | .cursor/rules/project.mdc + skills + manifiesto | Convención documentada .mdc | Probar carga y límites con versión instalada |
| Claude Code | CLAUDE.md + skills + manifiesto | Convención documentada CLAUDE.md | Probar carga y capacidades en versión instalada |
| Hermes | bundle.md neutral + skills + manifiesto | El sistema de skills está documentado | Elegir importación y contrato de instrucciones de la versión instalada |

La generación offline y la comprobación de hashes son funcionales. Ningún adapter
ejecuta su runtime ni tiene `verified_in_runtime: true`. Los manifiestos de agente
son snapshots informativos, no configuraciones nativas de subagentes. No hay
traducción de hooks, conexión MCP, scheduler, permisos del SO o broker de aprobación.
Un runtime con terminal propia podría eludir este dispatcher; requiere control
externo de permisos antes de confiarle acciones reales.

Convenciones consultadas el 14 de noviembre de 2026:

- [Codex: instrucciones AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
- [Claude Code: memoria e instrucciones CLAUDE.md](https://code.claude.com/docs/en/memory).
- [Cursor: reglas de proyecto .mdc](https://cursor.com/docs/rules).
- [Hermes: sistema de skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills).

Estas referencias documentan formatos; no acreditan la instalación o compatibilidad
de los equipos del proyecto. No se usa el Site privado como almacenamiento ni se
presupone sincronización entre su estado de navegador y este directorio.
