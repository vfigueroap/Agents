# Verificación de la reorganización

15 de noviembre de 2026. Alcance: ordenar el espacio, facilitar la navegación y
preparar la publicación en `vfigueroap/Agents`. Se conserva el código del sistema
canónico y se cambia su documentación de entrada.

## Archivos y funcionamiento

- PASS: ocho carpetas originales agrupadas en `privado/perfiles-originales/`;
  doce archivos, incluido el contexto maestro, comparados antes y después por
  SHA-256 sin diferencias. Se conservaron las carpetas vacías.
- PASS: `Guia/` conserva su ubicación y su repositorio, sin cambios en su árbol de trabajo.
- PASS: `npm run check` desde la raíz valida los contratos, ejecuta 46 pruebas
  con cero fallos y comprueba la demostración sintética con total 180.
- PASS: no se añadieron dependencias ni se activaron conexiones, modelos o servicios del sistema.
- PASS: Git excluye `Guia/`, `privado/`, `floorplan/`, bundles, temporales y secretos.
- PASS: comprobación de destinos locales de los enlaces Markdown y revisión de patrones
  habituales de credenciales sobre los archivos publicables. Es una revisión acotada,
  no una auditoría de seguridad.

## Diagrama publicado

Archivo: [arquitectura.html](arquitectura.html). Servido y abierto en el navegador.
Comprobaciones de Diagram Design: `self_check.py` y `verify_geometry.py`, ambas
sin hallazgos. Se verificó el SVG accesible, el contenido dentro del lienzo,
los conectores ortogonales y el cruce con puente.

| Elemento | Acción y resultado observado |
| --- | --- |
| Ver el recorrido | Navega a `#mapa` en escritorio y móvil |
| Cómo leerlo | Navega a `#lectura`; también funciona con Tab y Enter |
| Qué sigue pendiente | Navega a `#limites` en escritorio y móvil |
| Región del diagrama | Recibe foco y se desplaza horizontalmente con la flecha derecha |
| Foco | El enlace enfocado muestra contorno sólido visible |
| Pantallas | Sin desbordamiento de página a 320, 390, 768 y 1280 px; solo el diagrama tiene desplazamiento local |
| Objetivos táctiles | Los tres enlaces de navegación tienen 44 px de alto |
| Consola | Sin errores ni advertencias observados durante estas pruebas |

Contraste calculado sobre `#f5f5f5`: texto `#2d3142`, 11.82:1;
secundario `#4f5d75`, 6.11:1; enlaces y foco `#bf4520`, 4.71:1.
Las familias declaradas se comprobaron mediante estilos calculados y revisión
visual; hay alternativas del sistema cuando Google Fonts no carga.

## Mapa interactivo local

Floorplan asigna y describe los 126 archivos incluidos, con cero sin asignar,
21 módulos descritos y 47 conexiones. Incluye código, configuración y ejemplos
de datos. Excluye los documentos de prosa y otros archivos, que se recorren por
los índices Markdown. Sus fuentes editables son `floorplan/architecture.json`
y `floorplan/descriptions/`; se puede pedir «actualiza el floorplan».

Se abrió el mapa, se buscó `runtime.mjs` y se comprobó el detalle del archivo y
sus dependencias. Una búsqueda sin coincidencias mostró «No matches»; Enter
abrió el resultado y Overview volvió al nivel general. No hubo errores de consola
observados. El control Ask no se ejecutó.

El chequeo automático Health no mostró hallazgos. La comprobación de inicio de
sesión no se realizó porque no hay rutas HTTP detectadas en este sistema local.
No había reglas Supabase, Firebase ni código Stripe que comprobar. El mapa queda
fuera de Git; el diagrama HTML general sí forma parte de la publicación.

## Antislop: Delivery Gate

Aplicado a la documentación nueva y al diagrama escrito para esta tarea.
El visor de Floorplan se genera con la skill instalada y se verificó en el
alcance descrito arriba; su interfaz no se rediseñó.

### Hard Gate

