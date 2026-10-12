/**
 * The card ChatGPT shows under a Chic tool call: before/after slider, a
 * rendering state that polls `get_room`, a product strip and a link to the
 * room on usechic.com.
 *
 * One self-contained HTML document with no build step. It reads the tool
 * result two ways: `window.openai.toolOutput` (ChatGPT's bridge) and the
 * MCP Apps `ui/notifications/tool-result` message (every MCP Apps host).
 * Everything from the tool result is written with `textContent` or checked
 * as an http(s) URL before use; nothing goes through innerHTML.
 */

/** Bump when the markup changes: hosts cache templates by URI. */
export const WIDGET_URI = "ui://widget/chic-room-v2.html";

/** The MCP Apps UI mime type ChatGPT and other hosts render. */
export const WIDGET_MIME_TYPE = "text/html;profile=mcp-app";

const STYLE = `
:root {
  --ink: #161617;
  --bone: #faf8f4;
  --brass: #b08d57;
  --brass-ink: #8a6a3b;
  --line: rgba(22, 22, 23, 0.1);
  --muted: rgba(22, 22, 23, 0.6);
  --card: #ffffff;
  --bg: var(--bone);
  --fg: var(--ink);
  color-scheme: light;
}
:root[data-theme="dark"] {
  --line: rgba(250, 248, 244, 0.14);
  --muted: rgba(250, 248, 244, 0.62);
  --card: #212123;
  --bg: var(--ink);
  --fg: var(--bone);
  --brass-ink: #c9a46c;
  color-scheme: dark;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--fg);
  font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.wrap { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
h1 {
  margin: 0;
  font-family: "Cormorant Garamond", "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-weight: 500;
  font-size: 24px;
  line-height: 1.15;
  letter-spacing: -0.01em;
}
.brand { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--brass-ink); white-space: nowrap; }
.request { margin: 2px 0 0; color: var(--muted); font-size: 13px; }
.stage {
  position: relative;
  aspect-ratio: 4 / 3;
  width: 100%;
  max-height: 440px;
  overflow: hidden;
  border-radius: 16px;
  background: #e9e4dc;
  user-select: none;
  touch-action: pan-y;
}
:root[data-theme="dark"] .stage { background: #2a2a2c; }
.stage img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.after { clip-path: inset(0 0 0 var(--split, 50%)); }
.divider {
  position: absolute; top: 0; bottom: 0; left: var(--split, 50%);
  width: 2px; margin-left: -1px; background: var(--bone);
  box-shadow: 0 0 0 1px rgba(22, 22, 23, 0.15);
  pointer-events: none;
}
.knob {
  position: absolute; top: 50%; left: 50%; width: 34px; height: 34px;
  margin: -17px 0 0 -17px; border-radius: 50%;
  background: var(--bone); color: var(--ink);
  display: grid; place-items: center; font-size: 13px; font-weight: 600;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}
.tag {
  position: absolute; top: 10px; padding: 3px 8px; border-radius: 999px;
  background: rgba(22, 22, 23, 0.62); color: var(--bone);
  font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
  pointer-events: none;
}
.tag.before { left: 10px; }
.tag.after-tag { right: 10px; }
.slider {
  position: absolute; inset: 0; width: 100%; height: 100%;
  margin: 0; opacity: 0; cursor: ew-resize;
}
.slider:focus-visible + .divider .knob { outline: 2px solid var(--brass); outline-offset: 2px; }
.veil {
  position: absolute; inset: 0; display: none;
  align-items: flex-end; justify-content: flex-start; padding: 14px;
  background: linear-gradient(180deg, rgba(22,22,23,0) 40%, rgba(22,22,23,0.66));
  color: var(--bone);
}
.veil.on { display: flex; }
.veil::before {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(100deg, transparent 20%, rgba(250,248,244,0.22) 50%, transparent 80%);
  background-size: 220% 100%;
  animation: sheen 1.6s ease-in-out infinite;
}
@keyframes sheen { from { background-position: 120% 0; } to { background-position: -120% 0; } }
@media (prefers-reduced-motion: reduce) { .veil::before { animation: none; } }
.veil strong { position: relative; font-family: "Cormorant Garamond", Georgia, serif; font-size: 22px; font-weight: 500; }
.veil span { position: relative; display: block; font-size: 12px; opacity: 0.85; }
.note { margin: 0; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); color: var(--muted); font-size: 13px; }
.note[hidden] { display: none; }
.section-title { margin: 0; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
.strip { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; scroll-snap-type: x mandatory; }
.strip:empty { display: none; }
.product {
  flex: 0 0 148px; width: 148px; min-width: 0; scroll-snap-align: start;
  display: flex; flex-direction: column; gap: 6px; padding: 8px;
  border: 1px solid var(--line); border-radius: 14px; background: var(--card);
  color: inherit; text-decoration: none; text-align: left; font: inherit; cursor: pointer;
}
.product:hover { border-color: var(--brass); }
.product:focus-visible { outline: 2px solid var(--brass); outline-offset: 2px; }
.product .thumb { display: block; width: 100%; max-width: 100%; height: auto; aspect-ratio: 1; border-radius: 10px; background: #fff; object-fit: contain; }
.product .name {
  font-size: 12.5px; line-height: 1.3; min-height: 2.6em;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.product .meta { display: flex; justify-content: space-between; gap: 6px; font-size: 12px; }
.product .price { font-weight: 600; }
.product .retailer { color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; min-height: 44px; padding: 0 18px; border: 0; border-radius: 999px;
  background: var(--brass); color: #fff; font-family: inherit; font-size: 15px; font-weight: 600; letter-spacing: 0.01em;
  cursor: pointer; text-decoration: none;
}
.cta:hover { background: #9c7a48; }
.cta:focus-visible { outline: 2px solid var(--fg); outline-offset: 2px; }
.disclosure { margin: -6px 0 0; font-size: 11.5px; color: var(--muted); }
.disclosure[hidden] { display: none; }
.empty { padding: 28px 16px; text-align: center; color: var(--muted); }
`;

