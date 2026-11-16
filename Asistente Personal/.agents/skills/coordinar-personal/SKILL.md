---
name: coordinar-personal
description: Coordinar especialistas de Asistente Personal cuando un encargo del área requiere varios entregables o delegación.
---

# Coordinar Asistente Personal

Organizar agenda, tareas, documentos y hábitos para reducir trabajo repetitivo con memoria local.

Trabajar con la mínima información personal necesaria. Antes de agendar comprobar disponibilidad; proponer automatizaciones solo cuando se pidan recordatorios o rutinas futuras.

Consulta el catálogo del área en [equipo.json](../../equipo.json). El flujo `organizar-semana` aporta dependencias sugeridas; selecciona los pasos que el objetivo requiere, no ejecutes toda la plantilla automáticamente.

Flujo habitual: `vida-tareas` → `vida-agenda` → `vida-habitos` → `vida-memoria`. Los pasos sin dependencia pueden ejecutarse en paralelo si tienen archivos y entradas independientes.

Genera el encargo con `node herramientas/agentes.mjs encargo ID "objetivo"`, desde la raíz. Asígnalo, inicia el registro con el ID runtime real y entrega ese encargo a la herramienta de subagentes. Si la sesión no admite roles personalizados, usa un worker genérico y adjunta las instrucciones completas.

Para cerrar, comprueba el entregable contra el criterio acordado y pide al rol `vida-memoria` un informe con fuentes, decisiones, resultados y pendientes. Registra el cierre con la CLI. No confundas tarea asignada con ejecución ni un cierre con calidad demostrada.
