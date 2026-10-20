import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";
import { buildConsentGate, validateConfig } from "../bin/build-consent-gate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLE = JSON.parse(fs.readFileSync(path.join(ROOT, "examples/consent.config.json"), "utf8"));

/** Loads a page with the built script. Returns the window and a reload counter. */
async function page({ config = EXAMPLE, url = "https://www.acme.example/", html = "<!doctype html><html><head></head><body><main>Hi</main></body></html>", storage = null, script = null } = {}) {
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(html, { url, runScripts: "outside-only", virtualConsole });
  const { window } = dom;
  const state = { reloads: 0 };
  // jsdom cannot navigate; count reload calls instead.
  virtualConsole.on("jsdomError", (e) => {
    if (/navigation/i.test(e.message)) state.reloads++;
    else throw e;
  });
  if (storage) window.localStorage.setItem(config.storageKey, JSON.stringify(storage));
  window.eval(script ?? buildConsentGate(config));
  if (window.document.readyState === "loading") {
    await new Promise((resolve) => window.document.addEventListener("DOMContentLoaded", resolve));
  }
  return { window, document: window.document, state };
}

const trackers = (doc) => [...doc.querySelectorAll("script[src]")].map((s) => s.src).filter((s) => /googletagmanager|clarity\.ms/.test(s));
const click = (el) => el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true }));

test("before any choice: banner shown, no tracker scripts", async () => {
  const { document } = await page();
  assert.ok(document.getElementById("acme-analytics-consent"));
  assert.deepEqual(trackers(document), []);
});

test("off the production hosts the script does nothing", async () => {
  const { document } = await page({ url: "http://localhost:5173/" });
  assert.equal(document.getElementById("acme-analytics-consent"), null);
  assert.equal(document.querySelector("footer"), null);
});

test("decline: no trackers, choice stored, banner gone", async () => {
  const { window, document } = await page();
  click(document.querySelector('[data-consent="denied"]'));
  assert.equal(document.getElementById("acme-analytics-consent"), null);
  assert.deepEqual(trackers(document), []);
  assert.equal(JSON.parse(window.localStorage.getItem("acme_consent_v1")).value, "denied");
});

test("a stored refusal is respected on the next page load", async () => {
  const { document } = await page({ storage: { value: "denied", decidedAt: Date.now() } });
  assert.equal(document.getElementById("acme-analytics-consent"), null);
  assert.deepEqual(trackers(document), []);
});

test("a choice older than about 13 months asks again", async () => {
  const { document } = await page({ storage: { value: "denied", decidedAt: Date.now() - 400 * 24 * 3600 * 1000 } });
  assert.ok(document.getElementById("acme-analytics-consent"));
});

test("accept: both configured tags load", async () => {
  const { document } = await page();
  click(document.querySelector('[data-consent="granted"]'));
  const srcs = trackers(document);
  assert.equal(srcs.length, 2);
  assert.ok(srcs.some((s) => s.includes("googletagmanager.com/gtag/js?id=G-ABC1234567")));
  assert.ok(srcs.some((s) => s.includes("clarity.ms/tag/abc123xyz")));
});

test("GA-only config loads only GA and does not mention Clarity", async () => {
  const config = { ...EXAMPLE, clarityProjectId: "", maskingSentence: "" };
  const { document } = await page({ config });
  assert.doesNotMatch(document.getElementById("acme-analytics-consent").textContent, /Clarity/);
  click(document.querySelector('[data-consent="granted"]'));
  assert.deepEqual(trackers(document).map((s) => new URL(s).hostname), ["www.googletagmanager.com"]);
});

test("regression: a 'Privacy choices' link is installed when privacyUrl is /privacy", async () => {
  // 1.0.0 only looked for links ending in privacy.html, so with the documented "/privacy"
  // setting no withdrawal link ever appeared.
  const { document } = await page();
  assert.ok(document.querySelector("footer [data-acme-privacy-choices]"));
});

test("regression: an existing footer with any privacy link, or none, gets the choices link", async () => {
  const withLink = (await page({ html: '<body><footer><a href="/legal/privacy">Privacy</a></footer></body>' })).document;
  const link = withLink.querySelector("[data-acme-privacy-choices]");
  assert.ok(link);
  assert.equal(link.previousElementSibling.getAttribute("href"), "/legal/privacy");
  const noLink = (await page({ html: "<body><footer><a href='/about'>About</a></footer></body>" })).document;
  assert.ok(noLink.querySelector("footer [data-acme-privacy-choices]"));
});

test("regression: withdrawal clears GA cookies set on the parent domain, and reloads", async () => {
  // 1.0.0 only expired cookies on ".www.acme.example", missing GA's usual ".acme.example".
  const { window, document, state } = await page({ storage: { value: "granted", decidedAt: Date.now() } });
  document.cookie = "_ga=GA1.1.123; domain=.acme.example; path=/";
  document.cookie = "_ga_ABC=GS1; domain=.acme.example; path=/";
  assert.match(document.cookie, /_ga=/);
  click(document.querySelector("[data-acme-privacy-choices]"));
  click(document.querySelector('[data-consent="denied"]'));
  assert.doesNotMatch(document.cookie, /_ga/);
  assert.equal(state.reloads, 1);
  assert.equal(JSON.parse(window.localStorage.getItem("acme_consent_v1")).value, "denied");
});

test("regression: 'No thanks' and 'Allow analytics' are styled the same", async () => {
  // 1.0.0 gave only the Allow button a filled brand colour, contradicting "equal prominence".
  const { document } = await page();
  const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("");
  assert.doesNotMatch(css, /data-consent=/);
});

test("product name and masking text are shown as text, never parsed as HTML", async () => {
  const config = { ...EXAMPLE, productName: '<img src=x onerror="window.pwned=1">' };
  const out = buildConsentGate(config);
  assert.doesNotMatch(out, /<img/);
  const { window, document } = await page({ config, script: out });
  assert.equal(document.querySelector("#acme-analytics-consent img"), null);
  assert.equal(window.pwned, undefined);
});

test("config validation rejects unusable settings", async () => {
  assert.ok(validateConfig({ ...EXAMPLE, productionHosts: ["https://acme.example"] }).length);
  assert.ok(validateConfig({ ...EXAMPLE, productionHosts: ["localhost"] }).length);
  assert.ok(validateConfig({ ...EXAMPLE, ga4MeasurementId: "", clarityProjectId: "" }).length);
  assert.ok(validateConfig({ ...EXAMPLE, maskingSentence: "" }).some((e) => e.includes("maskingSentence")));
  assert.ok(validateConfig({ ...EXAMPLE, prefix: "Bad Prefix" }).length);
  assert.deepEqual(validateConfig(EXAMPLE), []);
});

test("the built file has no unreplaced placeholders and parses", async () => {
  const out = buildConsentGate(EXAMPLE);
  assert.doesNotMatch(out, /__[A-Z_]+__/);
  assert.doesNotThrow(() => new Function(out));
});
