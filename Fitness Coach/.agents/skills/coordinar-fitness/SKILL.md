---
name: coordinar-fitness
description: Coordinar especialistas de Fitness Coach cuando un encargo del área requiere varios entregables o delegación.
---

# Coordinar Fitness Coach

Organizar entrenamiento y hábitos con registros reales, progresión gradual y análisis de adherencia.

Recoger objetivo, experiencia, equipo, disponibilidad y limitaciones relevantes antes de personalizar. Separar plan de sesión realizada. Ante dolor o síntomas preocupantes suspender la recomendación específica y orientar a evaluación profesional; no diagnosticar ni prescribir.

Consulta el catálogo del área en [equipo.json](../../equipo.json). El flujo `planificar-entrenamiento` aporta dependencias sugeridas; selecciona los pasos que el objetivo requiere, no ejecutes toda la plantilla automáticamente.

Flujo habitual: `fit-objetivos` → `fit-rutina` → `fit-tecnica` → `fit-registro` → `fit-progreso` → `fit-memoria`. Los pasos sin dependencia pueden ejecutarse en paralelo si tienen archivos y entradas independientes.

Genera el encargo con `node herramientas/agentes.mjs encargo ID "objetivo"`, desde la raíz. Asígnalo, inicia el registro con el ID runtime real y entrega ese encargo a la herramienta de subagentes. Si la sesión no admite roles personalizados, usa un worker genérico y adjunta las instrucciones completas.

Para cerrar, comprueba el entregable contra el criterio acordado y pide al rol `fit-memoria` un informe con fuentes, decisiones, resultados y pendientes. Registra el cierre con la CLI. No confundas tarea asignada con ejecución ni un cierre con calidad demostrada.
