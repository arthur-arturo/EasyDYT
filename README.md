# EasyDYT (Easy Download for YouTube)

**EasyDYT** es una extensión de navegador súper ligera y limpia diseñada para descargar audio (MP3 a 320kbps) y video (MP4 en calidad máxima) de YouTube y Shorts con un solo clic, sin anuncios, sin registros y de forma 100% nativa.

---

## Características Principales

*   **Integración Premium Nativa**: Inyecta dos botones compactos ("MP3" y "Video") perfectamente integrados a la derecha del botón "Suscribirse" (o de forma vertical en la barra lateral de Shorts), respetando el tema claro/oscuro de YouTube.
*   **Alta Disponibilidad**: Si un servidor de descarga falla o excede sus límites de frecuencia (Rate Limits), la extensión rota de forma transparente a través de un pool de servidores comunitarios de respaldo para completar la descarga.
*   **Validación de Integridad**: Comprueba automáticamente que el servidor no entregue archivos vacíos (0 bytes) antes de guardarlos. Si el flujo es nulo, descarta el servidor e intenta con la siguiente alternativa.
*   **Avisos Inteligentes**: Si un video está restringido por edad o requiere inicio de sesión en YouTube, te informa de manera descriptiva en pantalla.

---

## Guía de Instalación

1.  Descarga o clona este directorio en tu equipo.
2.  Abre tu navegador (Chrome, Brave, Edge, Opera o cualquier navegador basado en Chromium).
3.  Navega a la sección de extensiones escribiendo `chrome://extensions/` en la barra de direcciones.
4.  Activa el **"Modo de desarrollador"** (interruptor en la esquina superior derecha).
5.  Haz clic en **"Cargar descomprimida"** (esquina superior izquierda) y selecciona la carpeta de esta extensión (`yt-downloader-extension`).
6.  ¡Listo! Abre cualquier video o Short en YouTube para empezar a descargar.

---

## Tecnologías Utilizadas

*   **Core Frontend**: HTML5, CSS3 Vanilla (estilos adaptados a las variables CSS oficiales de YouTube) y JavaScript (ES6+).
*   **Service Workers**: Manifest V3 de Chromium (`background.js`) para coordinar la cola de peticiones de fondo, la validación de cabeceras HTTP y el uso de la API nativa de descargas de Chrome (`chrome.downloads`).
*   **API Engine (Cobalt)**: Integra instancias descentralizadas de la API de **Cobalt**, delegando el procesamiento, transcodificación y empaquetado de archivos en la nube (evitando dependencias locales pesadas como Node, Python o client-side WebAssembly ffmpeg).