const SCRIPT = `
(function () {
  "use strict";
  var root = document.documentElement;
  var els = {
    app: document.getElementById("app"),
    empty: document.getElementById("empty"),
    title: document.getElementById("title"),
    request: document.getElementById("request"),
    stage: document.getElementById("stage"),
    before: document.getElementById("before"),
    after: document.getElementById("after"),
    slider: document.getElementById("slider"),
    divider: document.getElementById("divider"),
    veil: document.getElementById("veil"),
    veilText: document.getElementById("veil-text"),
    note: document.getElementById("note"),
    shopTitle: document.getElementById("shop-title"),
    disclosure: document.getElementById("disclosure"),
    strip: document.getElementById("strip"),
    cta: document.getElementById("cta")
  };
  var STAGES = {
    planning: "Reading your request",
    searching: "Finding real products",
    rendering: "Rendering the new photo",
    detecting: "Spotting the furniture"
  };
  var POLL_MS = 4000;
  var POLL_LIMIT = 45;
  var SHOP_POLL_LIMIT = 4;
  var state = { data: null, polls: 0, shopPolls: 0, timer: null };
  var nextId = 1;
  var pending = {};

  function safeUrl(value) {
    if (typeof value !== "string") return null;
    try {
      var url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch (e) {
      return null;
    }
  }

  function rpc(method, params) {
    var id = nextId++;
    window.parent.postMessage({ jsonrpc: "2.0", id: id, method: method, params: params }, "*");
    return new Promise(function (resolve, reject) {
      pending[id] = { resolve: resolve, reject: reject };
    });
  }

  function notify(method, params) {
    window.parent.postMessage({ jsonrpc: "2.0", method: method, params: params }, "*");
  }

  function openLink(href) {
    var url = safeUrl(href);
    if (!url) return;
    var openai = window.openai;
    if (openai && typeof openai.openExternal === "function") {
      openai.openExternal({ href: url, redirectUrl: false });
      return;
    }
    rpc("ui/open-link", { url: url }).catch(function () {
      window.open(url, "_blank", "noopener");
    });
  }

  function callTool(name, args) {
    var openai = window.openai;
    if (openai && typeof openai.callTool === "function") {
      return openai.callTool(name, args);
    }
    return rpc("tools/call", { name: name, arguments: args });
  }

  function money(value) {
    if (typeof value !== "number" || !isFinite(value)) return "";
    try {
      return new Intl.NumberFormat(root.lang || "en-US", { style: "currency", currency: "USD" }).format(value);
    } catch (e) {
      return "$" + value.toFixed(2);
    }
  }

  function setSplit(percent) {
    els.stage.style.setProperty("--split", percent + "%");
    els.after.style.setProperty("--split", percent + "%");
    els.divider.style.setProperty("--split", percent + "%");
  }

  function productCard(product) {
    var href = safeUrl(product.url);
    if (!href) return null;
    var card = document.createElement("button");
    card.type = "button";
    card.className = "product";
    card.addEventListener("click", function () { openLink(href); });
    var image = safeUrl(product.imageUrl);
    if (image) {
      var img = document.createElement("img");
      img.className = "thumb";
      img.alt = "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.src = image;
      img.addEventListener("error", function () { img.style.visibility = "hidden"; });
      card.appendChild(img);
    }
    var name = document.createElement("span");
    name.className = "name";
    name.textContent = String(product.name || "");
    card.appendChild(name);
    var meta = document.createElement("span");
    meta.className = "meta";
    var price = document.createElement("span");
    price.className = "price";
    price.textContent = money(product.price);
    var retailer = document.createElement("span");
    retailer.className = "retailer";
    retailer.textContent = String(product.retailer || "");
    meta.appendChild(price);
    meta.appendChild(retailer);
    card.appendChild(meta);
    card.setAttribute("aria-label", String(product.name || "Product") + ", " + price.textContent + (product.retailer ? " at " + product.retailer : ""));
    return card;
  }

  function reportHeight() {
    var height = Math.ceil(document.body.scrollHeight);
    var openai = window.openai;
    if (openai && typeof openai.notifyIntrinsicHeight === "function") {
      openai.notifyIntrinsicHeight(height);
    }
    notify("ui/notifications/size-changed", { width: Math.ceil(document.body.scrollWidth), height: height });
  }

  function render(data) {
    if (!data || typeof data !== "object" || !data.roomId) return;
    state.data = data;
    els.empty.hidden = true;
    els.app.hidden = false;

    els.title.textContent = data.title || "Your room";
    els.request.textContent = data.request ? "\\u201C" + data.request + "\\u201D" : "";
    els.request.hidden = !data.request;

    var before = safeUrl(data.beforeUrl);
    var after = safeUrl(data.afterUrl);
    var rendering = data.status === "rendering";
    var changed = after && before && after !== before;

    // While a change renders, the photo being changed sits under the veil;
    // once it lands, the original and the latest version share the slider.
    var showSlider = Boolean(changed && !rendering);
    var base = showSlider ? before : after || before;
    if (base && els.before.getAttribute("src") !== base) els.before.src = base;
    if (after && els.after.getAttribute("src") !== after) els.after.src = after;
    els.after.hidden = !showSlider;
    els.divider.hidden = !showSlider;
    els.slider.hidden = !showSlider;
    document.getElementById("tag-before").hidden = !showSlider;
    document.getElementById("tag-after").hidden = !showSlider;

    els.veil.classList.toggle("on", rendering);
    els.veilText.textContent = STAGES[data.stage] || "This usually takes under a minute";

    var message = "";
    if (data.status === "failed") {
      message = data.message || "That change did not work. Try describing it differently.";
    }
    els.note.textContent = message;
    els.note.hidden = !message;

    els.strip.textContent = "";
    var products = Array.isArray(data.products) ? data.products : [];
    for (var i = 0; i < products.length; i++) {
      var card = productCard(products[i] || {});
      if (card) els.strip.appendChild(card);
    }
    els.shopTitle.hidden = els.strip.childElementCount === 0;
    els.disclosure.hidden = els.shopTitle.hidden;

    var roomUrl = safeUrl(data.roomUrl);
    els.cta.hidden = !roomUrl;
    els.cta.dataset.href = roomUrl || "";

    schedulePoll();
    requestAnimationFrame(reportHeight);
  }

  /** Rendering, or rendered with furniture whose products are still being found. */
  function waitingFor(data) {
    if (!data) return false;
    if (data.status === "rendering") return state.polls < POLL_LIMIT;
    var empty = !Array.isArray(data.products) || data.products.length === 0;
    var hasItems = Array.isArray(data.items) && data.items.length > 0;
    return data.status === "ready" && empty && hasItems && state.shopPolls < SHOP_POLL_LIMIT;
  }

  function schedulePoll() {
    clearTimeout(state.timer);
    if (!waitingFor(state.data)) return;
    if (state.data.status !== "rendering") state.shopPolls += 1;
    state.timer = setTimeout(function () {
      state.polls += 1;
      callTool("get_room", { roomId: state.data.roomId })
        .then(function (result) {
          var next = result && (result.structuredContent || (result.result && result.result.structuredContent));
          if (next && next.roomId) {
            if (!next.request && state.data) next.request = state.data.request;
            render(next);
          } else {
            schedulePoll();
          }
        })
        .catch(schedulePoll);
    }, POLL_MS);
  }

  function applyTheme(theme) {
    root.dataset.theme = theme === "dark" ? "dark" : "light";
  }

  function readGlobals() {
    var openai = window.openai;
    if (!openai) return;
    if (openai.theme) applyTheme(openai.theme);
    if (openai.toolOutput) render(openai.toolOutput);
  }

  els.slider.addEventListener("input", function () { setSplit(els.slider.value); });
  els.cta.addEventListener("click", function () { openLink(els.cta.dataset.href); });

  window.addEventListener("openai:set_globals", function (event) {
    var globals = event && event.detail && event.detail.globals;
    if (!globals) return;
    if (globals.theme) applyTheme(globals.theme);
    if (globals.toolOutput) render(globals.toolOutput);
  }, { passive: true });

  window.addEventListener("message", function (event) {
    if (event.source !== window.parent) return;
    var message = event.data;
    if (!message || message.jsonrpc !== "2.0") return;
    if (message.id !== undefined && pending[message.id]) {
      var waiter = pending[message.id];
      delete pending[message.id];
      if (message.error) waiter.reject(message.error); else waiter.resolve(message.result);
      return;
    }
    if (message.method === "ui/notifications/tool-result") {
      render(message.params && message.params.structuredContent);
    } else if (message.method === "ui/notifications/host-context-changed") {
      if (message.params && message.params.theme) applyTheme(message.params.theme);
    }
  }, { passive: true });

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) applyTheme("dark");
  setSplit(50);
  readGlobals();

  rpc("ui/initialize", {
    appInfo: { name: "chic-room", version: "1.0.0" },
    appCapabilities: { availableDisplayModes: ["inline"] },
    protocolVersion: "2026-01-26"
  }).then(function (result) {
    var context = result && result.hostContext;
    if (context && context.theme) applyTheme(context.theme);
    notify("ui/notifications/initialized", {});
  }).catch(function () {});

  if (typeof ResizeObserver === "function") {
    new ResizeObserver(reportHeight).observe(document.body);
  }
})();
`;

