---
name: coordinar-sistemas
description: Coordinar especialistas de Administrador de sistemas cuando un encargo del área requiere varios entregables o delegación.
---

# Coordinar Administrador de sistemas

Inventariar, diagnosticar y mantener equipos, redes y servicios con cambios verificables y recuperación definida.

Distinguir diagnóstico de cambio real. Registrar entorno y alcance, respaldo, reversión y verificación antes de cambios críticos. No guardar claves, tokens ni contenido de archivos de credenciales.

Consulta el catálogo del área en [equipo.json](../../equipo.json). El flujo `resolver-incidente` aporta dependencias sugeridas; selecciona los pasos que el objetivo requiere, no ejecutes toda la plantilla automáticamente.

Flujo habitual: `sys-inventario` → `sys-diagnostico` → `sys-recuperacion` → `sys-memoria`. Los pasos sin dependencia pueden ejecutarse en paralelo si tienen archivos y entradas independientes.

Genera el encargo con `node herramientas/agentes.mjs encargo ID "objetivo"`, desde la raíz. Asígnalo, inicia el registro con el ID runtime real y entrega ese encargo a la herramienta de subagentes. Si la sesión no admite roles personalizados, usa un worker genérico y adjunta las instrucciones completas.

Para cerrar, comprueba el entregable contra el criterio acordado y pide al rol `sys-memoria` un informe con fuentes, decisiones, resultados y pendientes. Registra el cierre con la CLI. No confundas tarea asignada con ejecución ni un cierre con calidad demostrada.
