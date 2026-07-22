// Iconos SVG Premium
const SVG_ICON_MP3 = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="margin-right: 6px;">
  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  <path d="M16 15l-3 3-3-3h2v-4h2v4h2z"/>
</svg>`;

const SVG_ICON_MP4 = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="margin-right: 6px;">
  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
  <path d="M11 10.5l-3 3-3-3h2v-4h2v4h2z"/>
</svg>`;

// Iconos circulares simplificados para Shorts
const SVG_ICON_SHORTS_MP3 = `
<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
</svg>`;

const SVG_ICON_SHORTS_MP4 = `
<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
</svg>`;

// Detectar idioma del navegador
const isSpanish = navigator.language.startsWith("es");
const TEXT_DOWNLOAD_MP3 = "MP3";
const TEXT_DOWNLOAD_MP4 = "Video";

const TEXT_DOWNLOADING = isSpanish ? "Procesando..." : "Processing...";
const TEXT_SUCCESS = isSpanish ? "¡Listo!" : "Done!";
const TEXT_ERROR = isSpanish ? "¡Error!" : "Error!";

// Lógica de inyección con MutationObserver
const observer = new MutationObserver(() => {
  if (window.location.pathname.includes("/watch")) {
    injectWatchButtons();
  } else if (window.location.pathname.includes("/shorts")) {
    injectShortsButtons();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Inyectar los dos botones (MP3 y MP4) en la página del video estándar
function injectWatchButtons() {
  const existingMp3 = document.querySelector(".yt-mp3-btn-watch");
  const existingMp4 = document.querySelector(".yt-mp4-btn-watch");
  if (existingMp3 && document.body.contains(existingMp3) && existingMp4 && document.body.contains(existingMp4)) {
    return;
  }

  const ownerContainer = document.querySelector("ytd-video-owner-renderer");
  if (!ownerContainer) return;

  if (existingMp3) existingMp3.remove();
  if (existingMp4) existingMp4.remove();

  // Buscar el contenedor del botón de suscripción (#subscribe-button o el renderer)
  const subscribeContainer = document.querySelector("ytd-watch-metadata #subscribe-button") || 
                             document.querySelector("ytd-watch-metadata ytd-subscribe-button-renderer") ||
                             document.querySelector("ytd-subscribe-button-renderer");

  // 1. Crear Botón MP3
  const btnMp3 = document.createElement("button");
  btnMp3.className = "yt-mp3-btn-watch yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m";
  btnMp3.innerHTML = `${SVG_ICON_MP3} <span class="yt-btn-text">${TEXT_DOWNLOAD_MP3}</span>`;
  btnMp3.addEventListener("click", () => {
    handleDownloadClick(btnMp3, window.location.href, "downloadMp3", false, TEXT_DOWNLOAD_MP3);
  });

  // 2. Crear Botón MP4
  const btnMp4 = document.createElement("button");
  btnMp4.className = "yt-mp4-btn-watch yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m";
  btnMp4.innerHTML = `${SVG_ICON_MP4} <span class="yt-btn-text">${TEXT_DOWNLOAD_MP4}</span>`;
  btnMp4.addEventListener("click", () => {
    handleDownloadClick(btnMp4, window.location.href, "downloadMp4", false, TEXT_DOWNLOAD_MP4);
  });

  // Si encontramos el botón de suscribirse en la página, insertamos inmediatamente a la derecha
  if (subscribeContainer && subscribeContainer.parentNode) {
    let targetElement = subscribeContainer;
    // Si targetElement es ytd-subscribe-button-renderer dentro de #subscribe-button, usamos #subscribe-button para asegurar posición exterior en la fila
    if (targetElement.id !== "subscribe-button" && targetElement.parentNode && targetElement.parentNode.id === "subscribe-button") {
      targetElement = targetElement.parentNode;
    }
    targetElement.parentNode.insertBefore(btnMp4, targetElement.nextSibling);
    targetElement.parentNode.insertBefore(btnMp3, targetElement.nextSibling);
    console.log("Botones MP3 y MP4 inyectados exitosamente a la derecha de suscribirse");
  } else {
    // Fallback: agregamos al final del contenedor del canal (ej. videos propios del usuario)
    const buttonsContainer = ownerContainer.querySelector("#buttons") || ownerContainer;
    buttonsContainer.appendChild(btnMp3);
    buttonsContainer.appendChild(btnMp4);
    console.log("Botones MP3 y MP4 inyectados en el contenedor de fallback");
  }
}

// Inyectar los dos botones en Shorts
function injectShortsButtons() {
  const shortRenderers = document.querySelectorAll("ytd-reel-video-renderer");
  if (shortRenderers.length === 0) return;

  shortRenderers.forEach((renderer) => {
    const actionsContainer = renderer.querySelector("#actions");
    if (!actionsContainer) return;

    // Evitar duplicados en este Short específico
    if (actionsContainer.querySelector(".yt-mp3-btn-short-container")) return;

    // 1. Contenedor e Inyección de Botón MP3
    const mp3Wrapper = document.createElement("div");
    mp3Wrapper.className = "yt-mp3-btn-short-container";
    
    const btnMp3 = document.createElement("button");
    btnMp3.className = "yt-mp3-btn-short";
    btnMp3.innerHTML = SVG_ICON_SHORTS_MP3;
    
    const labelMp3 = document.createElement("span");
    labelMp3.className = "yt-mp3-btn-short-label";
    labelMp3.innerText = "MP3";
    
    mp3Wrapper.appendChild(btnMp3);
    mp3Wrapper.appendChild(labelMp3);

    btnMp3.addEventListener("click", () => {
      handleDownloadClick(btnMp3, window.location.href, "downloadMp3", true, "MP3", labelMp3);
    });

    // 2. Contenedor e Inyección de Botón MP4
    const mp4Wrapper = document.createElement("div");
    mp4Wrapper.className = "yt-mp4-btn-short-container";
    
    const btnMp4 = document.createElement("button");
    btnMp4.className = "yt-mp4-btn-short";
    btnMp4.innerHTML = SVG_ICON_SHORTS_MP4;
    
    const labelMp4 = document.createElement("span");
    labelMp4.className = "yt-mp4-btn-short-label";
    labelMp4.innerText = TEXT_DOWNLOAD_MP4;
    
    mp4Wrapper.appendChild(btnMp4);
    mp4Wrapper.appendChild(labelMp4);

    btnMp4.addEventListener("click", () => {
      handleDownloadClick(btnMp4, window.location.href, "downloadMp4", true, TEXT_DOWNLOAD_MP4, labelMp4);
    });

    // Insertar ambos botones antes del botón de Compartir/Remix
    const shareButton = actionsContainer.querySelector("ytd-button-renderer[service-action]") || actionsContainer.lastElementChild;
    if (shareButton) {
      actionsContainer.insertBefore(mp3Wrapper, shareButton);
      actionsContainer.insertBefore(mp4Wrapper, shareButton);
    } else {
      actionsContainer.appendChild(mp3Wrapper);
      actionsContainer.appendChild(mp4Wrapper);
    }
    console.log("Botones MP3 y MP4 inyectados en Short");
  });
}
// Manejar la acción de descarga genérica con control de excepciones robusto
function handleDownloadClick(btnElement, url, action, isShort, defaultText, labelElement = null) {
  if (btnElement.classList.contains("loading")) return;

  // Cambiar estado a "Cargando"
  btnElement.classList.add("loading");
  if (!isShort) {
    btnElement.querySelector(".yt-btn-text").innerText = TEXT_DOWNLOADING;
  } else if (labelElement) {
    labelElement.innerText = "...";
  }

  try {
    // Enviar mensaje al service worker de fondo
    chrome.runtime.sendMessage({ action: action, url: url }, (response) => {
      btnElement.classList.remove("loading");

      // Verificar respuesta
      if (chrome.runtime.lastError || !response || !response.success) {
        const errorMsg = response?.error || chrome.runtime.lastError?.message || "Error de red";
        console.error("Fallo la descarga:", errorMsg);
        
        // Si el error es por restricción de edad / login de YouTube, mostramos alerta clara
        if (errorMsg.includes("youtube.login")) {
          const isSpanish = navigator.language.startsWith("es");
          const alertMsg = isSpanish
            ? "Este video está restringido por edad o requiere iniciar sesión en YouTube.\nLos servidores públicos de Cobalt no pueden acceder a contenido restringido."
            : "This video is age-restricted or requires signing in to YouTube.\nPublic Cobalt download servers cannot access restricted content.";
          alert(alertMsg);
        }
        
        // Estado de Error
        btnElement.classList.add("error");
        if (!isShort) {
          btnElement.querySelector(".yt-btn-text").innerText = TEXT_ERROR;
        } else if (labelElement) {
          labelElement.innerText = "Err";
        }

        // Volver a estado normal tras 3 segundos
        setTimeout(() => {
          btnElement.classList.remove("error");
          if (!isShort) {
            btnElement.querySelector(".yt-btn-text").innerText = defaultText;
          } else if (labelElement) {
            labelElement.innerText = defaultText;
          }
        }, 3000);
      } else {
        // Estado Exitoso
        btnElement.classList.add("success");
        if (!isShort) {
          btnElement.querySelector(".yt-btn-text").innerText = TEXT_SUCCESS;
        } else if (labelElement) {
          labelElement.innerText = "OK!";
        }

        // Volver a estado normal tras 3 segundos
        setTimeout(() => {
          btnElement.classList.remove("success");
          if (!isShort) {
            btnElement.querySelector(".yt-btn-text").innerText = defaultText;
          } else if (labelElement) {
            labelElement.innerText = defaultText;
          }
        }, 3000);
      }
    });
  } catch (err) {
    // En caso de que se actualice la extensión pero no se recargue la pestaña de YouTube,
    // se captura la excepción "Extension context invalidated" para no congelar el botón.
    console.error("Error al enviar mensaje:", err);
    btnElement.classList.remove("loading");
    btnElement.classList.add("error");
    
    const isSpanish = navigator.language.startsWith("es");
    const reloadText = isSpanish ? "Recargar Pág." : "Reload Page";
    
    if (!isShort) {
      btnElement.querySelector(".yt-btn-text").innerText = reloadText;
    } else if (labelElement) {
      labelElement.innerText = "Ref";
    }

    setTimeout(() => {
      btnElement.classList.remove("error");
      if (!isShort) {
        btnElement.querySelector(".yt-btn-text").innerText = defaultText;
      } else if (labelElement) {
        labelElement.innerText = defaultText;
      }
    }, 5000);
  }
}
