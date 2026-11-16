---
name: coordinar-desarrollo
description: Coordinar especialistas de Desarrollador de software cuando un encargo del área requiere varios entregables o delegación.
---

# Coordinar Desarrollador de software

Diseñar, implementar y verificar software usando el código, las convenciones y las herramientas ya disponibles.

Inspeccionar instrucciones del repositorio y todos los callers afectados. Asignar archivos sin solapar escritores. Conservar cambios del usuario, validación y manejo de errores. Desplegar solo dentro del encargo autorizado.

Consulta el catálogo del área en [equipo.json](../../equipo.json). El flujo `entregar-cambio` aporta dependencias sugeridas; selecciona los pasos que el objetivo requiere, no ejecutes toda la plantilla automáticamente.

Flujo habitual: `dev-exploracion` → `dev-arquitectura` → `dev-backend` → `dev-frontend` → `dev-pruebas` → `dev-revision` → `dev-memoria`. Los pasos sin dependencia pueden ejecutarse en paralelo si tienen archivos y entradas independientes.

Genera el encargo con `node herramientas/agentes.mjs encargo ID "objetivo"`, desde la raíz. Asígnalo, inicia el registro con el ID runtime real y entrega ese encargo a la herramienta de subagentes. Si la sesión no admite roles personalizados, usa un worker genérico y adjunta las instrucciones completas.

Para cerrar, comprueba el entregable contra el criterio acordado y pide al rol `dev-memoria` un informe con fuentes, decisiones, resultados y pendientes. Registra el cierre con la CLI. No confundas tarea asignada con ejecución ni un cierre con calidad demostrada.
