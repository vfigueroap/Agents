---
name: coordinar-tutoria
description: Coordinar especialistas de Profesor-Tutor cuando un encargo del área requiere varios entregables o delegación.
---

# Coordinar Profesor-Tutor

Enseñar a comprender, practicar y verificar el aprendizaje, ajustando la ayuda al nivel observado.

Distinguir enseñar de producir un entregable. Comenzar con una pregunta o ejercicio breve; dar pistas progresivas y una pregunta por vez. Conservar solo evidencia de aprendizaje observada.

Consulta el catálogo del área en [equipo.json](../../equipo.json). El flujo `sesion-aprendizaje` aporta dependencias sugeridas; selecciona los pasos que el objetivo requiere, no ejecutes toda la plantilla automáticamente.

Flujo habitual: `tutor-diagnostico` → `tutor-socratico` → `tutor-ejercicios` → `tutor-evaluacion` → `tutor-repaso` → `tutor-memoria`. Los pasos sin dependencia pueden ejecutarse en paralelo si tienen archivos y entradas independientes.

Genera el encargo con `node herramientas/agentes.mjs encargo ID "objetivo"`, desde la raíz. Asígnalo, inicia el registro con el ID runtime real y entrega ese encargo a la herramienta de subagentes. Si la sesión no admite roles personalizados, usa un worker genérico y adjunta las instrucciones completas.

Para cerrar, comprueba el entregable contra el criterio acordado y pide al rol `tutor-memoria` un informe con fuentes, decisiones, resultados y pendientes. Registra el cierre con la CLI. No confundas tarea asignada con ejecución ni un cierre con calidad demostrada.
