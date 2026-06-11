// Instancia comunitaria predeterminada con 100% de éxito verificada
const DEFAULT_INSTANCE = "https://cobaltapi.kittycat.boo";
const DEPRECATED_INSTANCES = [
  "dog.kittycat.boo",
  "apicobalt.mgytr.top",
  "subito-c.meowing.de",
  "nuko-c.meowing.de",
  "cobalt.alpha.wolfy.love"
];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadMp3") {
    handleDownload(request.url, "audio")
      .then(() => {
        sendResponse({ success: true, message: "Descarga de MP3 iniciada" });
      })
      .catch((error) => {
        console.error("Error en background (MP3):", error);
        sendResponse({ success: false, error: error.message || "Error desconocido" });
      });
    return true;
  }
  
  if (request.action === "downloadMp4") {
    handleDownload(request.url, "video")
      .then(() => {
        sendResponse({ success: true, message: "Descarga de MP4 iniciada" });
      })
      .catch((error) => {
        console.error("Error en background (MP4):", error);
        sendResponse({ success: false, error: error.message || "Error desconocido" });
      });
    return true;
  }
});

async function handleDownload(videoUrl, mode) {
  // 1. Obtener la instancia de Cobalt configurada
  const storage = await chrome.storage.local.get("cobaltInstance");
  let userInstance = storage.cobaltInstance || DEFAULT_INSTANCE;

  // 2. Construir la lista de servidores a intentar (evitando los obsoletos/rotos)
  const FALLBACK_POOL = [
    "https://cobaltapi.kittycat.boo",
    "https://fox.kittycat.boo",
    "https://api.cobalt.liubquanti.click",
    "https://api.cobalt.blackcat.sweeux.org",
    "https://cobaltapi.cjs.nz"
  ];

  let instancesToTry = [];
  
  // Añadir la del usuario primero si es válida y no es obsoleta
  if (userInstance && !DEPRECATED_INSTANCES.some(dep => userInstance.includes(dep))) {
    // Asegurar formato limpio (sin barra final)
    if (userInstance.endsWith("/")) {
      userInstance = userInstance.slice(0, -1);
    }
    instancesToTry.push(userInstance);
  }

  // Añadir las del pool de fallback sin duplicados
  for (const fallback of FALLBACK_POOL) {
    if (!instancesToTry.includes(fallback)) {
      instancesToTry.push(fallback);
    }
  }

  console.log("Cola de servidores a intentar:", instancesToTry);

  let lastError = null;

  // 3. Iterar por cada servidor en la cadena de fallback
  for (let i = 0; i < instancesToTry.length; i++) {
    const currentInstance = instancesToTry[i];
    console.log(`[Intento ${i + 1}/${instancesToTry.length}] Probando servidor: ${currentInstance}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout por servidor
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
      console.log("Respuesta del servidor Cobalt:", data);

      if (data.status === "error") {
        const errCode = data.error?.code || data.text || "error_desconocido";
        
        // Si el video requiere login en YouTube (edad, etc.), arrojamos el código exacto
        if (errCode.includes("youtube.login")) {
          throw new Error("error.api.youtube.login");
        }
        throw new Error(errCode);
      }

      if (!data.url) {
        throw new Error("no_download_url");
      }

      // 4. Validar que la descarga no devuelva un flujo de 0 bytes
      console.log("Validando tamaño de archivo en el túnel...");
      const verifyController = new AbortController();
      const verifyTimeout = setTimeout(() => verifyController.abort(), 6000);

      try {
        const verifyRes = await fetch(data.url, { 
          signal: verifyController.signal 
        });
        
        clearTimeout(verifyTimeout);
        
        const contentLength = verifyRes.headers.get("content-length");
        const estLength = verifyRes.headers.get("estimated-content-length");
        
        verifyController.abort(); // Cancelar flujo de red inmediatamente
        
        console.log(`Headers de validación - Content-Length: ${contentLength}, Estimated-Length: ${estLength}`);

        if (contentLength === "0" || estLength === "-1" || estLength === "0") {
          throw new Error("empty_stream");
        }
      } catch (verifyErr) {
        clearTimeout(verifyTimeout);
        if (verifyErr.message === "empty_stream") {
          throw verifyErr;
        }
        // Errores de red o de timeout en la verificación no deben necesariamente bloquear
        console.warn("Verificación de tamaño ignorada por error de conexión o CORS:", verifyErr.message);
      }

      // 5. Descargar el archivo con éxito
      console.log(`¡Servidor exitoso! Iniciando descarga en Chrome: ${data.url}`);
      return new Promise((resolve, reject) => {
        chrome.downloads.download({
          url: data.url,
          filename: data.filename || undefined,
          saveAs: false
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(downloadId);
          }
        });
      });

    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`Error con el servidor ${currentInstance}:`, error.message);
      lastError = error;

      // Si es un error del tipo restricción de edad (login), y es el último intento
      // o queremos propagarlo, lo guardamos para el reporte final.
      if (error.message === "error.api.youtube.login") {
        // Seguimos intentando con otros servidores por si alguno tiene cookies configuradas,
        // pero registramos el error específico.
        lastError = new Error("error.api.youtube.login");
      }
    }
  }

  // Si llegamos aquí, todos los servidores fallaron
  console.error("Todos los servidores de descarga fallaron.");
  throw lastError || new Error("Todos los servidores de descarga fallaron.");
}
