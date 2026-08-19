#!/usr/bin/env node
/**
 * Browser measurement of the reduced-motion contract — the one gate that
 * catches the C1/C2/M1 regression class (a solid-instead-of-dashed
 * waterline, stippled linework, an invisible hull). All three were invisible
 * to source-text greps and to `npm run verify`; they only show up in a real
 * browser's computed styles under forced `prefers-reduced-motion: reduce`.
 *
 * node:* built-ins only, plus Chrome driven over CDP via the global
 * WebSocket (Node 22). Deliberately NOT wired into `npm run verify` — that
 * gate stays hermetic and browser-free; this one needs a real Chrome.
 *
 *   cd site && node scripts/measure-reduced-motion.mjs
 *
 * Requires `npm run build` to have produced site/out/ first.
 */

import { createServer } from "node:http";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, extname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const OUT_DIR = join(HERE, "..", "out");
const CHROME_PATH =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

// ---------------------------------------------------------------------------
// Static server over out/, on the first free port from a short candidate
// list. EADDRINUSE is caught and moved past rather than left to crash.
// ---------------------------------------------------------------------------
async function serveOut(candidatePorts) {
  const server = createServer(async (req, res) => {
    try {
      let path = new URL(req.url, "http://localhost").pathname;
      if (path.endsWith("/")) path += "index.html";
      let file = join(OUT_DIR, path);
      let body;
      try {
        body = await readFile(file);
      } catch {
        // Next static export: extension-less routes resolve to `<route>.html`.
        file = join(OUT_DIR, `${path}.html`);
        body = await readFile(file);
      }
      res.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });

  for (const port of candidatePorts) {
    const bound = await new Promise((resolve) => {
      server.once("error", (err) => {
        if (err.code === "EADDRINUSE") resolve(false);
        else resolve(err);
      });
      server.listen(port, "127.0.0.1", () => resolve(true));
    });
    if (bound === true) return { server, port };
    if (bound !== false) throw bound; // an unexpected listen error
  }
  throw new Error(
    `measure-reduced-motion: all candidate ports in use (${candidatePorts.join(", ")}) — ` +
      `free one of them or edit the candidate list.`
  );
}

// ---------------------------------------------------------------------------
// Headless Chrome, forced reduced motion, its own throwaway profile.
// ---------------------------------------------------------------------------
async function launchChrome(candidatePorts, profileDir) {
  let stderr = "";
  for (const port of candidatePorts) {
    const child = spawn(
      CHROME_PATH,
      [
        "--headless=new",
        "--disable-gpu",
        "--force-prefers-reduced-motion",
        `--user-data-dir=${profileDir}`,
        `--remote-debugging-port=${port}`,
        "--window-size=1280,2400",
        "about:blank",
      ],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      stderr += `\n(spawn error: ${err.message})`;
    });

    const version = await pollJsonVersion(port, 8000);
    if (version) return { child, port };

    child.kill("SIGKILL");
  }
  throw new Error(
    `measure-reduced-motion: Chrome never came up on any of ports ${candidatePorts.join(", ")} ` +
      `within the poll window. Checked binary: ${CHROME_PATH}.` +
      (stderr.trim() ? `\nChrome stderr:\n${stderr.trim()}` : "")
  );
}

