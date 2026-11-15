# Seguridad y alcance efectivo

El dispatcher tiene dos bindings estáticos: files.read_fixture y analysis.summarize.
Valida la solicitud, carga el agente registrado, comprueba que la herramienta esté
permitida, verifica el manifest contra el binding del código, aplica la política
y valida entrada y salida. No importa módulos ni ejecuta comandos desde YAML.
No hay handler de red, shell o escritura de archivos accesible para los agentes.

Los siguientes actos están bloqueados en código, además de figurar en YAML:
transferencias, operaciones de inversión, pagos/compras, publicación pública,
mensajes externos, borrado de archivos, cambios críticos de infraestructura,
exposición de red, cambios críticos de permisos y compromisos legales. Esta fase
no implementa su ejecución aunque exista una aprobación. El contrato de solicitud
rechaza campos adicionales como approval=true. Los parámetros no otorgan privilegios.

La lectura se limita a JSON sintético bajo examples/fixtures/, hasta 64 KiB, sin
escapes, rutas absolutas, ADS de Windows o enlaces simbólicos. El resumen admite
hasta cien registros numéricos con límites y rechaza tipos extra o no finitos.
Los contenidos se tratan como datos, no como instrucciones. El runtime nunca
convierte texto del fixture en comandos ni permisos.

La auditoría local registra solo fecha, evento, ids y estado. No persiste datos,
prompts completos, credenciales ni resultados privados. No es durable ni inviolable.
Un despliegue deberá añadir identidad autenticada, autorización en el servicio,
registro protegido y monitoreo de fallos. El control pre-commit se entrega como
script y no se instala automáticamente.

Las pruebas intentan crear enlaces reales. Cuando el host lo prohíbe, simulan
exclusivamente la respuesta lstat que identifica un enlace y comprueban que la
guarda lo rechace. La corrida en ese host no acredita una prueba de integración
con enlaces reales; debe repetirse en Ubuntu antes de un despliegue.

Un futuro broker de aprobación deberá vincular identidad humana, agente, acción,
recurso y hash de parámetros, vigencia, uso único y resultado. El ejecutor deberá
validar esa autorización en el momento de actuar y evitar repetición. No basta
con habilitar un flag. La lectura financiera deberá mantenerse separada de la
operación de cuentas mediante scopes y credenciales distintos.

Las definiciones y el código constituyen un plano de control confiable que puede
editar el desarrollador. Esto no es un sandbox del sistema operativo y no resiste
un proceso hostil con permiso para modificar el código, las políticas o el árbol
durante una ejecución. Las comprobaciones de rutas reducen escapes, sin prometer
eliminar todas las carreras del filesystem entre procesos. El aislamiento real
requiere usuario sin privilegios, montajes mínimos y controles de red del host.

Los runtimes externos pueden tener herramientas propias. Los bundles no fuerzan
que usen este dispatcher ni configuran sus permisos. Antes de conectar datos reales,
deshabilitar herramientas amplias o canalizarlas por servicios aislados con controles
equivalentes. Ninguna conexión de esta entrega tiene scopes, secretos o endpoints.

Los secretos deberán provenir de un almacén externo elegido y probado en otra fase.
No almacenarlos en AGENTS.md, SKILL.md, YAML, el Site, logs o Git. `.gitignore`
es una ayuda, no un detector completo de secretos. Revisar procedencia y versión
de dependencias antes de adoptar cualquiera de los 27 candidatos. No hay una
evaluación de vulnerabilidades de esos repositorios en esta entrega.
