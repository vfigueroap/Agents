# Contratos y validación

Cada YAML es JSON formateado válido para YAML 1.2, con schema_version y kind.
El parser rechaza claves duplicadas, incluso con escapes Unicode equivalentes.
El kind selecciona schemas/<kind>.schema.json. Se valida cada manifiesto operativo
y cada plantilla; después se verifican referencias, permisos, identidades heredadas,
registro, dependencias de skills, rutas y enlaces Markdown locales. Los schemas
de entrada y salida de herramientas se comprueban también en cada ejecución.

| Contrato | Elementos principales |
| --- | --- |
| agent | Identidad, propósito, responsabilidades, límites, perfiles, skills, herramientas, conexiones, permisos, delegación, evaluación, I/O y errores |
| skill | Id global, grupo, estado, SKILL.md, herramientas, conexiones, dependencias y evaluación |
| tool | Estado, acción, binding fijo, schemas I/O, permisos, conexiones y efectos |
| connection | Servicios previstos, transporte, clasificación, auth desactivada y scopes vacíos |
| workflow | Trigger manual, pasos con agente/herramienta/entrada, dependencia previa y máximo de pasos |
| router / delegation | Destinos, keywords, ambigüedad, presupuestos y límites |
| permissions / approvals / network | Denegación por defecto, bloqueos sensibles y desactivación de red/aprobaciones |
| adapter | Mecanismo exportado, dependencia externa, pendientes y verificación runtime falsa |
| catalog / evaluation | Candidatos y criterios de revisión; escenarios sin resultados inventados |
| memory-record / task-result | Ejemplos de registro persistible y resultado; no crean almacenamiento |
| configuration | Metadatos de planes con pares key/value y estado; no se interpreta como motor de configuración |

lib/schema.mjs implementa este subconjunto cerrado de draft 2020-12: $schema,
$id, $defs, $ref local a una definición, title, description, type, const, enum,
properties, required, additionalProperties booleano, items, minItems, maxItems,
uniqueItems, minLength, maxLength, pattern, minimum y maximum. No soporta
combinadores, formatos, referencias remotas, coerción ni ejecución de defaults.
Un keyword fuera del subconjunto provoca error, no se ignora. Todos los schemas
entregados usan ese subconjunto. No es una implementación completa del estándar.

Ejemplos reproducibles: examples/fixtures/fictional-records.json y
memory/example.synthetic.json. El workflow valida la salida antes de pasarla al
siguiente paso. Solo admite input_from con forma `paso-previo.records`; no evalúa
expresiones, JavaScript o plantillas provenientes de YAML. El runner no reintenta
acciones ni arranca workflows programados.

`node scripts/validate.mjs` sale con código 1 si encuentra errores. Las pruebas
incluyen documentos inválidos, propiedades desconocidas, dependencias erróneas,
acciones denegadas y escapes de rutas. Un contrato válido no acredita la exactitud
profesional de una respuesta o la compatibilidad con un runtime externo.
