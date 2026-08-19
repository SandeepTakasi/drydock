#!/usr/bin/env node
/**
 * Browser measurement of the reduced-motion contract — the one gate that
 * catches the C1/C2/M1 regression class (a solid-instead-of-dashed
 * waterline, stippled linework, an invisible hull), plus D1/D2, the
 * scroll-linked-motion contract for `[data-drift]` elements (`useDriftY` in
 * `lib/motion.ts`). All were invisible to source-text greps and to
 * `npm run verify`; they only show up in a real browser's styles under (and,
 * for D2, explicitly without) forced `prefers-reduced-motion: reduce`.
 *
 * D1/D2 read the INLINE transform (`el.style.transform`), not the computed
 * one. `[data-reveal] { transform: none !important }` in `app/globals.css`
 * beats an inline style in the computed value, and the drifting layer will
 * carry `data-reveal` — so a computed check reads `none` whether or not
 * `useDriftY` actually works. Measured in headless Chrome: two identical
 * drifting `<g>`s gave `matrix(1, 0, 0, 1, 0, 12)` with `data-drift` alone
 * and `none` with `data-drift data-reveal`.
 *
 * D1 (reduced motion): every `[data-drift]` element's inline transform must
 * be empty/identity at two scroll positions — passes vacuously while no
 * `[data-drift]` element exists yet (today's count is 0; the hero adds one
 * in the next wave).
 * D2 (motion allowed): a SECOND, unflagged Chrome must see that same
 * element's inline transform differ across the same two scroll positions —
 * without this, a `useDriftY` ref that never attaches pins `y` at a static
 * offset, D1 is satisfied (reduced motion is exactly when nothing should
 * move), and dead drift is indistinguishable from working drift.
 *
 * `DRIFT_FIXTURE=1` permanently and re-runnably proves D1 can fail: it
 * injects one `[data-drift][data-reveal]` element with a non-identity inline
 * transform (the masked case above) into every session, so a clean run
 * passes and a flagged run fails naming D1.
 *
 * C1's waterline selector is hardened past document order
 * (`svg path[data-reveal]`, which a new earlier `motion.path` could shadow)
 * to `svg path[data-reveal][stroke-dasharray="10 8"]` — pinned on the exact
 * dash value C1 already requires and that T1.2.1 is separately forbidden
 * from changing, so it needs no new markup and cannot silently drift onto
 * the wrong node.
 *
 * node:* built-ins only, plus Chrome driven over CDP via the global
 * WebSocket (Node 22). Deliberately NOT wired into `npm run verify` — that
 * gate stays hermetic and browser-free; this one needs a real Chrome.
 *
 *   cd site && node scripts/measure-reduced-motion.mjs
 *   cd site && DRIFT_FIXTURE=1 node scripts/measure-reduced-motion.mjs   # must fail, naming D1
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
const INJECT_FIXTURE = process.env.DRIFT_FIXTURE === "1";

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
// Headless Chrome, its own throwaway profile. `forceReducedMotion` toggles
// `--force-prefers-reduced-motion` — D2 needs a session WITHOUT it.
// ---------------------------------------------------------------------------
async function launchChrome(candidatePorts, profileDir, forceReducedMotion) {
  let stderr = "";
  for (const port of candidatePorts) {
    const child = spawn(
      CHROME_PATH,
      [
        "--headless=new",
        "--disable-gpu",
        ...(forceReducedMotion ? ["--force-prefers-reduced-motion"] : []),
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
// Drift fixture (Decision 7). Permanent, env-flagged, never removed: injects
// one [data-drift][data-reveal] element whose inline transform is NOT
// identity, reproducing the exact masked-under-reduced-motion case D1 exists
// to catch (Decision 8) — so a clean run passes and a flagged run fails,
// naming D1, every time wavecheck re-runs it.
// ---------------------------------------------------------------------------
async function injectDriftFixture(cdp) {
  await cdp.evaluate(`(() => {
    const el = document.createElement("div");
    el.setAttribute("data-drift", "");
    el.setAttribute("data-reveal", "");
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.width = "0";
    el.style.height = "0";
    el.style.overflow = "hidden";
    el.style.transform = "translate(0px, 12px)";
    document.body.appendChild(el);
  })()`);
}

/** Inline (not computed) transform of every `[data-drift]` element, in DOM order. */
async function captureDriftTransforms(cdp) {
  return cdp.evaluate(
    `Array.from(document.querySelectorAll("[data-drift]")).map((el) => el.style.transform)`
  );
}

