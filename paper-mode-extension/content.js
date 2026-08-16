// Paper Mode — content script
// Injects a fixed, full-viewport SVG-noise texture layer blended with
// mix-blend-mode: multiply so the page underneath looks printed on rough paper.

(function () {
  const OVERLAY_ID = "__paper_mode_overlay__";
  const STYLE_ID = "__paper_mode_style__";

  const TONES = {
    cream: { r: 214, g: 196, b: 158 },
    white: { r: 246, g: 243, b: 234 },
    kraft: { r: 181, g: 141, b: 92 },
    gray: { r: 176, g: 176, b: 176 }
  };

  const DEFAULTS = {
    enabled: true,
    intensity: 0.28,      // 0 - 0.5, opacity of the texture layer
    texture: "fine_matte", // which texture style (see TEXTURE_BUILDERS)
    tone: "cream",
    excludedSites: []
  };

  function toHex(c) {
    const h = (v) => v.toString(16).padStart(2, "0");
    return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
  }

  function grayscale(inName, out) {
    return `<feColorMatrix in='${inName}' type='matrix' values='0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0' result='${out}'/>`;
  }

  function contrast(slope, intercept, inName, out) {
    return (
      `<feComponentTransfer in='${inName}' result='${out}'>` +
      `<feFuncR type='linear' slope='${slope}' intercept='${intercept}'/>` +
      `<feFuncG type='linear' slope='${slope}' intercept='${intercept}'/>` +
      `<feFuncB type='linear' slope='${slope}' intercept='${intercept}'/>` +
      `</feComponentTransfer>`
    );
  }

  function tintMultiply(inName, hex, out) {
    return (
      `<feFlood flood-color='${hex}' result='tf'/>` +
      `<feBlend in='${inName}' in2='tf' mode='multiply' result='${out}'/>`
    );
  }

  function wrapSvg(inner, extraDefs) {
    return (
      "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'>" +
      (extraDefs || "") +
      "<filter id='p' x='-20%' y='-20%' width='140%' height='140%' color-interpolation-filters='sRGB'>" +
      inner +
      "</filter>" +
      "<rect width='100%' height='100%' filter='url(#p)'/>" +
      "</svg>"
    );
  }

  // Each builder takes the tint hex and returns full SVG markup for that texture style.
  const TEXTURE_BUILDERS = {
    laid_fiber: (hex) =>
      wrapSvg(
        "<feTurbulence type='fractalNoise' baseFrequency='0.004 0.3' numOctaves='3' seed='5' stitchTiles='stitch' result='raw'/>" +
          grayscale("raw", "base") +
          contrast(2.4, -0.65, "base", "c") +
          tintMultiply("c", hex, "tinted")
      ),
    coldpress: (hex) =>
      wrapSvg(
        "<feTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='2' seed='9' stitchTiles='stitch' result='raw'/>" +
          grayscale("raw", "base") +
          contrast(1.3, -0.15, "base", "c") +
          tintMultiply("c", hex, "tinted")
      ),
    recycled_fleck: (hex) =>
      wrapSvg(
        "<feTurbulence type='turbulence' baseFrequency='0.85' numOctaves='1' seed='21' stitchTiles='stitch' result='raw'/>" +
          grayscale("raw", "base") +
          "<feComponentTransfer in='base' result='c'>" +
          "<feFuncR type='gamma' amplitude='1' exponent='7' offset='0'/>" +
          "<feFuncG type='gamma' amplitude='1' exponent='7' offset='0'/>" +
          "<feFuncB type='gamma' amplitude='1' exponent='7' offset='0'/>" +
          "</feComponentTransfer>" +
          tintMultiply("c", hex, "tinted")
      ),
    linen_weave: (hex) =>
      `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'>` +
      `<defs><pattern id='weave' width='6' height='6' patternUnits='userSpaceOnUse'>` +
      `<rect width='6' height='6' fill='${hex}'/>` +
      `<rect width='6' height='1.2' fill='rgba(70,60,45,0.35)'/>` +
      `<rect width='1.2' height='6' fill='rgba(70,60,45,0.35)'/>` +
      `</pattern></defs>` +
      `<rect width='100%' height='100%' fill='url(#weave)'/>` +
      `</svg>`,
    fine_matte: (hex) =>
      wrapSvg(
        "<feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' seed='3' stitchTiles='stitch' result='raw'/>" +
          grayscale("raw", "base") +
          contrast(0.35, 0.33, "base", "c") +
          tintMultiply("c", hex, "tinted")
      ),
    cotton_flecks: (hex) =>
      wrapSvg(
        "<feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' seed='3' stitchTiles='stitch' result='fineRaw'/>" +
          grayscale("fineRaw", "fineBase") +
          contrast(0.4, 0.32, "fineBase", "fineC") +
          "<feTurbulence type='turbulence' baseFrequency='0.85' numOctaves='1' seed='31' stitchTiles='stitch' result='fleckRaw'/>" +
          grayscale("fleckRaw", "fleckBase") +
          "<feComponentTransfer in='fleckBase' result='fleckGamma'>" +
          "<feFuncR type='gamma' amplitude='1' exponent='9' offset='0'/>" +
          "<feFuncG type='gamma' amplitude='1' exponent='9' offset='0'/>" +
          "<feFuncB type='gamma' amplitude='1' exponent='9' offset='0'/>" +
          "</feComponentTransfer>" +
          contrast(0.45, 0.55, "fleckGamma", "fleckC") +
          "<feBlend in='fineC' in2='fleckC' mode='multiply' result='c'/>" +
          tintMultiply("c", hex, "tinted")
      ),
    kraft_soft_fiber: (hex) =>
      wrapSvg(
        "<feTurbulence type='fractalNoise' baseFrequency='0.02 0.18' numOctaves='3' seed='15' stitchTiles='stitch' result='raw'/>" +
          grayscale("raw", "base") +
          contrast(1.4, -0.18, "base", "c") +
          tintMultiply("c", hex, "tinted")
      )
  };

  function buildTextureDataUri(textureKey, tone) {
    const c = TONES[tone] || TONES.cream;
    const hex = toHex(c);
    const builder = TEXTURE_BUILDERS[textureKey] || TEXTURE_BUILDERS.fine_matte;
    const svg = builder(hex);
    return "data:image/svg+xml;base64," + btoa(svg);
  }

  function removeOverlay() {
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();
    const existingStyle = document.getElementById(STYLE_ID);
    if (existingStyle) existingStyle.remove();
  }

  function createOverlay(settings) {
    removeOverlay();

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${OVERLAY_ID} {
        position: fixed !important;
        top: 0 !important; left: 0 !important;
        width: 100vw !important; height: 100vh !important;
        pointer-events: none !important;
        z-index: 2147483647 !important;
        mix-blend-mode: multiply !important;
        background-repeat: repeat !important;
        background-size: 500px 500px !important;
      }
      #${OVERLAY_ID} .__paper_vignette__ {
        position: absolute; inset: 0;
        box-shadow: inset 0 0 140px rgba(80, 60, 30, 0.22);
        pointer-events: none;
      }
    `;
    document.documentElement.appendChild(style);

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.backgroundImage = `url("${buildTextureDataUri(settings.texture, settings.tone)}")`;
    overlay.style.opacity = String(settings.intensity);

    const vignette = document.createElement("div");
    vignette.className = "__paper_vignette__";
    overlay.appendChild(vignette);

    document.documentElement.appendChild(overlay);
  }

  function applySettings(settings) {
    const hostname = location.hostname;
    const excluded = (settings.excludedSites || []).includes(hostname);
    if (!settings.enabled || excluded) {
      removeOverlay();
      return;
    }
    createOverlay(settings);
  }

  function init() {
    chrome.storage.sync.get(DEFAULTS, (settings) => {
      applySettings(settings);
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    chrome.storage.sync.get(DEFAULTS, (settings) => {
      applySettings(settings);
    });
  });

  init();
})();
