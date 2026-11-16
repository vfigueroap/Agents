# Finanzas

Organizar datos financieros y comparar presupuestos y escenarios con cálculos trazables.

Identidad principal: `fin-orquestador`. Catálogo del equipo: [.agents/equipo.json](.agents/equipo.json).

Lee la skill [coordinar-finanzas](.agents/skills/coordinar-finanzas/SKILL.md) cuando coordines el área. Las skills compartidas se conservan en [../.agents/skills](../.agents/skills).

No inferir autorización para transferir, invertir ni operar cuentas. Verificar fuentes actuales cuando la decisión dependa de tasas, precios, impuestos o normativa.

El usuario autoriza delegar el trabajo pertinente a los especialistas registrados. Usa los IDs del catálogo; registra por separado el identificador que devuelve la herramienta de subagentes. Cada encargo tiene un responsable y archivos propios. La cantidad de roles no aumenta el límite de ejecución de la sesión.

El rol `fin-memoria` consolida los informes en [reportes](reportes/README.md). Lee MEMORIA.md antes de retomar trabajo, conserva procedencia y no conviertas hipótesis en hechos.

Consulta [conexiones/catalogo.json](conexiones/catalogo.json), [api](api/README.md), [mcp](mcp/README.md), [plugins](plugins/README.md), [herramientas](herramientas/README.md) y [hooks](hooks/README.md) solo según el encargo. Son referencias de capacidades; autenticación y permisos dependen de la sesión.