/** `matrix(1, 0, 0, 1, 0, 0)`, `translate(0px, 0px)`, `""`, `"none"` — all identity. */
function isIdentityTransform(value) {
  const v = (value ?? "").trim();
  if (v === "" || v === "none") return true;
  const matrix = v.match(/^matrix\(([^)]+)\)$/);
  if (matrix) {
    const n = matrix[1].split(",").map((x) => parseFloat(x));
    return (
      n.length === 6 && n[0] === 1 && n[1] === 0 && n[2] === 0 && n[3] === 1 && n[4] === 0 && n[5] === 0
    );
  }
  const nums = v.match(/-?\d*\.?\d+/g);
  return nums === null || nums.every((n) => parseFloat(n) === 0);
}

// ---------------------------------------------------------------------------
// Measurement. `expectReducedMotion` selects the fatal control check (only
// meaningful — and only asserted — for the forced-reduced-motion session);
// the unflagged session folds its own matchMedia read into D2 instead.
// ---------------------------------------------------------------------------
async function measure(cdp, { expectReducedMotion, injectFixture }) {
  // Wait for the document to finish loading.
  const loadDeadline = Date.now() + 10000;
  let ready = false;
  while (Date.now() < loadDeadline) {
    ready = (await cdp.evaluate("document.readyState")) === "complete";
    if (ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!ready) throw new Error("page never reached document.readyState 'complete'");

  if (injectFixture) await injectDriftFixture(cdp);

  // Control: reduced-motion emulation must actually be in effect, or every
  // downstream assertion for this session would pass trivially.
  const reducedMotion = await cdp.evaluate(
    "window.matchMedia('(prefers-reduced-motion: reduce)').matches"
  );
  if (expectReducedMotion && reducedMotion !== true) {
    throw new Error(
      `control failed: matchMedia('(prefers-reduced-motion: reduce)').matches === ${reducedMotion}, ` +
        `expected true — reduced-motion emulation did not take effect, so no other assertion is meaningful`
    );
  }

  // Fire scroll-triggered reveals and drift, sampling [data-drift] inline
  // transforms at two distinct scroll positions along the way (D1/D2).
  await cdp.evaluate("window.scrollTo(0, document.body.scrollHeight)");
  await new Promise((r) => setTimeout(r, 250));
  const driftBottom = await captureDriftTransforms(cdp);

  await cdp.evaluate("window.scrollTo(0, 0)");
  await new Promise((r) => setTimeout(r, 400));
  const driftTop = await captureDriftTransforms(cdp);

  // Read computed (and, for the waterline hook, presentation-attribute) styles.
  const data = await cdp.evaluate(`(() => {
    const waterlineMatches = Array.from(
      document.querySelectorAll('svg path[data-reveal][stroke-dasharray="10 8"]')
    );
    const waterlineEl = waterlineMatches.length === 1 ? waterlineMatches[0] : null;
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

    return {
      waterlineFound: !!waterlineEl,
      waterlineMatchCount: waterlineMatches.length,
      waterlineDasharray,
      stippled,
      hullFound: !!hullEl,
      hull,
      invisibleText,
    };
  })()`);

  return { reducedMotion, driftBottom, driftTop, ...data };
}

// ---------------------------------------------------------------------------
// One full session: profile + Chrome + tab + measurement, cleaned up before
// returning. Two of these run sequentially in main() — one forced-reduced,
// one not (D2) — sharing the single static server.
// ---------------------------------------------------------------------------
async function runSession(serverPort, chromePorts, { forceReducedMotion, injectFixture }) {
  let profileDir;
  let chromeInfo;
  let cdp;
  try {
    profileDir = await mkdtemp(join(tmpdir(), "drydock-chrome-"));
    chromeInfo = await launchChrome(chromePorts, profileDir, forceReducedMotion);

    const targetUrl = `http://127.0.0.1:${serverPort}/`;
    const created = await fetch(
      `http://127.0.0.1:${chromeInfo.port}/json/new?${encodeURIComponent(targetUrl)}`,
      { method: "PUT" }
    ).then((r) => r.json());

    cdp = new CDP(created.webSocketDebuggerUrl);
    await cdp.ready();

    return await measure(cdp, { expectReducedMotion: forceReducedMotion, injectFixture });
  } finally {
    cdp?.close();
    if (chromeInfo?.child) chromeInfo.child.kill("SIGKILL");
    if (profileDir) await rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------
function buildAssertions(m1, m2) {
  const d1Pass =
    m1.driftBottom.every(isIdentityTransform) && m1.driftTop.every(isIdentityTransform);

  const d2Pass =
    m2.reducedMotion === false &&
    (m2.driftBottom.length === 0 ||
      m2.driftTop.every((t, i) => t !== m2.driftBottom[i]));

  return [
    {
      name: "control: prefers-reduced-motion emulation active",
      pass: m1.reducedMotion === true,
      measured: m1.reducedMotion,
      expected: true,
    },
    {
      name: "C1: hero waterline computes a two-value dash (10px, 8px)",
      pass: m1.waterlineFound && m1.waterlineDasharray === "10px, 8px",
      measured: m1.waterlineFound
        ? m1.waterlineDasharray
        : `(expected exactly 1 match for svg path[data-reveal][stroke-dasharray="10 8"], found ${m1.waterlineMatchCount})`,
      expected: "10px, 8px",
    },
    {
      name: "C2: zero SVG elements compute stroke-dasharray 1px, 1px",
      pass: m1.stippled.length === 0,
      measured: m1.stippled.length === 0 ? "0" : `${m1.stippled.length} (${m1.stippled.join(", ")})`,
      expected: "0",
    },
    {
      name: "M1: [data-reveal-path] (hull) computes opacity 1, dasharray none",
      pass: m1.hullFound && m1.hull.opacity === "1" && m1.hull.dasharray === "none",
      measured: m1.hullFound ? JSON.stringify(m1.hull) : "(hull element not found)",
      expected: '{"opacity":"1","dasharray":"none"}',
    },
    {
      name: "zero text-bearing elements compute opacity 0",
      pass: m1.invisibleText.length === 0,
      measured:
        m1.invisibleText.length === 0 ? "0" : `${m1.invisibleText.length} (${m1.invisibleText.join("; ")})`,
      expected: "0",
    },
    {
      name: "D1: [data-drift] elements carry no inline drift transform under reduced motion",
      pass: d1Pass,
      measured: `count=${m1.driftBottom.length}, bottom=${JSON.stringify(m1.driftBottom)}, top=${JSON.stringify(m1.driftTop)}`,
      expected: "every [data-drift] element's inline style.transform is empty/identity at both scroll positions (vacuous when count is 0)",
    },
    {
      name: "D2: [data-drift] elements' inline transform changes across scroll positions when motion is allowed",
      pass: d2Pass,
      measured: `reducedMotion=${m2.reducedMotion}, count=${m2.driftBottom.length}, bottom=${JSON.stringify(m2.driftBottom)}, top=${JSON.stringify(m2.driftTop)}`,
      expected: "reducedMotion=false and every [data-drift] element's style.transform differs between the two scroll positions (vacuous when count is 0)",
    },
  ];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const HTTP_PORTS = [4173, 4321, 4899, 5173, 8973];
  const REDUCED_MOTION_CHROME_PORTS = [9222, 9333];
  const MOTION_ALLOWED_CHROME_PORTS = [9422, 9533];

  let serverInfo;

  try {
    serverInfo = await serveOut(HTTP_PORTS);
    console.log(`measure-reduced-motion: serving out/ on http://127.0.0.1:${serverInfo.port}`);

    const m1 = await runSession(serverInfo.port, REDUCED_MOTION_CHROME_PORTS, {
      forceReducedMotion: true,
      injectFixture: INJECT_FIXTURE,
    });
    console.log(
      `measure-reduced-motion: reduced-motion session done — [data-drift] count=${m1.driftBottom.length}`
    );

    const m2 = await runSession(serverInfo.port, MOTION_ALLOWED_CHROME_PORTS, {
      forceReducedMotion: false,
      injectFixture: INJECT_FIXTURE,
    });
    console.log(
      `measure-reduced-motion: motion-allowed session done — [data-drift] count=${m2.driftBottom.length}`
    );

    const assertions = buildAssertions(m1, m2);
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
      `measure-reduced-motion: PASS — reducedMotion=${m1.reducedMotion}, ` +
        `waterline="${m1.waterlineDasharray}", stippled=${m1.stippled.length}, ` +
        `hull=${JSON.stringify(m1.hull)}, invisibleText=${m1.invisibleText.length}, ` +
        `drift[reduced]=${m1.driftBottom.length}, drift[motion-allowed]=${m2.driftBottom.length}`
    );
  } catch (err) {
    console.error(`measure-reduced-motion: ERROR — ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (serverInfo?.server) await new Promise((r) => serverInfo.server.close(r));
  }
}

await main();