async function pollJsonVersion(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return await res.json();
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

// ---------------------------------------------------------------------------
// Minimal CDP client: one WebSocket, request/response by id, no domain
// bookkeeping beyond what Runtime.evaluate needs.
// ---------------------------------------------------------------------------
class CDP {
  #ws;
  #nextId = 1;
  #pending = new Map();

  constructor(wsUrl) {
    this.#ws = new WebSocket(wsUrl);
    this.#ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      const waiter = this.#pending.get(msg.id);
      if (!waiter) return;
      this.#pending.delete(msg.id);
      if (msg.error) waiter.reject(new Error(msg.error.message));
      else waiter.resolve(msg.result);
    });
  }

  ready() {
    return new Promise((resolve, reject) => {
      this.#ws.addEventListener("open", () => resolve(), { once: true });
      this.#ws.addEventListener("error", () => reject(new Error("CDP websocket failed to open")), {
        once: true,
      });
    });
  }

  send(method, params = {}) {
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression, { awaitPromise = false } = {}) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise,
    });
    if (result.exceptionDetails) {
      const desc =
        result.exceptionDetails.exception?.description ?? result.exceptionDetails.text;
      throw new Error(`page threw during evaluate: ${desc}`);
    }
    return result.result.value;
  }

  close() {
    this.#ws.close();
  }
}

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------
async function measure(cdp) {
  // Wait for the document to finish loading.
  const loadDeadline = Date.now() + 10000;
  let ready = false;
  while (Date.now() < loadDeadline) {
    ready = (await cdp.evaluate("document.readyState")) === "complete";
    if (ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!ready) throw new Error("page never reached document.readyState 'complete'");

  // 3. Control first: reduced-motion emulation must actually be in effect,
  // or every downstream assertion below would pass trivially.
  const reducedMotion = await cdp.evaluate(
    "window.matchMedia('(prefers-reduced-motion: reduce)').matches"
  );
  if (reducedMotion !== true) {
    throw new Error(
      `control failed: matchMedia('(prefers-reduced-motion: reduce)').matches === ${reducedMotion}, ` +
        `expected true — reduced-motion emulation did not take effect, so no other assertion is meaningful`
    );
  }

  // 4. Fire scroll-triggered reveals, then return to top and settle.
  await cdp.evaluate("window.scrollTo(0, document.body.scrollHeight)");
  await new Promise((r) => setTimeout(r, 250));
  await cdp.evaluate("window.scrollTo(0, 0)");
  await new Promise((r) => setTimeout(r, 400));

  // 5. Read computed styles.
  const data = await cdp.evaluate(`(() => {
    const waterlineEl = document.querySelector("svg path[data-reveal]");
    const waterlineDasharray = waterlineEl
      ? getComputedStyle(waterlineEl).strokeDasharray
      : null;

    const svgEls = Array.from(document.querySelectorAll("svg, svg *"));
    const stippled = svgEls
      .filter((el) => getComputedStyle(el).strokeDasharray === "1px, 1px")
      .map((el) => el.tagName.toLowerCase());

    const hullEl = document.querySelector("[data-reveal-path]");
    const hull = hullEl
      ? {
          opacity: getComputedStyle(hullEl).opacity,
          dasharray: getComputedStyle(hullEl).strokeDasharray,
        }
      : null;

    const isTextLeaf = (el) =>
      Array.from(el.childNodes).some(
        (n) => n.nodeType === 3 && n.textContent.trim().length > 0
      );
    const invisibleText = Array.from(document.querySelectorAll("*"))
      .filter(isTextLeaf)
      .filter((el) => getComputedStyle(el).opacity === "0")
      .map((el) => \`<\${el.tagName.toLowerCase()}> "\${el.textContent.trim().slice(0, 40)}"\`);

    return { waterlineFound: !!waterlineEl, waterlineDasharray, stippled, hullFound: !!hullEl, hull, invisibleText };
  })()`);

  return { reducedMotion, ...data };
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------
function buildAssertions(m) {
  return [
    {
      name: "control: prefers-reduced-motion emulation active",
      pass: m.reducedMotion === true,
      measured: m.reducedMotion,
      expected: true,
    },
    {
      name: "C1: hero waterline computes a two-value dash (10px, 8px)",
      pass: m.waterlineFound && m.waterlineDasharray === "10px, 8px",
      measured: m.waterlineFound ? m.waterlineDasharray : "(waterline element not found)",
      expected: "10px, 8px",
    },
    {
      name: "C2: zero SVG elements compute stroke-dasharray 1px, 1px",
      pass: m.stippled.length === 0,
      measured: m.stippled.length === 0 ? "0" : `${m.stippled.length} (${m.stippled.join(", ")})`,
      expected: "0",
    },
    {
      name: "M1: [data-reveal-path] (hull) computes opacity 1, dasharray none",
      pass: m.hullFound && m.hull.opacity === "1" && m.hull.dasharray === "none",
      measured: m.hullFound ? JSON.stringify(m.hull) : "(hull element not found)",
      expected: '{"opacity":"1","dasharray":"none"}',
    },
    {
      name: "zero text-bearing elements compute opacity 0",
      pass: m.invisibleText.length === 0,
      measured:
        m.invisibleText.length === 0 ? "0" : `${m.invisibleText.length} (${m.invisibleText.join("; ")})`,
      expected: "0",
    },
  ];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const HTTP_PORTS = [4173, 4321, 4899, 5173, 8973];
  const CHROME_PORTS = [9222, 9333];

  let serverInfo;
  let chromeInfo;
  let profileDir;
  let cdp;

  try {
    serverInfo = await serveOut(HTTP_PORTS);
    console.log(`measure-reduced-motion: serving out/ on http://127.0.0.1:${serverInfo.port}`);

    profileDir = await mkdtemp(join(tmpdir(), "drydock-chrome-"));
    chromeInfo = await launchChrome(CHROME_PORTS, profileDir);
    console.log(`measure-reduced-motion: Chrome up on debug port ${chromeInfo.port}`);

    const targetUrl = `http://127.0.0.1:${serverInfo.port}/`;
    const created = await fetch(
      `http://127.0.0.1:${chromeInfo.port}/json/new?${encodeURIComponent(targetUrl)}`,
      { method: "PUT" }
    ).then((r) => r.json());

    cdp = new CDP(created.webSocketDebuggerUrl);
    await cdp.ready();

    const measured = await measure(cdp);
    const assertions = buildAssertions(measured);
    const failed = assertions.filter((a) => !a.pass);

    if (failed.length > 0) {
      console.error(`measure-reduced-motion: FAIL (${failed.length}/${assertions.length})`);
      for (const a of assertions) {
        const mark = a.pass ? "ok " : "FAIL";
        console.error(`  [${mark}] ${a.name} — measured: ${a.measured}, expected: ${a.expected}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log(
      `measure-reduced-motion: PASS — reducedMotion=${measured.reducedMotion}, ` +
        `waterline="${measured.waterlineDasharray}", stippled=${measured.stippled.length}, ` +
        `hull=${JSON.stringify(measured.hull)}, invisibleText=${measured.invisibleText.length}`
    );
  } catch (err) {
    console.error(`measure-reduced-motion: ERROR — ${err.message}`);
    process.exitCode = 1;
  } finally {
    cdp?.close();
    if (chromeInfo?.child) chromeInfo.child.kill("SIGKILL");
    if (profileDir) await rm(profileDir, { recursive: true, force: true }).catch(() => {});
    if (serverInfo?.server) await new Promise((r) => serverInfo.server.close(r));
  }
}

await main();
