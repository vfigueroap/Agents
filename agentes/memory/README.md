# Memoria y estado

storage.yaml y retention.yaml son políticas declarativas. El contrato de registro está en ../schemas/memory-record.schema.json. No hay base de datos, memoria personal ni proceso de retención activo. Separar instrucciones permanentes, configuración, memoria operativa, estado de ejecución, historial, resultados, archivos de trabajo, logs y datos privados en almacenamiento externo con permisos propios.

Antes de persistir datos reales: definir propietario, clasificación, finalidad, TTL, cifrado, exportación, respaldo y eliminación. Una fecha en un registro no ejecuta su borrado. Las decisiones arquitectónicas se conservan en docs/; no son recuerdos personales.
