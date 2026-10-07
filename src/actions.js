const REPO = "lambda-curry/360training";
const JIRA_BROWSE = "https://360training.atlassian.net/browse/";
const DEFAULT_PROJECT = "MI";
const CURRYBOT_LABEL = "currybot-review";
const REREVIEW_COMMENT = "@currybot-lc re-review please";

const ACTIONS = [
  { id: "jira", label: "Jira ticket", field: "ticket", hint: "1550 or MI-1550" },
  { id: "pr-ticket", label: "PR by ticket", field: "ticket", hint: "1550 or MI-1550" },
  { id: "pr-number", label: "PR by number", field: "pr", hint: "1893" },
  { id: "currybot", label: "Currybot review", field: "pr", hint: "1893" },
];

function normalizeTicket(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return `${DEFAULT_PROJECT}-${raw}`;
  const key = raw.toUpperCase();
  if (!/^[A-Z][A-Z0-9]+-\d+$/.test(key)) return null;
  return key;
}

function normalizePrNumber(input) {
  const raw = String(input ?? "").trim().replace(/^#/, "");
  if (!/^\d+$/.test(raw)) return null;
  return raw;
}

function jiraUrl(ticket) {
  return JIRA_BROWSE + ticket;
}

function prUrl(number) {
  return `https://github.com/${REPO}/pull/${number}`;
}

function prSearchQuery(ticket) {
  return `repo:${REPO} is:pr "${ticket}" in:title`;
}

function labelName(label) {
  return typeof label === "string" ? label : label.name;
}

function currybotDecision(labels) {
  const has = labels.some((label) => labelName(label) === CURRYBOT_LABEL);
  if (has) return { type: "comment", body: REREVIEW_COMMENT };
  return { type: "label", label: CURRYBOT_LABEL };
}

function contextFromUrl(url) {
  const out = { ticket: null, pr: null };
  if (!url) return out;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return out;
  }
  if (parsed.hostname === "360training.atlassian.net") {
    const match = parsed.pathname.match(/\/browse\/([A-Za-z][A-Za-z0-9]+-\d+)/);
    if (match) out.ticket = match[1].toUpperCase();
  }
  if (parsed.hostname === "github.com") {
    const match = parsed.pathname.match(/\/lambda-curry\/360training\/pull\/(\d+)/);
    if (match) out.pr = match[1];
  }
  return out;
}

const api = {
  REPO,
  CURRYBOT_LABEL,
  REREVIEW_COMMENT,
  ACTIONS,
  normalizeTicket,
  normalizePrNumber,
  jiraUrl,
  prUrl,
  prSearchQuery,
  currybotDecision,
  contextFromUrl,
};

if (typeof module !== "undefined" && module.exports) module.exports = api;
else globalThis.lcActions = api;
