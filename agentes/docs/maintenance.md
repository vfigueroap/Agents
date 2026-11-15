# Mantenimiento y recuperación

Antes de cambiar una definición inspeccionar referencias, contratos y criterios
de evaluación. Ejecutar `node scripts/check.mjs` después de cambios; repetir solo
las comprobaciones necesarias durante la iteración. Los tests no necesitan red,
dependencias ni credenciales. Guardan temporales sintéticos dentro de .test-tmp/
o generated/ y verifican la ruta antes de retirarlos.

Registrar cada cambio material en una ADR o ampliar docs/decisions.md con fecha,
motivo, compatibilidad, pruebas y recuperación. Mantener schema_version; cualquier
cambio incompatible requiere migración explícita de manifests y templates. Revisar
las palabras clave del router con casos ambiguos y evitar que la cantidad de
subagentes crezca sin evidencia de calidad, costo o aislamiento.

Las instrucciones canónicas se revisan en su ubicación original. Un bundle que no
pasa --check se considera obsoleto; exportar a una carpeta nueva y revisar cambios.
No sincronizar manualmente cuatro copias. Revisar periódicamente la documentación
primaria del runtime elegido y registrar su versión antes de afirmar compatibilidad.

Recuperación de las definiciones: restaurar una revisión conocida desde un respaldo
del repositorio privado, revisar cambios locales, ejecutar validadores y regenerar
derivados. No se creó un repositorio remoto ni backups durante esta fase. El plan
de backup de datos reales deberá cifrar secretos y memoria por separado, controlar
acceso y comprobar restauración. El historial Git no sustituye un backup privado.

Si falla un componente, detener la parte dependiente, conservar evidencia sin
datos sensibles y usar el último contrato válido. Las operaciones destructivas
de recuperación requieren revisión humana; no hay scripts de eliminación masiva,
restauración remota o administración del host incluidos.
