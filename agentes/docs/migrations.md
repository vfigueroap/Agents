# Migración de agentes y skills anteriores

La fase actual preserva las identidades y funciones descritas en el contexto;
no afirma haber importado las instrucciones originales completas. No copia datos
privados ni usa las carpetas vecinas como fuentes automáticas. Existen materiales
parciales fuera de agentes/, que deberán revisarse con autorización específica.

| Identidad anterior | Dominio | Perfil estable | Estado |
| --- | --- | --- | --- |
| Abogado en práctica | legal | abogado-practica | Pendiente |
| Administrador de sistemas | infrastructure | administrador-sistemas | Pendiente |
| Compañero de Universidad | academic | companero-universidad | Pendiente |
| Desarrollador de software | software | desarrollador-software | Pendiente |
| Emprendedor-Builder | business | emprendedor-builder | Pendiente |
| Ingeniero | engineering | ingeniero | Pendiente |
| Marketero | marketing | marketero | Pendiente |
| Profesor-Tutor | academic | profesor-tutor | Pendiente |

Las skills corrector, latex, ppt, profesor y word tienen reservas con estado
migration_pending. No se asignan a agentes como capacidades operativas. Las skills
nuevas no se presentan como equivalentes de esas instrucciones anteriores.

Procedimiento futuro:

1. Obtener la versión completa autorizada de cada instrucción y su procedencia.
   Preservar un original en almacenamiento privado externo con hash y fecha.
2. Separar instrucciones, recursos licenciados, secretos, memoria personal y datos
   de trabajo. Migrar al repo solo contenido propio y permitido, sin datos reales.
3. Comparar propósito, tono funcional, comportamiento, skills y límites. Documentar
   discrepancias con las políticas actuales; no eliminar información relevante.
4. Incorporar instrucciones al AGENTS.md canónico correspondiente. Para Academic
   conservar bloques o recursos de perfil diferenciados para tutoría y colaboración.
   Cambiar el contrato de estado con una ADR antes de marcar perfiles como migrados.
5. Importar cada skill una sola vez, validar sus recursos y probar tareas ficticias
   representativas antes de asignarla o publicarla mediante adapters.
6. Ejecutar validación, comparación de comportamiento y exportación. Guardar informe
   y revisión de origen; no sobrescribir versiones anteriores sin inspección.

La fase inicial fija migration_status=pending como invariante verificable. El día
de la migración deberá ampliarse ese schema y su comprobación semántica, con evidencia
del material importado. No cambiar el estado únicamente para hacer pasar el validador.
