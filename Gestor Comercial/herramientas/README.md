# Herramientas de Gestor Comercial

Desde la raíz del proyecto:

```powershell
node herramientas/agentes.mjs listar comercial
node herramientas/agentes.mjs encargo sales-orquestador "OBJETIVO_DEL_USUARIO"
node herramientas/agentes.mjs estado comercial
```

Para crear un registro usa `asignar ID "objetivo"`; registra la ejecución con `iniciar TASK_UUID RUNTIME_ID` y el resultado con `cerrar TASK_UUID "Gestor Comercial/reportes/informe.md"`. Los argumentos en mayúsculas son valores que debes reemplazar, no resultados ejecutados. La CLI registra tareas y memoria; la ejecución del modelo la realiza Codex. [Guía completa](../../README.md).
