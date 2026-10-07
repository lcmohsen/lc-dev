if (!globalThis.__lcDevPalette) {
  globalThis.__lcDevPalette = true;

  const { lcActions } = globalThis;
  const host = document.createElement("div");
  host.style.display = "none";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .panel {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 2147483647;
        width: 320px;
        background: #fff;
        color: #1a1a1a;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        font: 13px/1.4 system-ui, sans-serif;
      }
      header, form, #msg, ul { margin: 0; }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 10px 0;
      }
      strong { font-size: 14px; }
      button {
        font: inherit;
        cursor: pointer;
      }
      button.link {
        background: none;
        border: 0;
        color: #0b57d0;
        padding: 0;
      }
      ul { list-style: none; padding: 6px 0; }
      ul.actions button, ul.results button {
        width: 100%;
        text-align: left;
        border: 0;
        background: transparent;
        padding: 8px 10px;
      }
      ul.actions button:hover, ul.actions button[aria-pressed="true"] { background: #f2f2f2; }
      form { display: none; padding: 0 10px 10px; }
      form.open { display: block; }
      label { display: block; margin-bottom: 4px; }
      input { width: 100%; box-sizing: border-box; padding: 6px 8px; font: inherit; }
      .row { margin-top: 8px; }
      #msg { padding: 0 10px 10px; }
      #msg.error { color: #9a3412; }
      ul.results { padding: 0 10px 10px; }
    </style>
    <div class="panel">
      <header>
        <strong>LC Dev</strong>
        <button class="link" id="close" type="button">Close</button>
      </header>
      <ul class="actions" id="actions"></ul>
      <form id="form">
        <label id="hint" for="lc-input"></label>
        <input id="lc-input" autocomplete="off" />
        <div class="row"><button type="submit">Go</button></div>
      </form>
      <p id="msg" hidden></p>
      <ul class="results" id="results"></ul>
    </div>
  `;
  document.documentElement.append(host);

  const actionsEl = shadow.querySelector("#actions");
  const form = shadow.querySelector("#form");
  const hint = shadow.querySelector("#hint");
  const input = shadow.querySelector("#lc-input");
  const msg = shadow.querySelector("#msg");
  const results = shadow.querySelector("#results");
  let current = null;

  for (const action of lcActions.ACTIONS) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.addEventListener("click", () => select(action, button));
    li.append(button);
    actionsEl.append(li);
  }

  shadow.querySelector("#close").addEventListener("click", close);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (current) run(current.id, input.value);
  });
  host.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (isTyping(event)) return;
      if (!isShortcut(event)) return;
      event.preventDefault();
      event.stopPropagation();
      if (host.style.display === "none") open();
      else close();
    },
    true,
  );

  function open() {
    host.style.display = "block";
    current = null;
    form.classList.remove("open");
    input.value = "";
    show("", false);
    results.replaceChildren();
    for (const el of actionsEl.querySelectorAll("button")) {
      el.setAttribute("aria-pressed", "false");
    }
  }

  function close() {
    host.style.display = "none";
  }

  function select(action, button) {
    current = action;
    const page = lcActions.contextFromUrl(location.href);
    for (const el of actionsEl.querySelectorAll("button")) {
      el.setAttribute("aria-pressed", el === button ? "true" : "false");
    }
    form.classList.add("open");
    hint.textContent = action.hint;
    input.value = action.field === "ticket" ? page.ticket || "" : page.pr || "";
    input.focus();
    input.select();
    show("", false);
    results.replaceChildren();
  }

  async function run(type, value) {
    show("", false);
    results.replaceChildren();
    const response = await chrome.runtime.sendMessage({ type, input: value });
    if (!response) {
      show("No response from the extension", true);
      return;
    }
    if (response.error) {
      show(response.error, true);
      return;
    }
    if (response.message) show(response.message, false);
    const picked = response.results || [];
    if (picked.length) host.style.display = "block";
    else if (response.opened || (response.ok && !response.message)) close();
    for (const item of response.results || []) {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `#${item.number} ${item.title} (${item.state})`;
      button.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "open", url: item.url });
        close();
      });
      li.append(button);
      results.append(li);
    }
  }

  function show(text, isError) {
    msg.hidden = !text;
    msg.textContent = text;
    msg.classList.toggle("error", Boolean(isError));
  }
}

function isShortcut(event) {
  return (
    event.ctrlKey &&
    event.shiftKey &&
    !event.altKey &&
    !event.metaKey &&
    event.key === "." &&
    !event.repeat
  );
}

function isTyping(event) {
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];
  for (const node of path) {
    if (node instanceof Element && editable(node)) return true;
  }
  return editable(document.activeElement);
}

function editable(el) {
  if (!el || el === document.body || el === document.documentElement) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  const role = el.getAttribute?.("role");
  return role === "textbox" || role === "searchbox";
}
