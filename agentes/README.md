# Personal AI OS

[Portada del repositorio](https://github.com/vfigueroap/Agents/blob/main/README.md) ·
[Índice por tarea](docs/README.md) ·
[Dónde está cada cosa](https://github.com/vfigueroap/Agents/blob/main/docs/directorio.md)

Esta carpeta `agentes/` es la fuente canónica del sistema multiagente descrito en
el contexto maestro del 14 de noviembre de 2026. Incluye diez dominios, un
orquestador y utilidades locales verificables. No contiene agentes autónomos
conectados a servicios ni instala infraestructura.

Para continuar el proyecto, leer [AGENTS.md](AGENTS.md),
[arquitectura](docs/architecture.md), [decisiones](docs/decisions.md) y
[pendientes](docs/roadmap.md). La extracción del contexto está en
[requirements.md](docs/requirements.md).

Se necesita Node.js 22 o posterior. No hay paquetes externos ni paso `npm install`.
Desde esta carpeta:

```sh
node scripts/check.mjs
node scripts/route.mjs "explicar ejercicios de universidad"
node examples/safe-demo.mjs
node adapters/export.mjs --runtime codex --agent software --out generated/codex-software
node adapters/export.mjs --runtime codex --agent software --out generated/codex-software --check
```

`check.mjs` valida contratos, referencias y políticas, ejecuta pruebas unitarias
y comprueba el ejemplo ficticio (total esperado: 180). No inicia runtimes ni red.
Todos los YAML son JSON formateado, un subconjunto de YAML 1.2. No usar tags,
anchors, comentarios o sintaxis YAML adicional sin cambiar primero el parser.

```text
agentes/
├── AGENTS.md, README.md, .env.example, .gitignore, package.json
├── orchestrator/       instrucciones, identidad, router y delegación
├── agents/             personal, academic, engineering, software,
│                       infrastructure, finance, business, marketing,
│                       commercial, legal
├── skills/             shared y nueve grupos especializados
├── tools/              filesystem, analytics y herramientas futuras
├── connections/        siete conexiones previstas y diseño MCP
├── hooks/              guardas locales y catálogo de eventos
├── policies/           permisos, aprobaciones, red, roles y datos
├── workflows/          ejemplo local, n8n y programación pendiente
├── memory/             políticas y ejemplo sintético; sin datos privados
├── adapters/           codex, cursor, claude-code, hermes y custom
├── config/             registros, modelos, ajustes y entornos
├── infrastructure/     planes Docker, Tailscale, despliegue y monitoreo
├── schemas/            contratos verificables
├── lib/                parser, validación, seguridad y ejecución local
├── scripts/            validación, pruebas y enrutamiento
├── tests/, examples/   pruebas y datos ficticios
├── evals/              escenarios; sin resultados LLM inventados
├── templates/          agente, skill, subagente y herramienta
├── references/         catálogo de 27 candidatos sin adoptar
└── docs/               arquitectura, decisiones, migraciones y operación
```

Lo funcional: validador, router por palabras clave, planificador acotado de
delegación, dispatcher con dos herramientas locales, workflow manual secuencial,
hooks locales y exportadores con hashes. El planner no inicia subprocesos de
agentes; el router no usa un modelo. Los exportadores producen archivos, sin
acreditar funcionamiento de los runtimes externos.

Lo declarativo: agentes y skills procedimentales, conexiones desactivadas,
políticas de datos y roles, memoria, infraestructura y evaluaciones futuras.
Las ocho identidades antiguas y las skills corrector, latex, ppt, profesor y
word conservan explícitamente su migración pendiente. No se copió material
personal de las carpetas existentes fuera de este árbol.

Las acciones financieras, inversiones, compras, publicaciones, mensajes externos,
borrado de archivos, cambios críticos, exposición pública, permisos críticos y
compromisos legales están bloqueados en el ejecutor local. No hay broker de
aprobación; una afirmación de aprobación no habilita esas acciones. Los controles
no se extienden automáticamente a herramientas propias de runtimes externos.

Guías: [instalación](docs/installation.md), [uso](docs/usage.md),
[contratos](docs/contracts.md), [seguridad](docs/security.md),
[migraciones](docs/migrations.md), [mantenimiento](docs/maintenance.md),
[plantillas](templates/README.md), [adapters](adapters/README.md),
[informe de entrega](docs/implementation-report.md).
