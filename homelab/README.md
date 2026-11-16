# Hermes en Ubuntu y Personal OS

Estos archivos preparan el HP. No instalan Hermes en el PC Windows, no activan cuentas ni acreditan un homelab ya funcionando. Los 12 equipos y 85 roles siguen siendo el catálogo; se añaden tres perfiles Hermes: personal, finanzas y sistema. Solo personal mantiene un gateway permanente.

## Preparación del HP

Requiere Ubuntu con systemd, Node 26 para Personal-OS, Docker Compose y Tailscale instalado por el propietario. Clona los dos repositorios en rutas absolutas accesibles por el usuario de servicio. Los reportes personales están fuera de Git: transfiérelos mediante un respaldo privado si los quieres conservar; no restaures el runtime antiguo eliminado.

El worker usa UID 1000 en su contenedor. Hermes usa un usuario Linux distinto, sin sudo, y solo lectura de capturas mediante el grupo personal-os (GID 2000 por defecto). Revisa primero los IDs del equipo y el script; cambia HOMELAB_WORKER_UID/HOMELAB_GROUP_ID si esos valores están ocupados o no corresponden.

```bash
sudo bash homelab/preparar-directorios.sh
sudo loginctl enable-linger hermes-os
sudo -iu hermes-os
```

El script crea únicamente el usuario, grupo y directorios de datos; no inicia servicios. Layout compartido:

```text
/srv/personal-os/
  captures/        # owner worker, grupo personal-os; originales solo lectura para Hermes
  control/         # política de pausa escrita solo por el worker; lectura Hermes
  inbox/           # entregas JSON para el worker
    processed/
    quarantine/
  agents-state/    # trabajo privado y caché del recolector, owner hermes-os
```

Los directorios captures tienen modo 2750 y sus archivos 0640. inbox tiene modo 2770. Conserva el bit setgid para que archivos nuevos hereden el grupo compartido. Nunca pongas .env.hp, tokens o el volumen privado /state del worker dentro de estos directorios compartidos. El secreto OAuth del worker permanece fuera del alcance de hermes-os.

