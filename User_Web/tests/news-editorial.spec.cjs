/* Fixture browser test: actual article/list renderers + DS pipeline, no production/API AI. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ROOT = path.resolve(__dirname, '../..');
const evidenceDir = process.env.NEWS_EVIDENCE_DIR || '/private/tmp/iflux-news-browser-evidence';
fs.mkdirSync(evidenceDir, { recursive: true });
const requests = [];
const card = (id) => ({ id, slug:id, title:'Bài minh họa ' + id, excerpt:'Dữ liệu fixture kiểm tra giao diện.', tickers:['RELATED'], category_id:'cat', stats:{}, author:{display_name:'iFlux'}, published_at:'2026-10-13T01:00:00Z' });
const html = (kind) => `<!doctype html><html lang="vi" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/platform/web/generated/web.css"><link rel="stylesheet" href="/User_Web/iflux-web-ui/news.css"></head><body><header class="ifx-app-header"><span>iFlux · Kiểm thử fixture</span></header><main class="ifx-main ${kind === 'article' ? 'ifx-main--community-post' : 'ifx-main--community'}"><div ${kind === 'article' ? 'data-ifx-community-story' : 'data-ifx-community-feed'}></div></main></body></html>`;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/__test/article' || url.pathname === '/__test/group') { res.setHeader('Content-Type','text/html'); res.end(html(url.pathname.endsWith('article') ? 'article' : 'group')); return; }
  if (url.pathname === '/api/news/feed') {
    requests.push(Object.fromEntries(url.searchParams));
    const group = url.searchParams.get('related_group');
    const date = url.searchParams.get('group_by') === 'day';
    const second = !!url.searchParams.get('cursor');
    const cards = date ? Array.from({length:6},(_,i) => card((second ? 'previous-' : 'today-') + i)) : [card(group + '-a'),card(group + '-b')];
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify({ success:true, data:{ cards, has_more:date && !second, next_cursor:date && !second ? 'next-day' : null, section_date:date ? (second ? '2026-10-12' : '2026-10-13') : null } })); return;
  }
  const target = path.resolve(ROOT, '.' + decodeURIComponent(url.pathname));
  if (!target.startsWith(ROOT + path.sep) || !/\/(User_Web|design_system|patterns|platform|vendor|Admin_Design_system)\//.test(url.pathname)) { res.writeHead(404); res.end(); return; }
  fs.readFile(target, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    const mime = { '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.html':'text/html', '.woff2':'font/woff2' }[path.extname(target)] || 'application/octet-stream';
    res.setHeader('Content-Type', mime); res.end(data);
  });
});

async function script(page, name) { await page.addScriptTag({ url:'/User_Web/iflux-web-ui/' + name }); }
async function configure(page) {
  await page.evaluate(async () => {
    const { buildPageFrame } = await import('/User_Web/iflux-web-ui/runtime/app-shell.js');
    window.IfluxRuntimeSections = { buildPageFrame };
    window.IfluxBreakpoint = { isMobileShell: () => window.innerWidth <= 1024 };
    window.__fixtureNavContext = { entityType:'article' };
    window.IfluxAppShell = { getNavMode: () => 'PRIMARY', getBackHref: () => '/tin-tuc', detectContext: () => window.__fixtureNavContext,
      currentNavigationModel: () => null, getPrimaryNav: () => [{key:'news',label:'Tin tức',icon:'ti-news',href:'/tin-tuc'}] };
    window.IfluxRoutes = { to: () => '/tin-tuc' };
    window.IfluxSeoUrl = { PROD_ORIGIN:location.origin, parsePostRef:()=> 'fixture', postHref:p=>'/tin-tuc/bai-viet/'+p.slug, postCanonical:p=> location.origin + '/tin-tuc/bai-viet/' + p.slug, stockHref:t=>'/co-phieu/'+t,
      sectorHref:t=>'/nganh/'+t, ecosystemHref:t=>'/he-sinh-thai/'+t, commentsHrefFromLocation:()=>'/binh-luan/fixture' };
    window.IfluxNewsStore = { getPostById:()=>window.fixture, getPostBySlug:()=>window.fixture, bumpView:()=>{}, setFeed:()=>{}, getGroupPerformance:()=>null };
    window.IfluxInteractionStore = { initInteractive:()=>{}, loadThread:async()=>({ comments:[{ user_name:'Người đọc', body:'Bình luận fixture', created_at:new Date().toISOString() }] }) };
    window.IfluxMarketQuotes = { getQuotes:async()=>({}) };
    window.IfluxInteractionPresentationResolver = { resolve:()=> window.innerWidth<=1024 ? 'bottom-bar' : 'sidebar' };
  });
  await script(page,'block-templates.js'); await script(page,'news-ui.js'); await script(page,'iflux-news-api-bridge.js');
}

(async () => {
  await new Promise((resolve) => server.listen(0,'127.0.0.1',resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless:true, executablePath:process.env.CHROMIUM_PATH || undefined });
  try {
    for (const width of [1440,390]) {
      const page = await browser.newPage({ viewport:{width,height:900} });
      const errors = []; page.on('pageerror', e=>{errors.push(e.message); console.error('BROWSER',e.message)});
      await page.goto(origin + '/patterns/event-timeline/index.html');
      await page.waitForSelector('[data-ifx-template="TMP-STOCK-COMPARISON"]');
      await page.screenshot({ path:path.join(evidenceDir,'templates-' + width + '.png'), fullPage:true });
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'template overflow ' + width);
      await page.goto(origin + '/__test/article'); requests.length = 0;
      await configure(page);
      await page.evaluate(() => { window.fixture = { id:'fixture', slug:'fixture', title:'Bài viết kiểm thử cấu trúc iFlux', excerpt:'Đây là dữ liệu minh họa để kiểm tra giao diện, không phải tin thị trường.', status:'published', tickers:['AAA'], story_id:'story-fixture', category_id:'cat', stats:{comments:1}, author:{display_name:'Biên tập iFlux'},
        body_html:'<h2><a href="/co-phieu/AAA">Doanh nghiệp công bố kế hoạch</a></h2>' + '<p>Nội dung fixture dùng kiểm tra mục lục và hành vi tải theo nhu cầu.</p>'.repeat(70) + '<h2>Những diễn biến cần theo dõi</h2><p>Không suy ra kết quả khi chưa có bằng chứng.</p>',
        source_name:'CafeF', external_url:'https://cafef.vn/bai-nguon-fixture.chn',
        event_timeline:[{ title:'Công bố kế hoạch', subject_name:'Doanh nghiệp fixture', summary:'Một mốc đã có nguồn.', status:'planned', announced_on:'2026-10-01', occurred_on:'2026-10-02', effective_on:'2026-10-03', evidence:[{title:'Bài iFlux về hồ sơ này',label:'Bài iFlux về hồ sơ này',url:'/tin-tuc/bai-viet/ho-so-fixture',quote:'Nội dung nội bộ'},{title:'Tiêu đề bài nguồn fixture',label:'CafeF',url:'https://cafef.vn/bai-nguon-fixture.chn',quote:'Trích đoạn minh họa'}], metrics:[]}],
        comparison_data:{title:'So sánh minh họa',scope:{name:'Nhóm fixture'},as_of:'2026-10-13',unit:'lần',chart:true,rows:[{ticker:'AAA',value:0},{ticker:'BBB',value:-2},{ticker:'CCC',value:null}]} };
        document.addEventListener('iflux-context-ready', async () => {
          const { mountPublishedWidgets } = await import('/User_Web/iflux-web-ui/runtime/mount-published-widgets.js');
          const root = document.querySelector('[data-ifx-community-story]');
          await mountPublishedWidgets([
            { widgetId:'WGT-NEWS-EVENT-TIMELINE',host:root.querySelector('[data-news-event-timeline]'), data:fixture.event_timeline, artifact:{content:{title:'Diễn biến sự việc'},display:{renderSpec:{templateId:'TMP-EVENT-TIMELINE'}}} },
            { widgetId:'WGT-NEWS-STOCK-COMPARISON',host:root.querySelector('[data-news-comparison]'), data:fixture.comparison_data, artifact:{content:{title:'So sánh minh họa'},display:{renderSpec:{templateId:'TMP-STOCK-COMPARISON'}}} }
          ]);
        });
      });
      await script(page,'news-post-page.js'); await page.evaluate(()=>IfluxCommunityPostPage.init());
      await page.waitForSelector('.ifx-com-article__body');
      assert.equal(await page.locator('.ifx-com-article__author-meta').getByText('CafeF',{exact:true}).count(),1);
      assert.equal(await page.locator('.ifx-com-article__author-source a').getAttribute('href'),'https://cafef.vn/bai-nguon-fixture.chn');
      assert.equal(await page.locator('.ifx-com-article__author-meta').getByText(/Nguồn tham khảo|Hỗ trợ biên soạn/).count(),0);
      assert.equal(await page.locator('.ifx-com-article__author-meta').getByText('CafeF',{exact:true}).isVisible(),true);
      assert.equal(await page.locator('.ifx-com-article__body h2 a').count(),0);
      assert.equal(await page.locator('.ifx-com-article__body h2').first().textContent(),'Doanh nghiệp công bố kế hoạch');
      assert.equal(await page.locator('.ifx-event-timeline .ifx-timeline-meta').first().textContent(),'Diễn ra: 2/10/2026');
      assert.equal(await page.locator('.ifx-event-timeline .ifx-timeline-body small').first().textContent(),'Dự kiến · Công bố: 1/10/2026 · Hiệu lực: 3/10/2026');
      assert.equal(await page.locator('.ifx-event-timeline details').getByText('Bài iFlux về hồ sơ này',{exact:true}).count(),1);
      assert.equal(await page.locator('.ifx-event-timeline details a').first().getAttribute('href'),'/tin-tuc/bai-viet/ho-so-fixture');
      assert.equal(await page.locator('.ifx-event-timeline blockquote').count(),0);
      assert.equal(requests.length,0,'related must not eagerly load below article');
      await page.locator('.ifx-com-article__author').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(evidenceDir,'author-' + width + '.png')});
      assert.equal(await page.locator('.news-mobile-toc').isVisible(),width===390);
      assert.equal(await page.locator('.ifx-shell-sidebar').isVisible(),width===1440);
      const order = await page.locator('[data-ifx-related-group]').evaluateAll(nodes=>nodes.map(n=>n.dataset.ifxRelatedGroup));
      assert.deepEqual(order,['entity','topic','category']);
      if (width===390) {
        await page.waitForFunction(()=>document.querySelector('[data-ifx-com-comments-preview-list]').textContent.includes('Bình luận fixture'));
        assert.equal(await page.evaluate(()=>!!(document.querySelector('[data-ifx-com-comments-preview]').compareDocumentPosition(document.querySelector('[data-ifx-related-group]')) & Node.DOCUMENT_POSITION_FOLLOWING)),true);
        await page.evaluate(async () => {
          document.querySelector('body').classList.add('ifx-app');
          window.IfluxWebUI = window.IfluxWebUI || {};
          await new Promise(resolve => {
            const script = document.createElement('script'); script.src='/User_Web/iflux-web-ui/mobile-nav.js'; script.onload=resolve; document.body.appendChild(script);
          });
          const slot = IfluxWebUI.ensureArticleIxBottomSlot();
          const entities = document.querySelector('[data-ifx-ix-article-entities]');
          entities.innerHTML = '<a href="/co-phieu/AAA">AAA</a>';
          entities.removeAttribute('hidden');
          window.__fixtureNavContext = null; // AppShell can transiently lose context during URL-bar resize.
          window.dispatchEvent(new Event('resize'));
          if (!entities.isConnected || !entities.textContent.includes('AAA') || !slot.isConnected) throw new Error('Article entity chips were cleared by mobile nav resize');
        });
        assert.equal(await page.locator('[data-ifx-ix-article-entities]').textContent(),'AAA');
        assert.equal(await page.locator('#ifx-tabbar').getAttribute('data-ifx-tabbar-mode'),'article');
      }
      for (const group of order) { await page.locator('[data-ifx-related-group="'+group+'"]').scrollIntoViewIfNeeded(); await page.waitForSelector('[data-ifx-related-group="'+group+'"] .ifx-com-post'); }
      if (width===390) {
        await page.waitForTimeout(30);
        assert.equal(await page.locator('[data-ifx-ix-article-entities]').textContent(),'AAA', 'related card quote hydration must not replace current article entities');
      }
      await page.waitForSelector('[data-ifx-template="TMP-EVENT-TIMELINE"]');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'article overflow ' + width);
      assert.equal(await page.locator('.ifx-com-related-feed').count(),3);
      await page.locator('[data-news-event-timeline]').screenshot({path:path.join(evidenceDir,'timeline-'+width+'.png')});
      assert.deepEqual(errors,[]);

      await page.goto(origin + '/__test/group?view=group&related_to=fixture&related_group=entity'); requests.length=0;
      await configure(page);
      // Test the real shared header Back implementation independently of unrelated shell services.
      const core = fs.readFileSync(path.join(ROOT,'User_Web/iflux-web-ui/iflux-web-ui.js'),'utf8');
      const start = core.indexOf('  function initContextBack()'); const end = core.indexOf('  initContextBack();',start);
      await page.addScriptTag({content:'function ifxIsMobileShell(){return IfluxBreakpoint.isMobileShell()} function syncTopnavActiveHeight(){} function appNavigate(href){location.href=href} '+core.slice(start,end)+'initContextBack();'});
      await script(page,'news-daily-feed.js'); await script(page,'news-page.js'); await page.evaluate(()=>IfluxNewsPage.init());
      await page.waitForSelector('[data-ifx-date-section]');
      assert.equal(await page.locator('[data-ifx-context-back]').isVisible(),true,'Back visible on desktop/mobile');
      assert.equal(await page.locator('.ifx-shell-sidebar').count(),0,'simple list has no unrelated sidebar');
      assert.equal(await page.locator('[data-ifx-com-experts-sibling]').count(),0);
      await page.locator('[data-ifx-date-more]').click();
      await page.waitForFunction(()=>document.querySelectorAll('[data-ifx-date-section]').length===2);
      assert.ok(requests.every(r=>r.related_group==='entity' && r.group_by==='day'));
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.screenshot({path:path.join(evidenceDir,'date-list-'+width+'.png')});
      await page.locator('[data-ifx-context-back]').click(); await page.waitForURL('**/__test/article');
      await page.close();
    }
    console.log('PASS: template preview/pipeline, desktop/mobile TOC/comments, lazy related groups, date list and Header Back. Evidence: '+evidenceDir);
  } finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(err=>{ console.error(err); server.close(); process.exitCode=1; });
