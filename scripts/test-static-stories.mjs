/**
 * Runs every story against the production Storybook build, the way Chromatic
 * does, and fails on any story that doesn't finish cleanly.
 *
 * `npm run test:stories` runs the stories in Vitest, which renders them
 * differently from the static build: there, pseudo-states rewrites its CSS
 * only on STORY_RENDERED (after play), and a passive useEffect can run after
 * play. A story can pass in Vitest and fail in Chromatic. This check serves
 * `storybook-static/` (build it first: `npm run storybook:build`) and runs:
 *
 * 1. Each story in a fresh `iframe.html?id=…` page, as Chromatic captures it.
 * 2. One manager page that switches through every story over the channel
 *    (`setCurrentStory`), twice, as a person clicking through Storybook does.
 *
 * A story is clean when nothing threw (play, afterEach, render) and every
 * `storyFinished` it emitted says `success` (a failed axe report is an error).
 *
 * Usage: node scripts/test-static-stories.mjs [storybook-static]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(process.argv[2] ?? 'storybook-static');
/* A grid story renders twice (once more for its story `globals`), so a story
   counts as done once it has been quiet this long after a finish. */
const SETTLE_MS = 1500;
const TIMEOUT_MS = 20000;

try {
  await stat(path.join(root, 'index.json'));
} catch {
  console.error(`✘ No Storybook build in ${path.relative(process.cwd(), root) || '.'}/ — run npm run storybook:build first.`);
  process.exit(1);
}

/* ── A static server for the build, on a free port ───────────────────────── */

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

/* ── The stories ─────────────────────────────────────────────────────────── */

const index = JSON.parse(await readFile(path.join(root, 'index.json'), 'utf8'));
const ids = Object.values(index.entries).filter((e) => e.type === 'story').map((e) => e.id);

/* Records what a preview channel reports about the story it renders. Runs in
   the page: it is passed to addInitScript and page.evaluate as source. */
const listen = (ch, events, storyId) => {
  // The first paragraph: testing-library appends a dump of the DOM after a blank line.
  const text = (e) => String(e?.message ?? e?.title ?? e ?? '').split(/\n\s*\n/)[0].replace(/\s+/g, ' ').slice(0, 300);
  const handlers = {
    playFunctionThrewException: (e) => events.push(`PLAY THREW: ${text(e)}`),
    storyThrewException: (e) => events.push(`STORY THREW: ${text(e)}`),
    storyErrored: (e) => events.push(`STORY ERRORED: ${text(e)}`),
    unhandledErrorsWhilePlaying: (errs) => events.push(`UNHANDLED: ${[].concat(errs).map(text).join(' / ')}`),
    storyFinished: (p) => {
      if (storyId && p?.storyId !== storyId) return;
      const failed = (p?.reporters ?? []).filter((r) => r.status === 'failed').map((r) => r.type);
      events.push(`finished:${p?.status}${failed.length ? ` (${failed.join(', ')} failed)` : ''}`);
    },
  };
  for (const [event, fn] of Object.entries(handlers)) ch.on(event, fn);
  return () => { for (const [event, fn] of Object.entries(handlers)) ch.off(event, fn); };
};

const clean = (events) => events.some((e) => e.startsWith('finished')) && events.every((e) => e === 'finished:success');

const browser = await chromium.launch();
let fresh, switched;
try {
  /* 1. A fresh page per story. Hook the channel the moment Storybook creates it. */
  fresh = [];
  for (const id of ids) {
    const page = await browser.newPage();
    await page.addInitScript(`(() => {
      window.__events = [];
      const timer = setInterval(() => {
        if (!window.__STORYBOOK_ADDONS_CHANNEL__) return;
        clearInterval(timer);
        (${listen})(window.__STORYBOOK_ADDONS_CHANNEL__, window.__events);
      }, 1);
    })()`);
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`);
    await page
      .waitForFunction(() => window.__events.some((e) => e.startsWith('finished')), null, { timeout: TIMEOUT_MS })
      .catch(() => {});
    await page.waitForTimeout(SETTLE_MS);
    const events = await page.evaluate(() => window.__events);
    fresh.push([id, events.some((e) => e.startsWith('finished')) ? events : [...events, 'TIMEOUT']]);
    await page.close();
  }

  /* 2. One manager page, switching stories over the channel, two passes. */
  const page = await browser.newPage();
  await page.goto(`${base}/?path=/story/${ids[0]}`);
  await page.waitForFunction(
    () => document.querySelector('#storybook-preview-iframe')?.contentWindow?.__STORYBOOK_PREVIEW__?.currentRender,
    null,
    { timeout: TIMEOUT_MS },
  );
  await page.evaluate(`window.__listen = ${listen}`);
  switched = await page.evaluate(
    async ({ ids, SETTLE_MS, TIMEOUT_MS }) => {
      const listen = window.__listen;
      const manager = window.__STORYBOOK_ADDONS_CHANNEL__;
      const ch = document.querySelector('#storybook-preview-iframe').contentWindow.__STORYBOOK_ADDONS_CHANNEL__;
      const out = [];
      for (const pass of [1, 2])
        for (const id of ids) {
          const events = [];
          await new Promise((resolve) => {
            let settle = null;
            const timer = setTimeout(() => { events.push('TIMEOUT'); done(); }, TIMEOUT_MS);
            const stop = listen(ch, events, id);
            // Wait until the story has been quiet for SETTLE_MS after a finish.
            const onFinished = (p) => {
              if (p?.storyId !== id) return;
              clearTimeout(settle);
              settle = setTimeout(done, SETTLE_MS);
            };
            ch.on('storyFinished', onFinished);
            function done() {
              clearTimeout(timer);
              clearTimeout(settle);
              stop();
              ch.off('storyFinished', onFinished);
              resolve();
            }
            manager.emit('setCurrentStory', { storyId: id, viewMode: 'story' });
          });
          out.push([`${pass}:${id}`, events]);
        }
      return out;
    },
    { ids, SETTLE_MS, TIMEOUT_MS },
  );
} finally {
  await browser.close();
  server.close();
}

let failed = 0;
for (const [name, rows] of [['Fresh page per story', fresh], ['Channel switch, two passes', switched]]) {
  const bad = rows.filter(([, events]) => !clean(events));
  failed += bad.length;
  console.log(`${bad.length ? '✘' : '✔'} ${name}: ${rows.length} renders, ${bad.length} not clean`);
  for (const [id, events] of bad) console.log(`    ${id}: ${events.join(' | ') || 'no events'}`);
}
if (failed) {
  console.error(`\n✘ ${failed} story render(s) failed against the static build. Chromatic would see the same.`);
  process.exit(1);
}
console.log(`✔ All ${ids.length} stories pass against the static build`);
