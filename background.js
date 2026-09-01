// Background Service Worker for EasyDYT v2.0 (Motor 100% Local yt-dlp con Fallback)

const HOST_NAME = "com.easydyt.host";
const DEFAULT_INSTANCE = "https://cobaltapi.kittycat.boo";
const DEPRECATED_INSTANCES = [
  "dog.kittycat.boo",
  "apicobalt.mgytr.top",
  "subito-c.meowing.de",
  "nuko-c.meowing.de",
  "cobalt.alpha.wolfy.love"
];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const tabId = sender.tab ? sender.tab.id : null;

  if (request.action === "downloadMp3") {
    handleDownload(request.url, "audio", tabId)
      .then((res) => {
        if (res.success) {
          sendResponse({ success: true, message: res.message || "Descarga de MP3 completada" });
        } else {
          sendResponse({ success: false, error: res.error || "Error en la descarga" });
        }
      })
      .catch((error) => {
        console.error("Error en background (MP3):", error);
        sendResponse({ success: false, error: error.message || "Error desconocido" });
      });
    return true;
  }
  
  if (request.action === "downloadMp4") {
    handleDownload(request.url, "video", tabId)
      .then((res) => {
        if (res.success) {
          sendResponse({ success: true, message: res.message || "Descarga de MP4 completada" });
        } else {
          sendResponse({ success: false, error: res.error || "Error en la descarga" });
        }
      })
      .catch((error) => {
        console.error("Error en background (MP4):", error);
        sendResponse({ success: false, error: error.message || "Error desconocido" });
      });
    return true;
  }
});

// Función orquestadora
async function handleDownload(videoUrl, mode, tabId) {
  // 1. Intentar descargar mediante el motor local (yt-dlp + ffmpeg)
  try {
    console.log("[EasyDYT] Ejecutando descarga en Motor Local...");
    const localResult = await tryNativeDownload(videoUrl, mode, tabId);
    return localResult;
  } catch (nativeErr) {
    console.warn("[EasyDYT] Host nativo no disponible o no instalado:", nativeErr.message);
    
    // Solo si el host nativo no existe en el sistema, recurrir a Cobalt
    if (nativeErr.message.includes("HOST_NOT_INSTALLED") || nativeErr.message.includes("not found") || nativeErr.message.includes("Specified native messaging host not found")) {
      console.log("[EasyDYT] Recurriendo a servidores Cobalt...");
      return await handleCobaltDownload(videoUrl, mode);
    }

    return { success: false, error: nativeErr.message };
  }
}

// Descarga mediante Native Messaging con streaming de progreso (100% local en tu PC)
function tryNativeDownload(videoUrl, mode, tabId) {
  return new Promise((resolve, reject) => {
    let port;
    try {
      port = chrome.runtime.connectNative(HOST_NAME);
    } catch (e) {
      return reject(new Error("HOST_NOT_INSTALLED: " + e.message));
    }

    let isResolved = false;

    port.onMessage.addListener((msg) => {
      console.log("[EasyDYT Background] Recibido del host:", msg);
      if (msg.type === "progress" || msg.type === "status") {
        if (tabId) {
          chrome.tabs.sendMessage(tabId, {
            action: "downloadProgress",
            mode: mode,
            percent: msg.percent,
            status: msg.status || msg.text
          }).catch(() => {});
        }
      } else if (msg.type === "complete" || msg.success !== undefined) {
        isResolved = true;
        port.disconnect();
        resolve(msg);
      }
    });

    port.onDisconnect.addListener(() => {
      if (!isResolved) {
        const err = chrome.runtime.lastError ? chrome.runtime.lastError.message : "Conexión con el host cerrada inesperadamente";
        reject(new Error(err));
      }
    });

    port.postMessage({ action: "download", url: videoUrl, mode: mode });
  });
}

// Descarga mediante servidores Cobalt (Solo en caso de no tener el host local)
async function handleCobaltDownload(videoUrl, mode) {
  const storage = await chrome.storage.local.get("cobaltInstance");
  let userInstance = storage.cobaltInstance || DEFAULT_INSTANCE;

  const FALLBACK_POOL = [
    "https://cobaltapi.kittycat.boo",
    "https://fox.kittycat.boo",
    "https://api.cobalt.liubquanti.click",
    "https://api.cobalt.blackcat.sweeux.org",
    "https://cobaltapi.cjs.nz"
  ];

  let instancesToTry = [];
  if (userInstance && !DEPRECATED_INSTANCES.some(dep => userInstance.includes(dep))) {
    if (userInstance.endsWith("/")) {
      userInstance = userInstance.slice(0, -1);
    }
    instancesToTry.push(userInstance);
  }

  for (const fallback of FALLBACK_POOL) {
    if (!instancesToTry.includes(fallback)) {
      instancesToTry.push(fallback);
    }
  }

  let lastError = null;

  for (let i = 0; i < instancesToTry.length; i++) {
    const currentInstance = instancesToTry[i];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const requestBody = {
        url: videoUrl,
        filenameStyle: "basic"
      };

      if (mode === "audio") {
        requestBody.downloadMode = "audio";
        requestBody.audioFormat = "mp3";
        requestBody.audioBitrate = "320";
      } else {
        requestBody.downloadMode = "auto";
        requestBody.videoQuality = "max";
      }

      const response = await fetch(currentInstance, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP_${response.status}: ${errText.slice(0, 100)}`);
      }

      const data = await response.json();

      if (data.status === "error") {
        const errCode = data.error?.code || data.text || "error_desconocido";
        if (errCode.includes("youtube.login")) {
          throw new Error("error.api.youtube.login");
        }
        throw new Error(errCode);
      }

      if (!data.url) {
        throw new Error("no_download_url");
      }

      return new Promise((resolve, reject) => {
        chrome.downloads.download({
          url: data.url,
          filename: data.filename || undefined,
          saveAs: false
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve({ success: true, downloadId });
          }
        });
      });

    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      if (error.message === "error.api.youtube.login") {
        lastError = new Error("error.api.youtube.login");
      }
    }
  }

  throw lastError || new Error("Todos los servidores de descarga fallaron.");
}
