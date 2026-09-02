# Auto Ticket SOC

Generador de tickets de escalamiento a L2 para analistas SOC. Trabajá varias alertas en paralelo con pestañas, completá severidad, alerta original, indicadores (IOCs), activos afectados, notas y acciones recomendadas — y obtenés el ticket ya redactado en texto plano, listo para pegar en tu herramienta de tickets (Jira, ServiceNow, etc.).

100% del lado del cliente: no hay backend, no se envían datos a ningún servidor. Todo se genera y se guarda en tu propio navegador.

### Pestañas — una alerta por pestaña

Arriba del formulario hay una barra de pestañas: cada una es una alerta independiente, con sus propios datos (severidad, IOCs, activos, notas, acciones). El botón "+" crea una alerta nueva; la "×" de cada pestaña la cierra. Doble clic sobre el nombre de una pestaña para renombrarla (por ejemplo, con el número de ticket real o un nombre corto que la identifique). Las pestañas se guardan automáticamente y siguen ahí la próxima vez que abras la app.

### Exportar todo el turno a PDF

El botón "Exportar turno (PDF)" del encabezado arma un reporte con **todas** las pestañas abiertas (todas las alertas trabajadas en la sesión) y abre el diálogo de impresión del navegador. Ahí elegís "Guardar como PDF" en vez de una impresora física, y queda un único archivo con todos los tickets de la jornada, uno detrás del otro. No usa ninguna librería externa — es la función nativa de imprimir del navegador, aplicada a una vista especial pensada para eso.

### Listas totalmente editables

"Severidad" y "Acciones recomendadas para L2" no son listas cerradas: podés agregar tus propias etiquetas y también **borrar cualquiera**, incluidas las que vienen por defecto. Borrar una etiqueta te pide confirmación porque es una lista compartida por todas las alertas — si la borrás, desaparece de todas las pestañas donde estaba seleccionada.

Todo (pestañas, etiquetas de severidad, etiquetas de acciones) queda guardado en `localStorage` de tu navegador: no se comparte con nadie ni se sube a ningún servidor, pero tampoco se sincroniza entre dispositivos o navegadores distintos.

## Demo

Una vez publicado con GitHub Pages (ver más abajo), la demo queda disponible en:

```
https://ttomiid.github.io/auto-ticket/
```

## Uso local

No requiere instalación ni dependencias. Alcanza con abrir `index.html` en el navegador, o servirlo con cualquier servidor estático:

```bash
# opción 1: abrir directo
open index.html

# opción 2: servidor local simple
python3 -m http.server 8000
```

## Estructura del proyecto

```
soc-ticket-composer/
├── index.html          # marcado y formulario
├── css/
│   └── styles.css      # estilos
├── js/
│   └── app.js          # lógica: estado, generación de texto, copiar/descargar
├── README.md
└── LICENSE
```

## Publicar con GitHub Pages

1. Subí este proyecto a un repositorio en GitHub.
2. Andá a **Settings → Pages**.
3. En **Source**, elegí la rama `main` y la carpeta `/ (root)`.
4. Guardá. En unos minutos la app queda disponible en `https://<tu-usuario>.github.io/<nombre-del-repo>/`.

## Personalización

- **Campos del formulario**: se editan directamente en `index.html`.
- **Etiquetas iniciales de severidad/acciones**: arrays `SEED_SEVERITIES` y `SEED_ACTIONS` al inicio de `js/app.js` (solo se usan la primera vez; después manda lo guardado en `localStorage`).
- **Formato del ticket generado**: la función `buildTicket()` en `js/app.js` arma el texto final — es el lugar para ajustar el formato a la plantilla de tu equipo.
- **Colores y tipografía**: variables CSS al inicio de `css/styles.css` (`:root`).

## Roadmap posible

- Exportar directamente a la API de Jira/ServiceNow.
- Reordenar pestañas arrastrando.
- Exportar/importar toda la configuración (pestañas + etiquetas) como un archivo, para compartirla entre navegadores o con el equipo.
- Soporte multi-idioma.

## Licencia

MIT — ver [LICENSE](LICENSE).