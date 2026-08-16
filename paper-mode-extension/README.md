# Paper Mode — Chrome Extension

Overlays a rough, procedurally-generated paper-grain texture across every webpage
you visit — like your phone's e-reader "paper mode," but in the browser. No
external images are used; the grain is generated live with SVG noise, so it's
lightweight and works instantly on any page.

## Install (load unpacked)

1. Unzip this folder somewhere permanent (don't delete it after installing —
   Chrome loads the extension directly from these files).
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this `paper-mode-extension` folder.
5. Click the extension icon in your toolbar to open the controls.

## Controls

- **Enabled** — turn the paper effect on/off globally.
- **Texture intensity** — how strong/visible the grain overlay is.
- **Grain roughness** — how fine or coarse the paper fibers look.
- **Paper tone** — cream, bright white, kraft/brown, or newsprint gray.
- **Disable on this site** — exclude the current site (e.g. if it clashes with
  a dark-themed page) without turning the extension off everywhere.

Settings sync via `chrome.storage.sync`, so they carry across all your open tabs
and (if you're signed into Chrome) across devices.

## Notes

- The texture is a fixed, full-viewport layer blended with `mix-blend-mode:
  multiply`, so it darkens/grains the page underneath rather than just
  washing color over it — this is what gives the "reading off real paper" feel
  rather than a flat grayscale filter.
- It won't affect page functionality — the overlay has `pointer-events: none`,
  so clicks and scrolling pass straight through.
- If a page still looks off after adjusting settings, try refreshing the tab.
