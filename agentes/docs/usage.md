# Uso local y extensión

Desde agentes/:

```sh
node scripts/validate.mjs
node --test tests/schema.test.mjs tests/runtime.test.mjs tests/orchestrator.test.mjs tests/adapters.test.mjs tests/project.test.mjs
node scripts/route.mjs "explicar ejercicios de universidad"
node scripts/route.mjs "contrato campaña"
node examples/safe-demo.mjs
```

La primera solicitud debe enrutar a Academic. La segunda conserva Legal y Marketing
como candidatos y no ejecuta nada. Una solicitud sin keyword vuelve al orquestador
con estado needs_clarification. El router es deliberadamente simple y no distingue
todos los matices o conjugaciones del lenguaje.

El ejemplo lee tres registros inventados y produce count=3 y total=180 con
classification=synthetic, sin llamadas a modelos o servicios. El dispatcher puede
invocarse desde un módulo ESM:

```js
import { createRuntime } from './lib/runtime.mjs';
const runtime = createRuntime();
const result = runtime.runTool({
  agent_id: 'finance',
  tool_id: 'summarize-records',
  input: { records: [{ label: 'Caso ficticio', value: 12 }] }
});
console.log(result);
```

`createDelegationPlanner()` de lib/orchestrator.mjs devuelve planes acotados.
Se utiliza una instancia por tarea raíz; sus contadores y task_id son en memoria.
No se entrega un scheduler, una cola, un mecanismo de reanudación ni un token de
autorización para iniciar subagentes. Los planes no cambian permisos efectivos.

Para crear componentes usar [las plantillas](../templates/README.md). Los agentes
deben referenciar solo ids registrados y skills implementadas; las herramientas
planificadas no son ejecutables. Los dominios nuevos se revisan como ampliación
del contrato, no como una nueva carpeta que el runtime vaya a descubrir por magia.

Para una conexión, copiar su contrato, seleccionar proveedor, documentar scopes
mínimos y credenciales externas, añadir un ejecutor aislado y pruebas. En esta fase
el schema exige enabled=false: activar conexiones requiere modificar contratos y
seguridad conscientemente. Los workflows locales tienen contrato propio, no son
exportaciones de n8n. No editar archivos de generated/; exportar a otra salida y
revisar diferencias mediante [el adapter](../adapters/README.md).
