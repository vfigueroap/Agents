# Registro de decisiones

Las entradas 001 a 012 corresponden a la fase de arquitectura del 14 de noviembre de
2026. Cambiar una decisión requiere registrar motivo, alternativas, impacto en
contratos, pruebas y procedimiento de migración.

| ADR | Estado | Decisión y motivo | Consecuencia |
| --- | --- | --- | --- |
| 001 | Confirmada por contexto | Arquitectura híbrida de diez dominios; skills para especialidades | Sin proliferación automática de agentes o contenedores |
| 002 | Confirmada por contexto | Un AGENTS.md raíz y por dominio; un SKILL.md por skill | Adapters generan derivados sin edición manual |
| 003 | Decisión local conservadora | Node.js 22+ y biblioteca estándar para utilidades de fase 1 | No se instala Python, frameworks ni servicios; no determina runtime futuro |
| 004 | Decisión local conservadora | JSON formateado como subconjunto YAML 1.2 | Parser sin dependencias; YAML general no admitido |
| 005 | Decisión local conservadora | Subconjunto cerrado de JSON Schema draft 2020-12 | Keywords no soportadas fallan; no se proclama compatibilidad total |
| 006 | Confirmada por alcance | Ocho perfiles y cinco skills antiguas pendientes | No copiar prompts parciales ni datos privados automáticamente |
| 007 | Decisión local conservadora | Dispatcher con dos handlers estáticos y acciones sensibles bloqueadas | Un manifiesto no carga código; la aprobación real queda para otra fase |
| 008 | Pendiente de implementación externa | Broker autenticado con intención, actor, acción, parámetros, vigencia y uso único | No aceptar booleanos o texto de aprobación como permisos |
| 009 | Confirmada por contexto | HP/Ubuntu, almacenamiento local y red privada prevista | Sin suponer GPU, RAM, modelos, servicios instalados o OneDrive principal |
| 010 | Decisión local conservadora | Exportar solo archivos y hashes; Hermes recibe bundle neutral | No prometer orquestación ni compatibilidad runtime no comprobada |
| 011 | Confirmada por contexto | Memoria privada externa y referencias solo candidatas | Sin datos reales en Git ni terceros clonados/ejecutados |
| 012 | Decisión local conservadora | Tests locales sin CI de proveedor activada | Evita ejecutar workflows o consumir servicios sin configurar repo privado |
| 013 | Organización autorizada, 15 de noviembre de 2026 | Publicar Agents desde la raíz, conservando agentes/ como fuente y agrupando originales en privado/ | Guia/, privado/ y floorplan/ quedan excluidos; se conservan contratos y rutas internas. La guía del directorio documenta los traslados y la comprobación de integridad |

Hermes se mantiene como candidato para orquestación. Agent Desktop de Vercel es
una herramienta a evaluar, sin asumir servicio permanente en Ubuntu. El framework
de producción y su elección siguen abiertos; esta fase no introduce dependencia
de eve, Hermes ni otro proveedor. La cantidad preliminar de dieciocho especialistas
y las cifras de investigación del contexto no se adoptan como reglas de diseño.
