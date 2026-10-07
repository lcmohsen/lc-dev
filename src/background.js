importScripts("actions.js");

const { lcActions } = globalThis;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handle(msg)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message || String(err) }));
  return true;
});

async function handle(msg) {
  if (msg.type === "open") {
    await chrome.tabs.create({ url: msg.url });
    return { ok: true };
  }
  if (msg.type === "jira") return openJira(msg.input);
  if (msg.type === "pr-number") return openPrNumber(msg.input);
  if (msg.type === "pr-ticket") return searchPrs(msg.input);
  if (msg.type === "currybot") return currybot(msg.input);
  throw new Error("Unknown action");
}

async function openJira(input) {
  const ticket = lcActions.normalizeTicket(input);
  if (!ticket) throw new Error("Enter a ticket like 1550 or MI-1550");
  await chrome.tabs.create({ url: lcActions.jiraUrl(ticket) });
  return { ok: true, ticket };
}

async function openPrNumber(input) {
  const number = lcActions.normalizePrNumber(input);
  if (!number) throw new Error("Enter a PR number");
  await chrome.tabs.create({ url: lcActions.prUrl(number) });
  return { ok: true, pr: number };
}

async function searchPrs(input) {
  const ticket = lcActions.normalizeTicket(input);
  if (!ticket) throw new Error("Enter a ticket like 1550 or MI-1550");
  const query = lcActions.prSearchQuery(ticket);
  const data = await github(
    `/search/issues?q=${encodeURIComponent(query)}&per_page=30`,
  );
  const results = (data.items || []).map((item) => ({
    number: item.number,
    title: item.title,
    url: item.html_url,
    state: item.state,
  }));
  if (results.length === 1) {
    await chrome.tabs.create({ url: results[0].url });
    return { ok: true, opened: results[0] };
  }
  if (results.length === 0) return { results, message: `No PR title contains ${ticket}` };
  const more = data.total_count > results.length;
  return {
    results,
    message: more ? `Showing ${results.length} of ${data.total_count}` : "",
  };
}

async function currybot(input) {
  const number = lcActions.normalizePrNumber(input);
  if (!number) throw new Error("Enter a PR number");
  const labels = await github(
    `/repos/${lcActions.REPO}/issues/${number}/labels`,
  );
  const decision = lcActions.currybotDecision(labels);
  if (decision.type === "comment") {
    await github(`/repos/${lcActions.REPO}/issues/${number}/comments`, {
      method: "POST",
      body: { body: decision.body },
    });
    return { ok: true, message: `Commented on #${number}` };
  }
  await github(`/repos/${lcActions.REPO}/issues/${number}/labels`, {
    method: "POST",
    body: { labels: [decision.label] },
  });
  return { ok: true, message: `Added ${decision.label} to #${number}` };
}

async function github(path, options = {}) {
  const { token } = await chrome.storage.local.get("token");
  if (!token) throw new Error("Add a GitHub token in extension options");
  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (response.status === 404) throw new Error("GitHub returned 404");
  if (!response.ok) {
    const text = await response.text();
    throw new Error(githubError(response.status, text));
  }
  if (response.status === 204) return null;
  return response.json();
}

function githubError(status, text) {
  try {
    const data = JSON.parse(text);
    if (data.message) return `GitHub ${status}: ${data.message}`;
  } catch {
    // body was not JSON
  }
  return `GitHub ${status}`;
}