- R-02 PASS: la prosa nueva no usa raya larga.
- R-03 PASS: cuatro anchuras comprobadas; diagrama con desplazamiento local y enlaces de 44 px.
- R-17 PASS: las cifras describen archivos, pruebas o mediciones observadas, sin estadísticas comerciales.
- R-18 PASS: no hay testimonios.
- R-23 PASS: estilo predeterminado elegido por el usuario; navegación tomada de destinos reales; sin logos ni avatares.
- R-24 PASS: los tres destinos de navegación existen y se probaron.
- R-25 PASS: los tres pares de texto y fondo superan 4.5:1.
- R-26 PASS: los tres enlaces producen la navegación indicada en la tabla de pruebas.
- R-27 PASS: documento estático con contenido integrado, sin carga ni consulta de datos y sin estados asíncronos que implementar.
- R-28 PASS: no hay FAQ.
- R-32 PASS: Tab, Enter y desplazamiento por flechas probados, con foco visible.
- R-33 PASS: el HTML y sus estilos se escribieron directamente en el archivo fuente.
- R-34 PASS: un solo tema claro de lectura e impresión; no hay selector de tema.
- R-35 PASS: documento servido, abierto y recorrido; consola revisada y acciones registradas arriba.
- R-36 PASS: las afirmaciones se limitan al código y a comprobaciones realizadas.
- R-37 PASS: dirección elegida antes del diagrama y registrada en DESIGN.md.
- R-38 PASS: nombres, archivos y responsabilidades tomados del sistema existente.
- R-39 PASS: enlaces nativos con nombres visibles, cursor, hover, pulsación y foco; landmarks, lang y título presentes; sin formularios, controles deshabilitados ni animaciones.
- R-40 PASS: no hay imágenes, vídeos, iframes ni scripts externos; el SVG tiene viewBox. No se publican métricas de rendimiento.

### Purpose-Gate

- R-01 PASS: sin gradientes ni brillos; terracota reservado al punto de ejecución y a la navegación.
- R-04 PASS: sin iconos decorativos.
- R-06 PASS: serif para título, sans para nombres y mono solo para rutas; motivos en DESIGN.md.
- R-07 PASS: fondo liso de lectura, sin patrones.
- R-08 PASS: las flechas representan relaciones del sistema, no decoración de botones.
- R-09 PASS: sin badges.
- R-10 PASS: sin desenfoques ni superficies de vidrio.
- R-12 PASS: sin sombras.
- R-13 PASS: sin efectos de brillo.
- R-14 PASS: las cajas representan responsabilidades; no se usan tarjetas comerciales.
- R-19 PASS: documento estático coherente con MOTION 1.
- R-22 PASS: sin ilustraciones.

### Dirección y vitalidad

- Diales PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 declarados en DESIGN.md antes de generar.
- Coherencia PASS: título editorial, recorrido horizontal y lectura en dos columnas que pasa a una en móvil.
- Foco PASS: título como entrada y ejecutor como único nodo acentuado.
- Espacio PASS: separación entre recorrido, explicación y límites; geometría en múltiplos de cuatro.
- Acento PASS: terracota con función concreta y sin repetición sobre todos los nodos.
- Identidad PASS: nombres humanos junto a rutas reales como motivo del índice.
- Design Read PASS: propósito, público, lenguaje y diales declarados antes de crear el diagrama.

### Craftsmanship y Quality Locks

- C-1 PASS: color, tipografía, estructura, bordes y movimiento tienen motivo en DESIGN.md.
- C-2 PASS: todas las interacciones del documento producen resultados comprobados.
- C-3 PASS: recorrido, explicación y pendientes corresponden al contenido real del sistema.
- C-4 PASS: tema único, anchos móviles, foco y navegación por teclado comprobados.
- C-5 PASS: sin testimonios, resultados de negocio ni garantías inventadas.
- R-05 PASS: estructura de guía y diagrama, sin secciones de una plantilla comercial.
- R-11 PASS: bordes de radio 6 en figura y nodos, sin elementos en forma de píldora.
- R-15 PASS: acciones concretas: ver recorrido, leer explicación y consultar pendientes.
- R-16 PASS: la prosa explica el alcance local sin eslóganes.
- R-20 PASS: el recorrido, las rutas y los límites corresponden a este sistema.
- R-21 PASS: tema de papel fijo para leer e imprimir la misma figura, documentado en DESIGN.md.
- R-29 PASS: base neutra, texto secundario y un acento terracota.
- R-30 PASS: no se copió la interfaz de otro producto.
- R-31 PASS: cada decisión visual principal tiene una razón en DESIGN.md.

## Límites

No se desplegó el sistema ni se probaron integraciones externas. No se midieron
Lighthouse ni Core Web Vitals. Las pruebas de enlaces simbólicos usaron la guarda
simulada porque este host no permite crearlos. `agent-desktop` no pudo iniciarse
por los permisos locales de su archivo privado; la revisión visual se hizo con
el navegador disponible. Los originales personales no se migraron ni publicaron.

Los proyectos o accesos directos que usaban las carpetas anteriores deben abrirse
desde sus nuevas ubicaciones. Git no respalda `privado/` ni el mapa local.
