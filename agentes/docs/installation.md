# Preparación local

Requisito único: Node.js 22 o posterior disponible en el equipo. Esta entrega usa
solo su biblioteca estándar. No ejecutar npm install, gestores de servicios,
instaladores remotos ni comandos Docker para validar esta fase.

Abrir una terminal dentro de agentes/ y ejecutar:

```sh
node --version
node scripts/validate.mjs
node scripts/check.mjs
```

En Windows funcionan desde PowerShell; en Ubuntu los mismos comandos usan Node.
Las rutas de los manifiestos emplean `/`, son relativas a esta raíz y no admiten
escapes o enlaces simbólicos. La configuración no lee variables `.env`; el archivo
.env.example documenta campos previstos sin credenciales.

Git privado es la dirección del proyecto, pero no se inicializó ni publicó ningún
repositorio durante esta fase. Antes de versionar, comprobar ignorados y contenido:
las exclusiones no sustituyen la revisión de secretos. No situar datos personales
en ejemplos, memoria, snapshots o logs del repositorio.

El despliegue al HP requiere inventario previo y una fase distinta. Los archivos
de infrastructure/ son planes desactivados, no evidencian instalaciones. La ruta
de trabajo actual no cambia la decisión de usar almacenamiento local en el HP.
