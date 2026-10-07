const { lcActions } = globalThis;
const actionsEl = document.querySelector("#actions");
const form = document.querySelector("#form");
const hint = document.querySelector("#hint");
const input = document.querySelector("#input");
const msg = document.querySelector("#msg");
const results = document.querySelector("#results");

let current = null;
let page = { ticket: null, pr: null };

document.querySelector("#options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

for (const action of lcActions.ACTIONS) {
  const li = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = action.label;
  button.addEventListener("click", () => select(action, button));
  li.append(button);
  actionsEl.append(li);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!current) return;
  run(current.id, input.value);
});

chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  page = lcActions.contextFromUrl(tab?.url);
});

function select(action, button) {
  current = action;
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
  for (const item of response.results || []) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `#${item.number} ${item.title} (${item.state})`;
    button.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "open", url: item.url });
    });
    li.append(button);
    results.append(li);
  }
}

function show(text, isError) {
  msg.hidden = !text;
  msg.textContent = text;
  msg.classList.toggle("error", isError);
}
