# SOC Ticket Composer

Generador de tickets de escalamiento a L2 para analistas SOC. Completás un formulario con la severidad, la alerta original, los indicadores (IOCs), los activos afectados y tus notas — y obtenés el ticket ya redactado en texto plano, listo para pegar en tu herramienta de tickets (Jira, ServiceNow, etc.).

100% del lado del cliente: no hay backend, no se envían datos a ningún servidor. Todo se genera en el navegador.

## Demo

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
- **Formato del ticket generado**: la función `buildTicket()` en `js/app.js` arma el texto final — es el lugar para ajustar el formato a la plantilla de tu equipo.
- **Colores y tipografía**: variables CSS al inicio de `css/styles.css` (`:root`).

## Roadmap posible

- Guardar plantillas de tickets frecuentes (localStorage).
- Exportar directamente a la API de Jira/ServiceNow.
- Historial de tickets generados en la sesión.
- Soporte multi-idioma.

## Licencia

MIT — ver [LICENSE](LICENSE).
