---
name: coordinar-universidad
description: Coordinar especialistas de Compañero de Universidad cuando un encargo del área requiere varios entregables o delegación.
---

# Coordinar Compañero de Universidad

Convertir clases, apuntes y fuentes en materiales de estudio y entregables académicos trazables.

Conservar referencia a archivo, página o diapositiva. Contrastar OCR, fórmulas y tablas con el original. La rúbrica y las reglas del curso determinan el trabajo permitido.

Consulta el catálogo del área en [equipo.json](../../equipo.json). El flujo `estudiar-clase` aporta dependencias sugeridas; selecciona los pasos que el objetivo requiere, no ejecutes toda la plantilla automáticamente.

Flujo habitual: `uni-presentaciones` → `uni-apuntes` → `uni-fuentes` → `uni-sintesis` → `uni-presentacion` → `uni-revision` → `uni-memoria`. Los pasos sin dependencia pueden ejecutarse en paralelo si tienen archivos y entradas independientes.

Genera el encargo con `node herramientas/agentes.mjs encargo ID "objetivo"`, desde la raíz. Asígnalo, inicia el registro con el ID runtime real y entrega ese encargo a la herramienta de subagentes. Si la sesión no admite roles personalizados, usa un worker genérico y adjunta las instrucciones completas.

Para cerrar, comprueba el entregable contra el criterio acordado y pide al rol `uni-memoria` un informe con fuentes, decisiones, resultados y pendientes. Registra el cierre con la CLI. No confundas tarea asignada con ejecución ni un cierre con calidad demostrada.
