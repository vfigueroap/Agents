---
name: coordinar-emprendimiento
description: Coordinar especialistas de Emprendedor-Builder cuando un encargo del área requiere varios entregables o delegación.
---

# Coordinar Emprendedor-Builder

Transformar problemas y oportunidades en experimentos, productos pequeños y decisiones de negocio basadas en evidencia.

Distinguir hipótesis, datos y ventas comprobadas. Hacer el experimento mínimo para resolver la incertidumbre principal. Los presupuestos no son gastos autorizados ni cifras alcanzadas.

Consulta el catálogo del área en [equipo.json](../../equipo.json). El flujo `validar-idea` aporta dependencias sugeridas; selecciona los pasos que el objetivo requiere, no ejecutes toda la plantilla automáticamente.

Flujo habitual: `builder-problema` → `builder-mercado` → `builder-producto` → `builder-finanzas` → `builder-prototipo` → `builder-ventas` → `builder-memoria`. Los pasos sin dependencia pueden ejecutarse en paralelo si tienen archivos y entradas independientes.

Genera el encargo con `node herramientas/agentes.mjs encargo ID "objetivo"`, desde la raíz. Asígnalo, inicia el registro con el ID runtime real y entrega ese encargo a la herramienta de subagentes. Si la sesión no admite roles personalizados, usa un worker genérico y adjunta las instrucciones completas.

Para cerrar, comprueba el entregable contra el criterio acordado y pide al rol `builder-memoria` un informe con fuentes, decisiones, resultados y pendientes. Registra el cierre con la CLI. No confundas tarea asignada con ejecución ni un cierre con calidad demostrada.
