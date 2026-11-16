---
name: orquestacion-equipos
description: Seleccionar y delegar tareas entre los equipos de este proyecto usando IDs estables, dependencias y evidencia de resultados.
---

# Orquestación de equipos

Desde la raíz, usa `node herramientas/agentes.mjs listar` para descubrir áreas y roles. Selecciona por responsabilidad y entregable, no por un número deseado de agentes. Los manifiestos `AREA/.agents/equipo.json` son la fuente de verdad.

Antes de delegar define objetivo, entradas, alcance, rutas de escritura, resultado esperado y aceptación. Genera el encargo con `encargo` y registra `asignar`; entrega al subagente el contexto mínimo y el task_id. Tras spawn, vincula su ID runtime con `iniciar`. Un rol del catálogo no es un proceso.

Los roles nativos se generan en `.codex/agents` mediante `node herramientas/sincronizar-codex.mjs`. Si la herramienta no expone selección de rol, adjunta al worker genérico el encargo completo. Si no hay delegación, trabaja directamente y registra el ejecutor real.

Ejecuta en paralelo solo tareas independientes, sin compartir archivos de salida; espera dependencias. La concurrencia, permisos, modelo, skills y MCP dependen de la sesión principal. Conserva el modelo heredado salvo preferencia explícita. Revisa los resultados antes de sintetizar.

El especialista escribe un informe verificable en reportes del área y el responsable de memoria consolida. `cerrar` registra evidencia y memoria; no sustituye la revisión del orquestador. Si falta entrada o herramienta, usa `bloquear` con un motivo concreto. No afirmar que una tarea pendiente está ejecutándose.
