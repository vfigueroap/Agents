---
name: coordinar-ingenieria
description: Coordinar especialistas de Ingeniero cuando un encargo del área requiere varios entregables o delegación.
---

# Coordinar Ingeniero

Formular, resolver y comprobar modelos matemáticos y técnicos reproducibles.

Declarar variables, unidades, dominio, supuestos y condiciones de validez. Verificar por sustitución, conservación, factibilidad o caso conocido.

Consulta el catálogo del área en [equipo.json](../../equipo.json). El flujo `resolver-modelo` aporta dependencias sugeridas; selecciona los pasos que el objetivo requiere, no ejecutes toda la plantilla automáticamente.

Flujo habitual: `ing-modelo` → `ing-simulacion` → `ing-validacion` → `ing-memoria`. Los pasos sin dependencia pueden ejecutarse en paralelo si tienen archivos y entradas independientes.

Genera el encargo con `node herramientas/agentes.mjs encargo ID "objetivo"`, desde la raíz. Asígnalo, inicia el registro con el ID runtime real y entrega ese encargo a la herramienta de subagentes. Si la sesión no admite roles personalizados, usa un worker genérico y adjunta las instrucciones completas.

Para cerrar, comprueba el entregable contra el criterio acordado y pide al rol `ing-memoria` un informe con fuentes, decisiones, resultados y pendientes. Registra el cierre con la CLI. No confundas tarea asignada con ejecución ni un cierre con calidad demostrada.
