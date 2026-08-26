#!/usr/bin/env node
/* P2 Responsive Acceptance Matrix — 6 viewport × 2 theme trên Chrome headless.
 * Harness evidence (ngoài repo). Layout phải do CSS điều khiển — harness chỉ đo.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE = 'file:///Users/mac/Documents/Productions/iFLUX_P1/design_system/sandbox/index.html';
const OUT = process.argv[2] || '/tmp/ifx-p2-verify/shots';
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { w: 360, bp: 'base', cols: 1, pad: 16 },
  { w: 480, bp: 'sm', cols: 1, pad: 16 },
  { w: 768, bp: 'md', cols: 2, pad: 20 },
  { w: 1024, bp: 'lg', cols: 3, pad: 24 },
  { w: 1280, bp: 'xl', cols: 3, pad: 24 },
  { w: 1440, bp: '2xl', cols: 4, pad: 32 },
];
const THEMES = ['dark', 'light'];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const results = [];
let failures = 0;

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
    await page.goto(PAGE, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);

    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const cells = [...document.querySelectorAll('.sb-pg-grid > .sb-pg-cell')];
      const firstTop = cells[0].getBoundingClientRect().top;
      const colsRendered = cells.filter(c => Math.abs(c.getBoundingClientRect().top - firstTop) < 1).length;
      const abc = document.querySelector('.sb-pg-abc');
      const demo = document.querySelector('.sb-pg-container-demo');
      const maxDemo = document.querySelectorAll('.sb-pg-container-demo')[1];
      const activeMarker = document.querySelector('.sb-pg-marker.is-active');
      return {
        theme: de.getAttribute('data-theme'),
        overflowX: de.scrollWidth - de.clientWidth,
        bodyFont: getComputedStyle(document.body).fontFamily,
        fontLoaded: document.fonts.check('400 16px "Be Vietnam Pro"'),
        colsRendered,
        abcDirection: getComputedStyle(abc).flexDirection,
        containerPad: parseFloat(getComputedStyle(demo).paddingLeft),
        fullContainerWidth: demo.getBoundingClientRect().width,
        maxContainerWidth: maxDemo.getBoundingClientRect().width,
        tokenContainer: getComputedStyle(de).getPropertyValue('--ifx-space-container').trim(),
        activeBpLabel: document.getElementById('pgActiveBp').textContent,
        activeMarkerBp: activeMarker ? activeMarker.getAttribute('data-bp') : null,
        viewportText: document.getElementById('pgViewport').textContent,
        iconLg: document.querySelector('.ifx-icon-lg') ? document.querySelector('.ifx-icon-lg').getBoundingClientRect().width : null,
        bgCanvas: getComputedStyle(document.body).backgroundColor,
      };
    });

    const expDir = ['base', 'sm'].includes(vp.bp) ? 'column' : 'row';
    const expMaxW = Math.min(m.fullContainerWidth, 1280);
    const checks = {
      'theme đúng': m.theme === theme,
      'không overflow ngang': m.overflowX <= 0,
      'font Be Vietnam Pro': m.fontLoaded && m.bodyFont.includes('Be Vietnam Pro'),
      [`grid ${vp.cols} cột`]: m.colsRendered === vp.cols,
      [`stack/inline ${expDir}`]: m.abcDirection === expDir,
      [`container pad ${vp.pad}px`]: Math.abs(m.containerPad - vp.pad) < 0.5,
      'container-max ≤ 1280': Math.abs(m.maxContainerWidth - expMaxW) < 1,
      [`bp label = ${vp.bp}`]: m.activeBpLabel.toLowerCase().startsWith(vp.bp === 'base' ? 'base' : vp.bp),
      [`marker active = ${vp.bp}`]: m.activeMarkerBp === vp.bp,
      'icon lg 24px': m.iconLg === 24,
      'viewport text đúng': m.viewportText === `${vp.w}px`,
    };
    const failed = Object.entries(checks).filter(([, ok]) => !ok);
    failures += failed.length;

    const shot = path.join(OUT, `${String(vp.w).padStart(4, '0')}-${vp.bp}-${theme}.png`);
    await page.screenshot({ path: shot, fullPage: false });

    results.push({ vp: `${vp.w}px/${vp.bp}`, theme, pass: failed.length === 0, failed: failed.map(([k]) => k), meta: m });
    console.log(`${failed.length === 0 ? 'PASS' : 'FAIL'}  ${vp.w}px ${vp.bp} ${theme}` + (failed.length ? '  ✗ ' + failed.map(([k]) => k).join(' · ') : ''));
    await page.close();
  }
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
console.log(failures === 0 ? '\n[matrix] PASS 12/12 — 6 viewport × 2 theme' : `\n[matrix] FAIL — ${failures} check hỏng`);
process.exit(failures === 0 ? 0 : 1);
