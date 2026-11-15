# Hooks y puntos de control

pre-tool, post-tool, on-error y audit se invocan mediante imports estáticos del
dispatcher. pre-network y approval son guardas locales exportadas que deniegan
si se invocan; el dispatcher no tiene rutas de red ni ejecutores sensibles.
`node scripts/check.mjs` es un control pre-commit disponible, no instalado en Git.

events.yaml documenta el estado. No se carga código desde una ruta de manifiesto.
No se registran comandos porque no se ejecutan comandos de terminal. La auditoría
de demostración permanece en memoria y solo contiene identidad, evento, estado y
fecha. No es un registro durable ni a prueba de alteraciones. Los hooks de cada
runtime externo requieren un adapter de ejecución y pruebas posteriores.