Instala Hermes como hermes-os desde la [guía oficial](https://hermes-agent.nousresearch.com/docs/getting-started/installation). Registra su versión con `hermes --version`; este repositorio no descarga ni ejecuta un instalador remoto automáticamente. No uses Nous Portal u otra API de pago para este proyecto.

```bash
cd /ruta/absoluta/Agentes
node herramientas/homelab.mjs check
node herramientas/homelab.mjs prepare /ruta/absoluta/Personal-OS /srv/personal-os
hermes -p personal model
```

Selecciona **ChatGPT or Codex Subscription** y completa personalmente el código de dispositivo con tu cuenta OpenAI. Se utiliza el proveedor openai-codex y el modelo disponible en el catálogo real de tu cuenta, con runtime auto. No hace falta API key ni Codex CLI. No habilites un fallback facturable. [Proveedor oficial](https://hermes-agent.nousresearch.com/docs/getting-started/quickstart).

La preparación crea perfiles con `--no-credentials`, fija el directorio de trabajo y añade la skill de publicación. Conserva los SOUL y skills preexistentes; no reemplaza tus credenciales ni instrucciones personalizadas. Autentica finanzas o sistema con `hermes -p finanzas model` / `hermes -p sistema model` al usarlos. No copies archivos auth.json entre perfiles. Los perfiles separan memoria y configuración, pero no son un sandbox. [Perfiles](https://hermes-agent.nousresearch.com/docs/user-guide/profiles).

El directorio de código debe ser de lectura para hermes-os; habilita escritura solo en la carpeta .agents (lock de tareas) y en reportes de cada equipo si quieres que Hermes use asignar/cerrar. Por ejemplo, el administrador puede conceder ACL a esas carpetas concretas. No concedas escritura a fuentes ni originales. Los drop-ins generados añaden ProtectSystem=strict, ProtectHome=read-only, NoNewPrivileges y ReadWritePaths explícitos para perfiles, informes y bandeja. Ocultan .env/.env.hp de la app. Los permisos Unix de capturas y secretos son la frontera también para procesos externos o scopes transitorios.

## Bot y servicios

```bash
hermes -p personal gateway setup
hermes -p personal gateway install
systemctl --user daemon-reload
systemctl --user enable --now personal-os-telemetry.timer
hermes -p personal doctor
hermes -p personal gateway status
systemctl --user status personal-os-telemetry.timer
```

Configura el bot de Telegram solo para tu usuario y chat privado. El bot principal pertenece al gateway Hermes. El conector Telegram opcional del worker debe usar **otro bot/token**, o permanecer desactivado; dos procesos getUpdates con el mismo token se interfieren. No arranques dos procesos sobre el mismo perfil. finanzas y sistema se invocan bajo demanda, por ejemplo `hermes -p finanzas chat`.

El timer ejecuta una consulta local cada 30 segundos: recursos del HP, estado systemd de los tres perfiles y conectividad Tailscale. No usa LLM. Las tareas se exportan solo cuando cambia su contenido. Una tarea en curso no prueba un proceso vivo; un dispositivo Tailscale online no prueba acceso a sus archivos ni métricas internas. Servicios no instalados se muestran sin configurar; errores de consulta permanecen como errores.

Para mantener resúmenes con Hermes sin la app abierta, crea una sola tarea oficial tras probar la publicación. La CLI usa salida local por defecto, sin mensajes a terceros:

```bash
hermes -p personal cron create "every 1h" \
  "Usa personal-os-dashboard para revisar capturas nuevas autorizadas, actualizar resúmenes por área y registrar evidencias. No modifiques originales ni envíes mensajes. Conserva el marcador de capturas revisadas en HOMELAB_DATA_DIR/agents-state. No publiques cambios si no hay información nueva." \
  --skill personal-os-dashboard --script personal-os-policy.sh \
  --workdir /ruta/absoluta/Agentes --name personal-os-resumen
hermes -p personal cron list
```

El script personal-os-policy.sh se genera durante prepare y ejecuta herramientas/politica.mjs antes del modelo. Solo devuelve wakeAgent=true si el worker comunicó autonomía read_and_propose, agentes reanudados y una observación de hace 90 segundos o menos. Un archivo ausente, inválido o antiguo omite la inferencia. control pertenece al worker: Hermes tiene lectura sin escritura. El timer de telemetría continúa durante la pausa.

No repitas create si el nombre ya aparece: usa cron edit. No se fija otro proveedor/modelo en el cron. Consulta [programación oficial](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron). Al agotar cuota o sesión, conserva resúmenes previos y revisa el estado; no cambies a una API de pago automáticamente. Tailscale permite conectividad; cada dispositivo adicional necesita acceso explícito comprobado.

## Conexión con el worker

Configura Personal-OS siguiendo su infra/README.md: cuenta worker limitada, autenticación Google en lectura, labels/remitentes autorizados, y bridge activado. En .env.hp usa HOMELAB_DATA_DIR=/srv/personal-os, HOMELAB_GROUP_ID=2000 y el scope dashboard.publish del contrato. No des la clave administrativa al worker ni tokens Supabase a Hermes.

```bash
cd /ruta/absoluta/Personal-OS
docker compose --env-file .env.hp -f infra/compose.yaml up -d --build
```

El host monta /srv/personal-os como /homelab dentro del worker. El worker consume /homelab/inbox, valida el contrato, llama al RPC autenticado y mueve las entregas confirmadas a processed. Una caída de red conserva los pendientes; los inválidos van a quarantine. Los originales y el texto extraído permanecen en captures. La interfaz muestra fuente y última observación; una entrega local no prueba éxito remoto.

## Publicar y comprobar

```bash
export HOMELAB_DATA_DIR=/srv/personal-os
export DASHBOARD_INBOX_DIR=/srv/personal-os/inbox
cd /ruta/absoluta/Agentes
node herramientas/dashboard.mjs validate homelab/delivery.example.json
node herramientas/telemetria.mjs collect
```

El ejemplo es sintético y sirve para validación; no lo publiques en la cuenta real. Prueba un resumen propio sin datos sensibles, comprueba que pase a processed y aparezca en Sistema/área correspondiente. Nunca imprimas tokens o contenido completo de emails para depurar.

Contrato v1: version=1, id UUID estable para reintentos, area de las nueve áreas, source estable, observed_at con zona, summary y listas metrics/items/references. Tamaño máximo 256 KiB. items admite kind activity/current/next/reflection/opportunity/contact/learning/skill/resource/reputation/plan, due_at y bucket opcionales. references guarda procedencia, URL HTTPS o local_ref opaco. telemetry contiene entidades observadas y métricas primitivas; no comandos. valuations es opcional únicamente en work: alias account_ref, name, kind asset/liability, moneda ISO, amount_minor entero seguro, valued_at y source_ref. Un email de movimiento no prueba saldo. El esquema del dominio Personal-OS es canónico; el worker vuelve a validar.

## Recuperación y límites

La pausa del portal detiene la inferencia automática mediante el pre-check, como máximo al expirar la política local de 90 segundos. No interrumpe una tarea que ya empezó. Para detener también Hermes y el recolector: `hermes -p personal pause` y `systemctl --user stop personal-os-telemetry.timer`. Para volver, reanuda en el portal, resume Hermes y reactiva el timer después de revisar la causa. No borres pendientes ni originales para reparar conectividad.

Respalda en privado perfiles Hermes, agents-state, capturas y reportes antes de actualizar. Los instaladores no sobrescriben memoria existente. El script de preparación puede regenerar sus units administradas; tus SOUL y skills existentes se conservan. No se ha probado un arranque real de Ubuntu ni autenticado tus cuentas durante la implementación en Windows.
