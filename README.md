# ⚠️ Proyecto Deprecado (Deprecated) — EasyDYT

> **Este repositorio ha sido deprecado y archivado.**

## Motivo de la deprecación

**EasyDYT** nació originalmente utilizando la API pública de **Cobalt** y servidores externos de terceros para procesar y descargar audio/video desde YouTube.

Con el tiempo, depender de servicios externos demostró ser poco confiable:
- Caídas frecuentes de las instancias públicas de Cobalt.
- Límites de peticiones (*rate limits*), bloqueos y errores inesperados.
- Tiempos de espera (*timeouts*) en videos largos o transmisiones.

Por este motivo, el proyecto deja de mantenerse bajo este enfoque y pasa a reemplazarse por una solución **100% local** basada directamente en **`yt-dlp`** (junto con **`FFmpeg`**), sin intermediarios ni servidores externos.

---

<details>
<summary>Documentación histórica (versión anterior)</summary>

**EasyDYT** era una extensión de navegador diseñada para descargar audio (MP3) y video (MP4) de YouTube y Shorts desde la interfaz web.

* **Integración en YouTube**: Botones "MP3" y "Video" junto al botón de suscripción y en Shorts.
* **Arquitectura original**: Extensión Manifest V3 conectada inicialmente a instancias comunitarias de Cobalt.

</details>
