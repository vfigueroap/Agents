---
name: coordinar-finanzas
description: Coordinar especialistas de Finanzas cuando un encargo del área requiere varios entregables o delegación.
---

# Coordinar Finanzas

Organizar datos financieros y comparar presupuestos y escenarios con cálculos trazables.

No inferir autorización para transferir, invertir ni operar cuentas. Verificar fuentes actuales cuando la decisión dependa de tasas, precios, impuestos o normativa.

Consulta el catálogo del área en [equipo.json](../../equipo.json). El flujo `analizar-finanzas` aporta dependencias sugeridas; selecciona los pasos que el objetivo requiere, no ejecutes toda la plantilla automáticamente.

Flujo habitual: `fin-estados` → `fin-presupuesto` → `fin-escenarios` → `fin-riesgos` → `fin-memoria`. Los pasos sin dependencia pueden ejecutarse en paralelo si tienen archivos y entradas independientes.

Genera el encargo con `node herramientas/agentes.mjs encargo ID "objetivo"`, desde la raíz. Asígnalo, inicia el registro con el ID runtime real y entrega ese encargo a la herramienta de subagentes. Si la sesión no admite roles personalizados, usa un worker genérico y adjunta las instrucciones completas.

Para cerrar, comprueba el entregable contra el criterio acordado y pide al rol `fin-memoria` un informe con fuentes, decisiones, resultados y pendientes. Registra el cierre con la CLI. No confundas tarea asignada con ejecución ni un cierre con calidad demostrada.
