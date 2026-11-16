---
name: latex
description: Crea, adapta o revisa material académico en LaTeX, incluidos apuntes matemáticos, tareas con ecuaciones, informes técnicos y ayudantías con demostraciones o soluciones. Úsala cuando se pida LaTeX o predomine la matemática sin otro formato indicado.
---

# LaTeX académico

## Cuándo usar

Apuntes formales, demostraciones, tareas/informes con matemática extensa y ayudantías escritas. Respeta Word o PPTX si se solicitan. Si se pide Beamer, usa esta skill y adapta el contenido a exposición.

Lee [AGENTS.md](../../../AGENTS.md). Consulta **Resúmenes y apuntes**, **Resolución de ejercicios** y, según el encargo, **Preparación de ayudantías** o **Informes, ensayos y tareas** en [formatos compartidos](../../formatos.md).

## Contenido según el encargo

- **Apunte:** definiciones, hipótesis, resultados, demostraciones pertinentes, ejemplos y ejercicios. Separar intuición y prueba. Definir notación; conservar numeración original solo al citar la fuente.
- **Ayudantía:** enunciado autosuficiente, propiedad/método, desarrollo, resultado y comprobación. Distinguir guía sin respuestas, pauta e integrada; identificar ejercicios nuevos/adaptados.
- **Informe o tarea:** enunciado/argumento, modelo y supuestos, derivación, resultados, interpretación y referencias/anexos pertinentes.
- **Beamer:** una idea o etapa legible por diapositiva y selección del desarrollo acorde al tiempo. No trasladar páginas densas directamente a exposición.

## Autoría

Inspecciona y respeta la fuente `.tex` o plantilla aportada. Para material nuevo, elige una clase adecuada al producto y configuración mínima en español. Usa paquetes matemáticos como `amsmath` y `amsthm` cuando hagan falta, sin acumular dependencias. Mantén etiquetas/referencias coherentes y numera ecuaciones cuando se citen o lo exija el formato.

Escribe fracciones, índices, matrices y ecuaciones con estructura matemática, sin capturas ni texto aplanado del PDF. Alinea derivaciones largas, indica dominios/condiciones y evita desbordamientos. Conserva unidades/encabezados en tablas.

Verifica matemática antes de maquetar: sustitución y condiciones iniciales en EDO, dimensiones matriciales y sumas de control según el tema. No copies pautas sin comprobar. Define precisión y redondeo según cada ejercicio.

## Compilar y verificar

Detecta el motor disponible y usa el apropiado a la fuente: por ejemplo latexmk con motor configurado, Tectonic, LuaLaTeX o pdfLaTeX. No supongas que está instalado. Compila en un temporal sin habilitar shell-escape para documentos de referencia. Revisa errores, referencias indefinidas y desbordamientos; ejecuta las pasadas necesarias.

Renderiza el PDF compilado e inspecciona fórmulas, tablas, caracteres y saltos. Si no hay motor/dependencia, entrega el `.tex` cuando sea útil e informa que no se compiló. No presentes un PDF como verificado si no existe.

Entrega `.tex`, PDF y recursos necesarios según lo pedido. Los auxiliares de compilación/QA no quedan en el directorio permanente del agente. Evita proyectos multiparchivo salvo que extensión o plantilla lo justifiquen.


