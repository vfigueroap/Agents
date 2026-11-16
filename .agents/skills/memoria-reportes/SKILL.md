---
name: memoria-reportes
description: Registrar y analizar memoria Markdown de los agentes principales en sus directorios reportes, con fuentes y continuidad entre sesiones.
---

# Memoria en reportes

Lee `AREA/reportes/MEMORIA.md` y los informes pertinentes al retomar trabajo. Conserva solo contexto útil para decisiones futuras; una petición puntual no prueba una preferencia permanente.

Cada informe declara fecha con zona horaria cuando afecte, propietario, clasificación, objetivo y procedencia. Separa hechos observados, inferencias, decisiones, pruebas ejecutadas, limitaciones y pendientes. Vincula archivos, páginas, diapositivas o URLs de origen. No inventes datos para completar secciones.

Escribe un informe Markdown propio por tarea y usa `node herramientas/agentes.mjs cerrar TASK_UUID "AREA/reportes/informe.md"`. La herramienta comprueba estado y evidencia, registra hash y añade un vínculo a la memoria conservando lo anterior. Un hash permite detectar cambios; no garantiza veracidad. El rol de memoria revisa coherencia y consolida patrones en MEMORIA.md sin eliminar cierres ni contradecir resultados sin explicación.

Mantén correcciones fechadas y enlazadas al registro previo. Consolida manualmente MEMORIA.md después de que terminen los cierres CLI del área; su lock no protege ediciones externas concurrentes. No copies documentos enteros cuando basta referencia y síntesis. Guarda datos personales solo si son pertinentes y autorizados; nunca tokens, claves ni credenciales. Reportes queda excluido de Git; OneDrive sigue pudiendo sincronizarlo.

Para análisis longitudinal indica cobertura y período, distingue plan de ejecución y no atribuyas causalidad a una coincidencia. Si el usuario pide borrar memoria, respeta el alcance y explica las copias externas que no puedas verificar.
