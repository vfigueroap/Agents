#!/usr/bin/env bash
set -euo pipefail

# Solo prepara propiedad y permisos; no instala ni inicia Hermes o Docker.
if [ "$(id -u)" -ne 0 ]; then
  echo "Ejecuta este paso con sudo después de revisar el script." >&2
  exit 1
fi
data_dir="${HOMELAB_DATA_DIR:-/srv/personal-os}"
group_id="${HOMELAB_GROUP_ID:-2000}"
worker_uid="${HOMELAB_WORKER_UID:-1000}"
case "$data_dir" in
  /|*[[:cntrl:]]*|*/../*|*/./*|*/..|*/.) echo "Ruta de datos inválida." >&2; exit 1 ;;
  /*) ;;
  *) echo "HOMELAB_DATA_DIR debe ser absoluta." >&2; exit 1 ;;
esac
if ! [[ "$group_id" =~ ^[0-9]+$ && "$worker_uid" =~ ^[0-9]+$ ]] || [ "$group_id" -lt 1000 ] || [ "$worker_uid" -lt 1000 ]; then
  echo "Configura UID/GID no privilegiados (>=1000)." >&2
  exit 1
fi
for destination in "$data_dir" "$data_dir/captures" "$data_dir/control" "$data_dir/inbox" "$data_dir/inbox/processed" "$data_dir/inbox/quarantine" "$data_dir/agents-state"; do
  current="/"
  IFS='/' read -ra segments <<< "$destination"
  for segment in "${segments[@]}"; do
    [ -z "$segment" ] && continue
    current="${current%/}/$segment"
    if [ -L "$current" ] || { [ -e "$current" ] && [ ! -d "$current" ]; }; then echo "La ruta debe contener directorios sin symlinks." >&2; exit 1; fi
  done
done
if getent group personal-os >/dev/null; then
  actual_group="$(getent group personal-os | cut -d: -f3)"
  if [ "$actual_group" != "$group_id" ]; then echo "personal-os existe con otro GID; configura HOMELAB_GROUP_ID." >&2; exit 1; fi
else
  groupadd --gid "$group_id" personal-os
fi
if ! id hermes-os >/dev/null 2>&1; then useradd --create-home --shell /bin/bash hermes-os; fi
if [ "$(id -u hermes-os)" -lt 1000 ]; then echo "hermes-os debe ser un usuario no privilegiado." >&2; exit 1; fi
usermod --append --groups personal-os hermes-os
install -d -o root -g personal-os -m 2750 "$data_dir"
install -d -o "$worker_uid" -g personal-os -m 2750 "$data_dir/captures"
install -d -o "$worker_uid" -g personal-os -m 2750 "$data_dir/control"
install -d -o hermes-os -g personal-os -m 2770 "$data_dir/inbox"
# El worker crea processed/quarantine sin privilegios dentro de la bandeja compartida.
install -d -o hermes-os -g personal-os -m 0700 "$data_dir/agents-state"
echo "Directorios preparados. Hermes no fue instalado ni iniciado."
