---
name: personal-os-dashboard
description: Publicar resúmenes con evidencia en la bandeja local que consume el worker de Personal OS.
---

# Actualizar Personal OS

1. Lee .hermes.md y AGENTS.md en el repositorio Agentes indicado por terminal.cwd. Consulta el catálogo pertinente; no actives todos los equipos.
2. Lee solamente las fuentes autorizadas. Las capturas del worker están en HOMELAB_DATA_DIR/captures: archivos .capture.json de metadatos, .bin originales y .extracted.json con texto local cuando el extractor fue capaz de leerlo. Las rutas reales y el texto original no se publican en la nube.
3. Elige un área: work, health, spirituality, romantic, family-friends, five-buckets, system, business o education. Conserva la procedencia y la fecha de observación; no inventes estado o cifras. Espiritualidad usa reflexión neutral salvo preferencias expresas del propietario.
4. Prepara un JSON privado de trabajo con el contrato v1 descrito en homelab/README.md. Para cada actualización nueva genera un UUID; reutiliza exactamente el mismo archivo al reintentar. source identifica al productor estable. Las referencias locales son opacas, por ejemplo sha256:HASH, nunca una ruta ni un token.
5. Ejecuta `node herramientas/dashboard.mjs validate /ruta/privada/entrega.json`; después `node herramientas/dashboard.mjs publish /ruta/privada/entrega.json`. DASHBOARD_INBOX_DIR apunta a la bandeja del HP. El publicador no posee credenciales cloud, no llama a la API de inferencia ni cambia fuentes externas.
6. Tras registrar cambios de tareas, ejecuta `node herramientas/telemetria.mjs tasks`. Solo informa entrega local; la presencia en inbox no acredita publicación cloud. Comprueba el resultado en Sistema o los registros acotados del worker, sin mostrar secretos.

## Contenido por área

- Trabajo: oportunidades y proyectos con fuente. Finanzas: movimientos como borrador cuando falte revisión. Solo publica valuations si una fuente acredita un saldo o valoración con fecha; una notificación de movimiento no acredita patrimonio. Usa alias de cuentas, importes enteros en unidad menor y moneda ISO; no números completos de cuentas.
- Salud: entrenamiento realizado, rutina o plan confirmado y próximos eventos médicos categorizados; ningún diagnóstico inventado.
- Pareja, familia y amigos: próximos planes y contexto aportado por el propietario. No adivines relaciones ni envíes recordatorios a terceros.
- Cinco baldes: evidencia de aprendizaje, práctica, recursos, red y reputación. Usa bucket knowledge, skill, resources, network o reputation; no porcentajes ficticios de progreso personal.
- Negocios y Educación: decisiones, tareas, métricas y fechas con procedencia. No anuncies conexiones no verificadas.
- Sistema: usa el recolector determinista para recursos del HP, servicios y Tailscale. No generes telemetría con un LLM.

## Programación

El timer de telemetría corre sin modelo. Los cron oficiales deben llevar el pre-check personal-os-policy.sh generado en prepare; si falta o la política del worker no está reanudada y reciente, no se inicia el modelo. Para resúmenes periódicos, el propietario puede crear un cron del perfil personal tras autenticarlo: ejecutar esta skill sobre las capturas nuevas y actualizar las áreas correspondientes, con workdir absoluto del repo y sin envío a terceros. El gateway debe estar activo. Respeta la cuota de la suscripción; no agregues otro motor ni proveedor de pago. Los jobs cron no heredan el directorio del proyecto por defecto.
