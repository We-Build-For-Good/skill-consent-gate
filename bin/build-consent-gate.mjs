#!/usr/bin/env node
/**
 * Builds consent-gate.js from the template and a JSON config.
 * Usage: node bin/build-consent-gate.mjs --config consent.config.json --out public/consent-gate.js
 * Exit codes: 0 written, 2 bad options or config.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TEMPLATE_PATH = path.resolve(__dirname, "../assets/consent-gate.template.js");

const HOST = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

/** Returns a list of problems; empty means the config is usable. */
export function validateConfig(c) {
  const errors = [];
  if (!c || typeof c !== "object") return ["Config must be a JSON object."];
  if (typeof c.prefix !== "string" || !/^[a-z][a-z0-9-]{0,30}$/.test(c.prefix)) errors.push('"prefix" must be lowercase letters, digits or hyphens, starting with a letter (e.g. "acme").');
  if (typeof c.productName !== "string" || !c.productName.trim()) errors.push('"productName" is required.');
  if (!Array.isArray(c.productionHosts) || c.productionHosts.length === 0) errors.push('"productionHosts" must list at least one hostname.');
  else for (const h of c.productionHosts) {
    if (typeof h !== "string" || !HOST.test(h)) errors.push(`"productionHosts" entry is not a hostname: ${JSON.stringify(h)} (no scheme, path or port).`);
    else if (h === "localhost" || h.endsWith(".local")) errors.push(`"productionHosts" must not include development hosts: ${h}`);
  }
  if (typeof c.privacyUrl !== "string" || !/^(\/|https:\/\/)/.test(c.privacyUrl)) errors.push('"privacyUrl" must start with "/" or "https://".');
  if (typeof c.storageKey !== "string" || !/^[\w.-]{3,64}$/.test(c.storageKey)) errors.push('"storageKey" must be 3 to 64 letters, digits, "_", "-" or "." (version it, e.g. "acme_consent_v1").');
  if (!c.ga4MeasurementId && !c.clarityProjectId) errors.push('Set "ga4MeasurementId", "clarityProjectId", or both.');
  if (c.ga4MeasurementId && !/^G-[A-Z0-9]{4,20}$/.test(c.ga4MeasurementId)) errors.push('"ga4MeasurementId" must look like G-XXXXXXX.');
  if (c.clarityProjectId && !/^[a-z0-9]{6,20}$/i.test(c.clarityProjectId)) errors.push('"clarityProjectId" must be the short project id from Clarity settings.');
  if (c.clarityProjectId && (typeof c.maskingSentence !== "string" || !c.maskingSentence.trim())) {
    errors.push('"maskingSentence" is required with Clarity: say which inputs are masked, and only what you have verified.');
  }
  return errors;
}

export function buildConsentGate(config) {
  const errors = validateConfig(config);
  if (errors.length) {
    const err = new Error(errors.join("\n"));
    err.validation = errors;
    throw err;
  }
  const clean = {
    prefix: config.prefix,
    productName: config.productName.trim(),
    productionHosts: config.productionHosts,
    privacyUrl: config.privacyUrl,
    storageKey: config.storageKey,
    ga4MeasurementId: config.ga4MeasurementId || "",
    clarityProjectId: config.clarityProjectId || "",
    maskingSentence: (config.maskingSentence || "").trim()
  };
  // JSON is valid JS; escape "<" so the output is also safe to inline in a <script> tag.
  const literal = JSON.stringify(clean, null, 2).replace(/</g, "\\u003c");
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  if (!template.includes("__CONFIG__")) throw new Error("Template has no __CONFIG__ placeholder.");
  return template.replace("__CONFIG__", () => literal);
}

function main(argv) {
  let configPath = "";
  let outPath = "";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--help" || argv[i] === "-h") {
      console.log("Usage: build-consent-gate --config <consent.config.json> --out <consent-gate.js>");
      return 0;
    }
    if (argv[i] === "--config" && argv[i + 1]) configPath = argv[++i];
    else if (argv[i] === "--out" && argv[i + 1]) outPath = argv[++i];
    else {
      console.error(`Error: unknown or incomplete option: ${argv[i]}`);
      return 2;
    }
  }
  if (!configPath || !outPath) {
    console.error("Error: --config and --out are both required.");
    return 2;
  }
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (err) {
    console.error(`Error: could not read ${configPath}: ${err.message}`);
    return 2;
  }
  let output;
  try {
    output = buildConsentGate(config);
  } catch (err) {
    console.error(`Error: invalid config:\n${err.message}`);
    return 2;
  }
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, output, "utf8");
  console.log(`Wrote ${outPath}. Now run the browser checks in references/verification.md.`);
  return 0;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
