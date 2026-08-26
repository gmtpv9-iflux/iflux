#!/usr/bin/env node
/* P2 Owner Acceptance — viewport selector + iframe isolation.
 * Harness ngoài repo. Layout phải do CSS — harness click nút + đo iframe.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE = process.env.IFX_P2_URL || 'http://127.0.0.1:8901/design_system/sandbox/index.html?section=foundation';
const OUT = process.argv[2] || '/tmp/ifx-p2-verify/shots';
fs.mkdirSync(OUT, { recursive: true });

const BUTTONS = [
  { vp: '360', bp: 'base', cols: 1, pad: 16, dir: 'column' },
  { vp: '480', bp: 'sm', cols: 1, pad: 16, dir: 'column' },
  { vp: '768', bp: 'md', cols: 2, pad: 20, dir: 'row' },
  { vp: '1024', bp: 'lg', cols: 3, pad: 24, dir: 'row' },
  { vp: '1280', bp: 'xl', cols: 3, pad: 24, dir: 'row' },
  { vp: '1440', bp: '2xl', cols: 4, pad: 32, dir: 'row' },
];
const THEMES = ['dark', 'light'];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const results = [];
let failures = 0;

for (const theme of THEMES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(PAGE, { waitUntil: 'networkidle0', timeout: 45000 });
  await page.evaluate((t) => { localStorage.setItem('ifx-theme', t); }, theme);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#pgFrame');
  await page.waitForSelector('#iconGrid .sb-icon-cell');

  const iconMeta = await page.evaluate(() => ({
    source: document.getElementById('iconSourceCount').textContent,
    canon: document.getElementById('iconCanonCount').textContent,
    missing: document.getElementById('iconMissing').textContent,
    cells: document.querySelectorAll('#iconGrid .sb-icon-cell').length,
  }));

  for (const spec of BUTTONS) {
    await page.click('.sb-vp-btn[data-vp="' + spec.vp + '"]');
    await page.waitForFunction((w) => {
      const t = document.getElementById('pgActual');
      return t && t.textContent === w + 'px';
    }, { timeout: 8000 }, spec.vp);

    const m = await page.evaluate(async (vp) => {
      const frame = document.getElementById('pgFrame');
      const win = frame.contentWindow;
      const fdoc = frame.contentDocument;
      const cells = [...fdoc.querySelectorAll('.sb-pg-grid > .sb-pg-cell')];
      const firstTop = cells[0].getBoundingClientRect().top;
      const cols = cells.filter((c) => Math.abs(c.getBoundingClientRect().top - firstTop) < 1).length;
      const abc = fdoc.querySelector('.sb-pg-abc');
      const demo = fdoc.querySelector('.sb-pg-container-demo');
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        selected: document.getElementById('pgSelected').textContent,
        actual: document.getElementById('pgActual').textContent,
        label: document.getElementById('pgActiveBp').textContent,
        marker: document.querySelector('#pgMarkers .sb-pg-marker.is-active')?.getAttribute('data-bp'),
        iframeWidth: win.innerWidth,
        cols,
        direction: win.getComputedStyle(abc).flexDirection,
        pad: parseFloat(win.getComputedStyle(demo).paddingLeft),
        frameCssWidth: frame.style.width,
      };
    }, spec.vp);

    const checks = {
      'theme đúng': m.theme === theme,
      [`iframe innerWidth ${spec.vp}`]: m.iframeWidth === Number(spec.vp),
      [`actual label ${spec.vp}`]: m.actual === spec.vp + 'px',
      [`bp ${spec.bp}`]: m.marker === spec.bp && m.label.toLowerCase().startsWith(spec.bp === 'base' ? 'base' : spec.bp),
      [`grid ${spec.cols}`]: m.cols === spec.cols,
      [`dir ${spec.dir}`]: m.direction === spec.dir,
      [`pad ${spec.pad}`]: Math.abs(m.pad - spec.pad) < 0.5,
    };
    const failed = Object.entries(checks).filter(([, ok]) => !ok);
    failures += failed.length;
    results.push({ theme, vp: spec.vp, pass: failed.length === 0, failed: failed.map(([k]) => k), meta: m, icons: iconMeta });
    console.log(`${failed.length === 0 ? 'PASS' : 'FAIL'}  ${theme} ${spec.vp} ${spec.bp}` + (failed.length ? '  ✗ ' + failed.map(([k]) => k).join(' · ') : ''));
    await page.screenshot({ path: path.join(OUT, `${spec.vp}-${theme}.png`), fullPage: false });
  }
  await page.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
console.log(failures === 0 ? '\n[matrix] PASS — 6 viewport buttons × 2 theme (iframe isolation)' : `\n[matrix] FAIL — ${failures} check hỏng`);
process.exit(failures === 0 ? 0 : 1);