const BODY = `
<div id="empty" class="empty">Loading your room…</div>
<main id="app" class="wrap" hidden>
  <header>
    <div>
      <h1 id="title">Your room</h1>
      <p id="request" class="request" hidden></p>
    </div>
    <span class="brand">Chic</span>
  </header>
  <div id="stage" class="stage">
    <img id="before" alt="Room before the change" />
    <img id="after" class="after" alt="Room after the change" hidden />
    <input id="slider" class="slider" type="range" min="0" max="100" value="50" aria-label="Compare before and after" hidden />
    <div id="divider" class="divider" hidden><div class="knob" aria-hidden="true">&#8596;</div></div>
    <span id="tag-before" class="tag before" hidden>Before</span>
    <span id="tag-after" class="tag after-tag" hidden>After</span>
    <div id="veil" class="veil" role="status" aria-live="polite">
      <div><strong>Rendering…</strong><span id="veil-text">This usually takes under a minute</span></div>
    </div>
  </div>
  <p id="note" class="note" role="alert" hidden></p>
  <button id="cta" class="cta" type="button" hidden>Open in Chic</button>
  <h2 id="shop-title" class="section-title" hidden>Shop the look</h2>
  <div id="strip" class="strip"></div>
  <p id="disclosure" class="disclosure" hidden>Chic may earn a commission from purchases made through these links. Prices and availability are set by each retailer.</p>
</main>
`;

export const WIDGET_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Chic room</title>
<style>${STYLE}</style>
</head>
<body>
${BODY}
<script>${SCRIPT}</script>
</body>
</html>`;
