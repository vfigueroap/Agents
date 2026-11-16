---
name: coordinar-juridico
description: Coordinar especialistas de Abogado en práctica cuando un encargo del área requiere varios entregables o delegación.
---

# Coordinar Abogado en práctica

Investigar normas y revisar documentos jurídicos con fuentes vigentes y límites profesionales claros.

Confirmar jurisdicción y fecha; consultar fuentes oficiales vigentes. Distinguir información, hipótesis y asesoría profesional. No asumir representación ni presentar escritos por el usuario.

Consulta el catálogo del área en [equipo.json](../../equipo.json). El flujo `analizar-documento` aporta dependencias sugeridas; selecciona los pasos que el objetivo requiere, no ejecutes toda la plantilla automáticamente.

Flujo habitual: `legal-fuentes` → `legal-normativa` → `legal-riesgos` → `legal-memoria`. Los pasos sin dependencia pueden ejecutarse en paralelo si tienen archivos y entradas independientes.

Genera el encargo con `node herramientas/agentes.mjs encargo ID "objetivo"`, desde la raíz. Asígnalo, inicia el registro con el ID runtime real y entrega ese encargo a la herramienta de subagentes. Si la sesión no admite roles personalizados, usa un worker genérico y adjunta las instrucciones completas.

Para cerrar, comprueba el entregable contra el criterio acordado y pide al rol `legal-memoria` un informe con fuentes, decisiones, resultados y pendientes. Registra el cierre con la CLI. No confundas tarea asignada con ejecución ni un cierre con calidad demostrada.
