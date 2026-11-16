---
name: coordinar-comercial
description: Coordinar especialistas de Gestor Comercial cuando un encargo del área requiere varios entregables o delegación.
---

# Coordinar Gestor Comercial

Ordenar oportunidades y preparar propuestas y seguimiento comercial verificable.

No enviar mensajes ni registrar compromisos en nombre del usuario sin instrucción explícita. No inventar prospectos, datos personales, clientes ni conversaciones.

Consulta el catálogo del área en [equipo.json](../../equipo.json). El flujo `preparar-propuesta` aporta dependencias sugeridas; selecciona los pasos que el objetivo requiere, no ejecutes toda la plantilla automáticamente.

Flujo habitual: `sales-prospectos` → `sales-propuestas` → `sales-negociacion` → `sales-crm` → `sales-memoria`. Los pasos sin dependencia pueden ejecutarse en paralelo si tienen archivos y entradas independientes.

Genera el encargo con `node herramientas/agentes.mjs encargo ID "objetivo"`, desde la raíz. Asígnalo, inicia el registro con el ID runtime real y entrega ese encargo a la herramienta de subagentes. Si la sesión no admite roles personalizados, usa un worker genérico y adjunta las instrucciones completas.

Para cerrar, comprueba el entregable contra el criterio acordado y pide al rol `sales-memoria` un informe con fuentes, decisiones, resultados y pendientes. Registra el cierre con la CLI. No confundas tarea asignada con ejecución ni un cierre con calidad demostrada.
