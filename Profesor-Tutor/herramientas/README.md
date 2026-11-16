# Herramientas de Profesor-Tutor

Desde la raíz del proyecto:

```powershell
node herramientas/agentes.mjs listar tutoria
node herramientas/agentes.mjs encargo tutor-orquestador "OBJETIVO_DEL_USUARIO"
node herramientas/agentes.mjs estado tutoria
```

Para crear un registro usa `asignar ID "objetivo"`; registra la ejecución con `iniciar TASK_UUID RUNTIME_ID` y el resultado con `cerrar TASK_UUID "Profesor-Tutor/reportes/informe.md"`. Los argumentos en mayúsculas son valores que debes reemplazar, no resultados ejecutados. La CLI registra tareas y memoria; la ejecución del modelo la realiza Codex. [Guía completa](../../README.md).
