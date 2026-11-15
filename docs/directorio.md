# Dónde está cada cosa

La raíz separa el sistema que se publica de los proyectos y materiales locales.
Para elegir qué hacer dentro del sistema, usa el [índice por tarea](../agentes/docs/README.md).

```text
Agentes/
├── README.md              punto de entrada
├── AGENTS.md              instrucciones para trabajar en este repositorio
├── DESIGN.md              dirección visual de las guías
├── package.json           comprobar y ejecutar el ejemplo desde la raíz
├── agentes/               fuente canónica del sistema
├── docs/                  esta guía, diagrama e informe de verificación
├── Guia/                  proyecto independiente, solo local
├── privado/               originales y contexto personal, solo local
└── floorplan/             mapa interactivo generado, solo local
```

Las tres últimas carpetas no se descargan al clonar Agents. `.gitignore` las
excluye; no es una protección de acceso ni un respaldo de sus archivos.

## Dentro de agentes/

| Buscas | Carpeta o archivo |
| --- | --- |
| A quién corresponde una tarea | [orchestrator/](../agentes/orchestrator/AGENTS.md) y [registro de dominios](../agentes/config/agents.yaml) |
| Instrucciones de un dominio | [agents/](../agentes/agents/) |
| Procedimientos especializados | [skills/](../agentes/skills/README.md) |
| Lo que puede ejecutarse | [tools/](../agentes/tools/) y [lib/runtime.mjs](../agentes/lib/runtime.mjs) |
| Límites de ejecución | [policies/](../agentes/policies/) y [hooks/](../agentes/hooks/README.md) |
| Datos y ejemplos de prueba | [examples/](../agentes/examples/) |
| Exportar para otro entorno | [adapters/](../agentes/adapters/README.md) |
| Contratos y comprobaciones | [schemas/](../agentes/schemas/), [tests/](../agentes/tests/) y [scripts/](../agentes/scripts/) |
| Integraciones previstas | [connections/](../agentes/connections/) e [infrastructure/](../agentes/infrastructure/) |
| Crear un agente o una skill | [templates/](../agentes/templates/README.md) |

## Materiales locales reubicados

El 15 de noviembre de 2026 se agruparon las carpetas anteriores en
`privado/perfiles-originales/`, conservando sus nombres y contenidos:

| Antes, en la raíz | Ahora, bajo privado/perfiles-originales/ |
| --- | --- |
| Abogado en practica | Abogado en practica |
| Administrador de sistemas | Administrador de sistemas |
| Compañero de Universidad | Compañero de Universidad |
| Desarrollador de software | Desarrollador de software |
| Emprendedor-Builder | Emprendedor-Builder |
| Ingeniero | Ingeniero |
| Marketero | Marketero |
| Profesor-Tutor | Profesor-Tutor |

`contextomaestrodelproyecto.md` quedó en `privado/`. Agrupar estos originales
no los migra al sistema canónico ni activa sus skills. Los estados de migración
se mantienen en [migrations.md](../agentes/docs/migrations.md).

Si un proyecto de Codex o acceso directo usaba una ruta anterior, vuelve a
abrirlo desde su nueva ubicación. Las rutas internas relativas de cada perfil
se conservan. `Guia/` permanece en su ubicación original y con su Git independiente.

## Mapa interactivo local

`floorplan/index.html` permite explorar el código y los manifiestos de `agentes/`.
Puedes abrirlo directamente. Para habilitar el servidor y sus preguntas locales,
desde la raíz:

```sh
node floorplan/serve.mjs
```

Este comando requiere el mapa generado en este espacio; no está incluido en un
clon de GitHub. Para crearlo o actualizarlo en Codex, pide «actualiza el floorplan
de este repositorio». Sus fuentes son `floorplan/architecture.json` y
`floorplan/descriptions/`. No incluye el contenido de `Guia/` ni `privado/`.

El [diagrama general](arquitectura.html) sí se publica y funciona como archivo
HTML independiente. El [informe de verificación](verificacion.md) registra las
comprobaciones realizadas en esta reorganización.

## Mantener el orden

Guarda los cambios del sistema en `agentes/`, su documentación junto a las guías
existentes y los materiales personales en `privado/`. Los bundles se generan en
`agentes/generated/`; los temporales no son fuentes canónicas. Antes de publicar,
ejecuta `npm run check` y revisa `git diff --cached --stat` para confirmar el alcance.
