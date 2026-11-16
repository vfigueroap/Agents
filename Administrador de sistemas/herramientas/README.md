# Herramientas de Administrador de sistemas

Desde la raíz del proyecto:

```powershell
node herramientas/agentes.mjs listar sistemas
node herramientas/agentes.mjs encargo sys-orquestador "OBJETIVO_DEL_USUARIO"
node herramientas/agentes.mjs estado sistemas
```

Para crear un registro usa `asignar ID "objetivo"`; registra la ejecución con `iniciar TASK_UUID RUNTIME_ID` y el resultado con `cerrar TASK_UUID "Administrador de sistemas/reportes/informe.md"`. Los argumentos en mayúsculas son valores que debes reemplazar, no resultados ejecutados. La CLI registra tareas y memoria; la ejecución del modelo la realiza Codex. [Guía completa](../../README.md).
