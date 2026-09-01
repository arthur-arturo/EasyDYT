// Lógica del Panel de Configuración (popup.js)

const HOST_NAME = "com.easydyt.host";
const DEFAULT_INSTANCE = "https://cobaltapi.kittycat.boo";
const DEPRECATED_INSTANCES = [
  "dog.kittycat.boo",
  "apicobalt.mgytr.top",
  "subito-c.meowing.de",
  "nuko-c.meowing.de",
  "cobalt.alpha.wolfy.love"
];

document.addEventListener("DOMContentLoaded", async () => {
  const serverInput = document.getElementById("server-input");
  const saveBtn = document.getElementById("save-btn");
  const presetButtons = document.querySelectorAll(".preset-btn");
  const statusText = document.getElementById("engine-status-text");
  const localBadge = document.getElementById("local-badge");

  // 1. Probar conexión con el Host Nativo Local (yt-dlp)
  try {
    chrome.runtime.sendNativeMessage(HOST_NAME, { action: "ping" }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        console.warn("Host Nativo no conectado:", chrome.runtime.lastError?.message);
        if (statusText) statusText.innerText = "Nube (Cobalt)";
        if (localBadge) {
          localBadge.innerText = "☁️ Nube (Fallback)";
          localBadge.style.color = "#f1c40f";
        }
      } else {
        if (statusText) statusText.innerText = "Motor Local Activo";
        if (localBadge) {
          localBadge.innerText = "⚡ Local (yt-dlp)";
          localBadge.style.color = "#2ecc71";
        }
      }
    });
  } catch (err) {
    console.warn("Error enviando ping nativo:", err);
  }

  // 2. Cargar configuración de servidor en la nube actual
  const storage = await chrome.storage.local.get("cobaltInstance");
  let activeInstance = storage.cobaltInstance || DEFAULT_INSTANCE;

  if (DEPRECATED_INSTANCES.some(dep => activeInstance.includes(dep))) {
    activeInstance = DEFAULT_INSTANCE;
  }

  serverInput.value = activeInstance;
  updateActivePresetHighlight(activeInstance);

  // 3. Lógica para guardar la configuración
  saveBtn.addEventListener("click", async () => {
    let customUrl = serverInput.value.trim();
    
    if (!customUrl) {
      customUrl = DEFAULT_INSTANCE;
      serverInput.value = DEFAULT_INSTANCE;
    }

    await chrome.storage.local.set({ cobaltInstance: customUrl });
    updateActivePresetHighlight(customUrl);

    const originalText = saveBtn.innerText;
    saveBtn.innerText = "✓";
    saveBtn.style.backgroundColor = "#2ecc71";
    
    setTimeout(() => {
      saveBtn.innerText = originalText;
      saveBtn.style.backgroundColor = "";
    }, 1500);
  });

  // 4. Lógica de clics en los presets
  presetButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const targetUrl = btn.getAttribute("data-url");
      serverInput.value = targetUrl;
      
      await chrome.storage.local.set({ cobaltInstance: targetUrl });
      updateActivePresetHighlight(targetUrl);

      btn.style.borderColor = "#2ecc71";
      setTimeout(() => {
        btn.style.borderColor = "";
      }, 1000);
    });
  });

  function updateActivePresetHighlight(currentUrl) {
    presetButtons.forEach(btn => {
      const url = btn.getAttribute("data-url");
      if (url === currentUrl) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }
});
