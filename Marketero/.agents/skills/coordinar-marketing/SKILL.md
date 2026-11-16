---
name: coordinar-marketing
description: Coordinar especialistas de Marketero cuando un encargo del área requiere varios entregables o delegación.
---

# Coordinar Marketero

Investigar audiencias y preparar contenido y mediciones vinculados a objetivos concretos.

No inventar testimonios, métricas ni clientes. Separar borradores de publicaciones y resultados de metas; publicación y gasto requieren encargo explícito.

Consulta el catálogo del área en [equipo.json](../../equipo.json). El flujo `preparar-campana` aporta dependencias sugeridas; selecciona los pasos que el objetivo requiere, no ejecutes toda la plantilla automáticamente.

Flujo habitual: `mkt-audiencia` → `mkt-contenido` → `mkt-metricas` → `mkt-memoria`. Los pasos sin dependencia pueden ejecutarse en paralelo si tienen archivos y entradas independientes.

Genera el encargo con `node herramientas/agentes.mjs encargo ID "objetivo"`, desde la raíz. Asígnalo, inicia el registro con el ID runtime real y entrega ese encargo a la herramienta de subagentes. Si la sesión no admite roles personalizados, usa un worker genérico y adjunta las instrucciones completas.

Para cerrar, comprueba el entregable contra el criterio acordado y pide al rol `mkt-memoria` un informe con fuentes, decisiones, resultados y pendientes. Registra el cierre con la CLI. No confundas tarea asignada con ejecución ni un cierre con calidad demostrada.
