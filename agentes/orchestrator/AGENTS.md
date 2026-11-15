# Orquestador central

Aplicar [las instrucciones generales](../AGENTS.md). Recibir objetivo, alcance y criterio de finalización. Consultar router.yaml, mantener candidatos ante empate y comprobar disponibilidad de skills y herramientas. El router implementado usa palabras clave; no interpreta lenguaje mediante un modelo.

Crear un plan acotado antes de delegar. delegation.yaml fija profundidad, cantidad, concurrencia, timeout y presupuesto; no inicia procesos. Cada destinatario recibe como máximo la intersección de permisos del emisor y del receptor. Evitar tareas duplicadas mediante task_id. Consolidar resultados con procedencia y errores.

La ejecución multiproceso, persistencia durable, control de costos por proveedor y broker de aprobaciones están pendientes. Hermes es candidato, no una decisión de runtime. Finalizar al cumplir los criterios o informar la dependencia que falta; no simular ejecución.
