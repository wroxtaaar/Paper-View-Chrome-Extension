const DEFAULTS = {
  enabled: true,
  intensity: 0.28,
  texture: "fine_matte",
  tone: "cream",
  excludedSites: []
};

const enabledEl = document.getElementById("enabled");
const intensityEl = document.getElementById("intensity");
const textureEl = document.getElementById("texture");
const toneEl = document.getElementById("tone");
const excludeBtn = document.getElementById("excludeBtn");

let currentHostname = null;

function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

function save(partial) {
  chrome.storage.sync.set(partial);
}

function refreshExcludeButton(settings) {
  if (!currentHostname) {
    excludeBtn.textContent = "Disable on this site";
    excludeBtn.disabled = true;
    return;
  }
  const isExcluded = (settings.excludedSites || []).includes(currentHostname);
  excludeBtn.textContent = isExcluded
    ? `Enable on ${currentHostname}`
    : `Disable on ${currentHostname}`;
}

async function init() {
  const tab = await getCurrentTab();
  if (tab && tab.url) {
    try {
      currentHostname = new URL(tab.url).hostname;
    } catch (e) {
      currentHostname = null;
    }
  }

  chrome.storage.sync.get(DEFAULTS, (settings) => {
    enabledEl.checked = settings.enabled;
    intensityEl.value = settings.intensity;
    textureEl.value = settings.texture;
    toneEl.value = settings.tone;
    refreshExcludeButton(settings);
  });
}

enabledEl.addEventListener("change", () => {
  save({ enabled: enabledEl.checked });
});

intensityEl.addEventListener("input", () => {
  save({ intensity: parseFloat(intensityEl.value) });
});

textureEl.addEventListener("change", () => {
  save({ texture: textureEl.value });
});

toneEl.addEventListener("change", () => {
  save({ tone: toneEl.value });
});

excludeBtn.addEventListener("click", () => {
  if (!currentHostname) return;
  chrome.storage.sync.get(DEFAULTS, (settings) => {
    const list = new Set(settings.excludedSites || []);
    if (list.has(currentHostname)) {
      list.delete(currentHostname);
    } else {
      list.add(currentHostname);
    }
    const excludedSites = Array.from(list);
    save({ excludedSites });
    refreshExcludeButton({ ...settings, excludedSites });
  });
});

init();
