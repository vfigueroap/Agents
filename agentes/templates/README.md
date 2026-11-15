# Crear componentes

Las plantillas son ejemplos válidos excluidos del registro operativo.

1. Copiar la carpeta adecuada a agents/, skills/<grupo>/ o tools/<categoría>/. Elegir un id estable único. No sobrescribir una definición.
2. Actualizar rutas, propósito, responsabilidades, límites, evaluación y permisos mínimos. Reemplazar el contenido ficticio por instrucciones propias, no por datos privados.
3. Agente: añadir su ruta a config/agents.yaml, asignar un dominio existente y actualizar router/delegación conscientemente. El registro inicial exige al menos diez dominios; pueden añadirse especialistas.
4. Subagente: justificar contexto aislado o trabajo paralelo, seleccionar padre, tareas y presupuesto; no arranca automáticamente y no hereda permisos completos. No necesita dominio nuevo.
5. Skill: conservar frontmatter name/description en SKILL.md, manifest skill.yaml y referencia canónica única. No activar reservas de migración.
6. Tool: definir esquemas de entrada/salida y pruebas, implementar un handler explícito revisado en lib/runtime.mjs y añadir una autorización concreta. Un manifest nunca carga código arbitrario. Las acciones sensibles requieren una fase de seguridad adicional.
7. Ejecutar `node scripts/check.mjs`, actualizar documentación y volver a exportar bundles afectados.
