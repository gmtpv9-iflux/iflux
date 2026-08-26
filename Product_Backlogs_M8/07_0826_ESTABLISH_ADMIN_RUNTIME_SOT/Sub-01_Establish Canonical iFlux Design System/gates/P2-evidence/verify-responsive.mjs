#!/usr/bin/env node
/* P2 Owner Acceptance — viewport × span, iframe isolation, container contract. */
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
  { vp: '1280', bp: 'xl', cols: 3, pad: 32, dir: 'row' },
  { vp: '1440', bp: '2xl', cols: 4, pad: 32, dir: 'row' },
];
const SPANS = [
  { n: 12, nominal: 100 },
  { n: 6, nominal: 50 },
  { n: 4, nominal: 33.333 },
  { n: 3, nominal: 25 },
  { n: 2, nominal: 16.667 },
];
const THEMES = ['dark', 'light'];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const results = [];
let failures = 0;

function record(theme, label, checks, meta) {
  const failed = Object.entries(checks).filter(([, ok]) => !ok);
  failures += failed.length;
  results.push({ theme, label, pass: failed.length === 0, failed: failed.map(([k]) => k), meta });
  console.log(`${failed.length === 0 ? 'PASS' : 'FAIL'}  ${theme} ${label}` + (failed.length ? '  ✗ ' + failed.map(([k]) => k).join(' · ') : ''));
}

for (const theme of THEMES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(PAGE, { waitUntil: 'networkidle0', timeout: 45000 });
  await page.evaluate((t) => { localStorage.setItem('ifx-theme', t); }, theme);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#pgFrame');
  await page.waitForSelector('#iconGrid .sb-icon-cell');

  const colClasses = await page.evaluate(() => {
    const href = [...document.styleSheets].map((s) => s.href || '').find((h) => h.includes('layout.css'));
    return fetch(href).then((r) => r.text()).then((css) => {
      const missing = [];
      ['', 'sm-', 'md-', 'lg-', 'xl-', '2xl-'].forEach((bp) => {
        for (let n = 1; n <= 12; n += 1) {
          const cls = `.ifx-col-${bp}${n}`;
          if (!new RegExp(cls.replace('.', '\\.') + '\\s*\\{').test(css)) missing.push(cls);
        }
      });
      return { missing, count: 72 - missing.length };
    });
  });
  record(theme, 'grid classes 1–12 × 6 bp', { '72 classes': colClasses.missing.length === 0 }, colClasses);

  for (const spec of BUTTONS) {
    await page.click('.sb-vp-btn[data-vp="' + spec.vp + '"]');
    await page.waitForFunction((w) => {
      const t = document.getElementById('pgActual');
      return t && t.textContent === w + 'px';
    }, { timeout: 8000 }, spec.vp);

    const themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const actual = await page.evaluate(() => document.getElementById('pgActual').textContent);
    const marker = await page.evaluate(() => document.querySelector('#pgMarkers .sb-pg-marker.is-active')?.getAttribute('data-bp'));
    const frame = await (await page.$('#pgFrame')).contentFrame();
    const m = await frame.evaluate(() => {
      const cells = [...document.querySelectorAll('.sb-pg-grid > .sb-pg-cell')];
      const firstTop = cells[0].getBoundingClientRect().top;
      const cols = cells.filter((c) => Math.abs(c.getBoundingClientRect().top - firstTop) < 1).length;
      const abc = document.querySelector('.sb-pg-abc');
      const fluid = document.getElementById('pgFluid');
      const maxEl = document.getElementById('pgMax');
      const inner = document.getElementById('pgFluidInner');
      return {
        iframeWidth: window.innerWidth,
        cols,
        direction: getComputedStyle(abc).flexDirection,
        pad: parseFloat(getComputedStyle(fluid).paddingLeft),
        fluidOuter: fluid.getBoundingClientRect().width,
        content: inner.getBoundingClientRect().width,
        maxOuter: maxEl.getBoundingClientRect().width,
        maxLeft: maxEl.getBoundingClientRect().left,
        maxToken: getComputedStyle(maxEl).maxWidth,
      };
    });
    m.theme = themeAttr;
    m.actual = actual;
    m.marker = marker;

    const ratio = m.content / m.iframeWidth;
    const checks = {
      'theme đúng': m.theme === theme,
      [`iframe innerWidth ${spec.vp}`]: m.iframeWidth === Number(spec.vp),
      [`bp ${spec.bp}`]: m.marker === spec.bp,
      [`grid composition ${spec.cols}`]: m.cols === spec.cols,
      [`dir ${spec.dir}`]: m.direction === spec.dir,
      [`gutter ${spec.pad}`]: Math.abs(m.pad - spec.pad) < 0.5,
      'fluid outer = viewport': Math.abs(m.fluidOuter - m.iframeWidth) < 1,
      'content = viewport − 2×gutter': Math.abs(m.content - (m.iframeWidth - 2 * m.pad)) < 1.5,
      'container-max ≤ 1280': m.maxOuter <= 1280.5,
      'max-width token 1280': m.maxToken === '1280px',
    };
    if (spec.vp === '1440') {
      checks['max outer 1280'] = Math.abs(m.maxOuter - 1280) < 1;
      checks['outer margin ~80'] = Math.abs(m.maxLeft - 80) < 1.5;
    }
    if (spec.vp === '360') {
      checks['mobile content ratio > 90%'] = ratio > 0.90;
    }
    record(theme, spec.vp + ' ' + spec.bp, checks, { ...m, ratio });
    await page.screenshot({ path: path.join(OUT, `${spec.vp}-${theme}.png`), fullPage: false });
  }

  await page.click('.sb-vp-btn[data-vp="1024"]');
  await page.waitForFunction(() => document.getElementById('pgActual')?.textContent === '1024px');
  for (const sp of SPANS) {
    await page.click('.sb-vp-btn[data-span="' + sp.n + '"]');
    await page.waitForFunction((n) => {
      const t = document.getElementById('pgBoxSpan');
      return t && t.textContent.indexOf(n + '/12') === 0;
    }, { timeout: 8000 }, sp.n);
    const spanFrame = await (await page.$('#pgFrame')).contentFrame();
    const s = await spanFrame.evaluate(() => {
      const cell = document.getElementById('pgSpanCell');
      const grid = document.getElementById('pgSpanGrid');
      const rest = document.getElementById('pgSpanRest');
      return {
        className: cell.className,
        cellW: cell.getBoundingClientRect().width,
        gridW: grid.getBoundingClientRect().width,
        restHidden: rest.hidden,
        sameRow: !rest.hidden && Math.abs(cell.getBoundingClientRect().top - rest.getBoundingClientRect().top) < 1,
      };
    });
    const share = s.cellW / s.gridW;
    const checks = {
      [`class ifx-col-${sp.n}`]: s.className.split(/\s+/).includes('ifx-col-' + sp.n),
    };
    if (sp.n === 12) {
      checks['12/12 full'] = share > 0.98;
      checks['no remainder'] = s.restHidden === true;
    } else {
      checks['remainder cùng hàng'] = s.sameRow === true;
      checks[`share ~ ${sp.nominal}% (− gap)`] = share > (sp.nominal / 100) * 0.72 && share < (sp.nominal / 100) + 0.02;
    }
    record(theme, 'span ' + sp.n + '/12', checks, { ...s, share });
  }
  await page.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
console.log(failures === 0 ? '\n[matrix] PASS — viewport × theme + span + container' : `\n[matrix] FAIL — ${failures} check hỏng`);
process.exit(failures === 0 ? 0 : 1);
