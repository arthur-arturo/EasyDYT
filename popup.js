// Lógica del Panel de Configuración (popup.js)

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

  // 1. Cargar configuración actual
  const storage = await chrome.storage.local.get("cobaltInstance");
  let activeInstance = storage.cobaltInstance || DEFAULT_INSTANCE;

  if (DEPRECATED_INSTANCES.some(dep => activeInstance.includes(dep))) {
    activeInstance = DEFAULT_INSTANCE;
  }

  serverInput.value = activeInstance;

  // 2. Resaltar botón de preset activo al iniciar
  updateActivePresetHighlight(activeInstance);

  // 3. Lógica para guardar la configuración
  saveBtn.addEventListener("click", async () => {
    let customUrl = serverInput.value.trim();
    
    if (!customUrl) {
      customUrl = DEFAULT_INSTANCE;
      serverInput.value = DEFAULT_INSTANCE;
    }

    // Guardar en chrome.storage
    await chrome.storage.local.set({ cobaltInstance: customUrl });
    
    // Actualizar resaltado
    updateActivePresetHighlight(customUrl);

    // Feedback táctil premium de guardado exitoso
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "✓";
    saveBtn.style.backgroundColor = "#2ecc71";
    
    setTimeout(() => {
      saveBtn.innerText = originalText;
      saveBtn.style.backgroundColor = ""; // Regresa al CSS original
    }, 1500);
  });

  // 4. Lógica de clics en los presets
  presetButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const targetUrl = btn.getAttribute("data-url");
      serverInput.value = targetUrl;
      
      // Guardar inmediatamente al hacer clic
      await chrome.storage.local.set({ cobaltInstance: targetUrl });
      
      // Actualizar resaltado
      updateActivePresetHighlight(targetUrl);

      // Feedback en el botón de preset para mayor interactividad
      btn.style.borderColor = "#2ecc71";
      setTimeout(() => {
        btn.style.borderColor = "";
      }, 1000);
    });
  });

  // Función para resaltar el preset activo correspondiente a la URL configurada
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
