const assert = require("assert");
const a = require("./actions.js");

assert.strictEqual(a.normalizeTicket("1550"), "MI-1550");
assert.strictEqual(a.normalizeTicket("mi-1550"), "MI-1550");
assert.strictEqual(a.normalizeTicket("MOD-12"), "MOD-12");
assert.strictEqual(a.normalizeTicket("nope"), null);
assert.strictEqual(a.normalizeTicket(""), null);

assert.strictEqual(a.normalizePrNumber("#1893"), "1893");
assert.strictEqual(a.normalizePrNumber("1893"), "1893");
assert.strictEqual(a.normalizePrNumber("18a"), null);

assert.strictEqual(a.jiraUrl("MI-1550"), "https://360training.atlassian.net/browse/MI-1550");
assert.strictEqual(a.prUrl("1893"), "https://github.com/lambda-curry/360training/pull/1893");
assert.strictEqual(
  a.prSearchQuery("MI-1550"),
  'repo:lambda-curry/360training is:pr "MI-1550" in:title',
);

assert.deepStrictEqual(a.currybotDecision(["bug"]), {
  type: "label",
  label: "currybot-review",
});
assert.deepStrictEqual(a.currybotDecision(["currybot-review"]), {
  type: "comment",
  body: "@currybot-lc re-review please",
});
assert.deepStrictEqual(a.currybotDecision([{ name: "currybot-review" }]), {
  type: "comment",
  body: "@currybot-lc re-review please",
});

assert.deepStrictEqual(
  a.contextFromUrl("https://github.com/lambda-curry/360training/pull/1893/files"),
  { ticket: null, pr: "1893" },
);
assert.deepStrictEqual(
  a.contextFromUrl("https://360training.atlassian.net/browse/MI-1550"),
  { ticket: "MI-1550", pr: null },
);
assert.deepStrictEqual(a.contextFromUrl("https://example.com"), { ticket: null, pr: null });

console.log("ok");
