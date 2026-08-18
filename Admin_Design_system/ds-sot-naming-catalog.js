/* iFlux DS — Naming Convention = TRANG đầu trong mỗi MODULE */
(function (global) {
  'use strict';
  if (global.IfluxDsNamingCatalog) return;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function rule(id, o) {
    return {
      id: id,
      name: o.name,
      value: o.value != null ? String(o.value) : '',
      previewType: o.previewType || 'naming-pattern',
      previewGood: o.previewGood || '',
      previewBad: o.previewBad || '',
      property: o.property || 'Rule',
      summaryMultiline: !!o.multiline,
      assetKind: 'naming',
      variable: o.variable || ('naming.' + id),
      status: 'ok',
      note: o.note || ''
    };
  }

  function grp(title, items) {
    return { title: title, groupKind: 'naming', items: items };
  }

  /** TRANG Naming Convention — MODULE 01 Foundations */
  function buildFoundationNamingPage() {
    return {
      id: 'foundation-naming',
      file: 'Naming Convention',
      path: 'foundation/naming-convention',
      layer: 'foundation',
      pageTier: 'naming',
      moduleOrder: 1,
      showScope: false,
      groups: [
        grp('01 · GENERAL NAMING PRINCIPLES', [
          rule('gen-1', { name: 'Mô tả đúng bản chất', value: 'Tên phản ánh vai trò / domain, không theo UI tạm thời', previewType: 'naming-icon', previewGood: 'ti ti-check' }),
          rule('gen-2', { name: 'Không viết tắt tuỳ tiện', value: 'Chỉ viết tắt nếu là chuẩn ngành (PnL, NAV, API…)', previewType: 'naming-icon', previewGood: 'ti ti-check' }),
          rule('gen-3', { name: 'Không đặt theo màu / vị trí UI', value: 'Tránh BlueButton, TopBox, LeftPanel', previewType: 'naming-goodbad', previewGood: 'PrimaryButton', previewBad: 'BlueButton' }),
          rule('gen-4', { name: 'Không đánh số thứ tự', value: 'Tránh Card1, Btn2, ComponentA', previewType: 'naming-goodbad', previewGood: 'StockCard', previewBad: 'Card1' }),
          rule('gen-5', { name: 'Một khái niệm — một tên', value: 'SignalBadge luôn là SignalBadge, không đổi alias tuỳ page', previewType: 'naming-icon', previewGood: 'ti ti-tag' }),
          rule('gen-6', { name: 'Ví dụ đúng / sai', value: 'PrimaryButton · StockCard · NewsCard · SignalBadge', previewType: 'naming-goodbad', previewGood: 'StockCard', previewBad: 'Btn · Box' })
        ]),
        grp('02 · FILE NAMING', [
          rule('file-stack', { name: '⚠ iFlux stack hiện tại', value: 'kebab-case cho .html · .css · .js · .json', previewType: 'naming-pattern', previewGood: 'stock-card.css' }),
          rule('file-good', { name: 'File đúng (web)', value: 'kebab-case + đuôi chuẩn', previewType: 'naming-goodbad', previewGood: 'money-flow-chart.js', previewBad: 'button-new.tsx' }),
          rule('file-react', { name: 'File React/TS (tương lai)', value: 'PascalCase.tsx khi chuyển component framework', previewType: 'naming-pattern', previewGood: 'StockCard.tsx' })
        ]),
        grp('03 · FOLDER NAMING', [
          rule('folder-rule', { name: 'Thư mục module', value: 'lowercase-kebab', previewType: 'naming-pattern', previewGood: 'business-objects/' }),
          rule('folder-good', { name: 'Ví dụ đúng / sai', value: 'atoms/ · widgets/ · design-tokens/', previewType: 'naming-goodbad', previewGood: 'design-tokens/', previewBad: 'ButtonFolder' })
        ]),
        grp('04 · COMPONENT NAMING', [
          rule('comp-rule', { name: 'Component', value: 'PascalCase · Danh từ hoặc Tính từ + Danh từ', previewType: 'naming-pattern', previewGood: 'MoneyFlowPanel' }),
          rule('comp-good', { name: 'Ví dụ domain iFlux', value: 'StockCard · HeatmapWidget · PortfolioTable', previewType: 'naming-goodbad', previewGood: 'StockCard', previewBad: 'StockNew · Layout2' }),
          rule('comp-class-bridge', { name: 'Map sang CSS class', value: 'PascalCase → kebab: StockCard → .ifx-stock-card', previewType: 'naming-pattern', previewGood: '.ifx-stock-card' })
        ]),
        grp('05 · PROPS / ATTRIBUTES', [
          rule('props-rule', { name: 'Props & data-*', value: 'camelCase', previewType: 'naming-pattern', previewGood: 'fullWidth · data-widget-id' }),
          rule('props-ok', { name: 'Thuộc tính chuẩn', value: 'variant · size · status · disabled · loading · selected', previewType: 'naming-chip', previewGood: 'variant,size,status' }),
          rule('props-bad', { name: 'Tránh', value: 'btnType · isDisable · loadingState · kind', previewType: 'naming-goodbad', previewGood: 'disabled', previewBad: 'isDisable' })
        ]),
        grp('06 · EVENT NAMING', [
          rule('evt-rule', { name: 'Handler prefix', value: 'on + PascalCase event', previewType: 'naming-pattern', previewGood: 'onClick · onLoadMore' }),
          rule('evt-ok', { name: 'Ví dụ', value: 'onChange · onSubmit · onSelect · onExpand · onRefresh', previewType: 'naming-chip', previewGood: 'onChange,onSubmit' }),
          rule('evt-bad', { name: 'Tránh', value: 'click · handleClick · callback', previewType: 'naming-goodbad', previewGood: 'onClick', previewBad: 'handleClick' })
        ]),
        grp('07 · CSS CLASS NAMING', [
          rule('css-prefix', { name: '⚠ Prefix theo surface', value: 'Admin: ix-* · User Web: ifx-*', previewType: 'naming-goodbad', previewGood: 'ifx-card', previewBad: 'ds-button' }),
          rule('css-user', { name: 'User Web class', value: 'ifx-{block}-{element}', previewType: 'naming-pattern', previewGood: 'ifx-stock-card · ifx-moneyflow' }),
          rule('css-admin', { name: 'Admin class', value: 'ix-{component}', previewType: 'naming-pattern', previewGood: 'ix-btn · ix-card · ix-sidebar' })
        ]),
        grp('08 · CSS VARIABLES', [
          rule('var-rule', { name: 'Token CSS var', value: '--ifx-{category}-{name}-{scale?}', previewType: 'naming-pattern', previewGood: '--ifx-color-slate-500' }),
          rule('fs-scale', { name: 'Font size primitive', value: '--ifx-fs-100 … --ifx-fs-900 (100=nhỏ nhất, 900=lớn nhất)', previewType: 'naming-pattern', previewGood: '--ifx-fs-400' }),
          rule('var-ok', { name: 'Ví dụ đúng', value: '--ifx-spacing-md · --ifx-radius-lg · --ifx-fs-700', previewType: 'naming-chip', previewGood: '--ifx-fs-400' }),
          rule('var-bad', { name: 'Tránh', value: '--blue · --main · --space8', previewType: 'naming-goodbad', previewGood: '--ifx-color-primary', previewBad: '--blue' })
        ]),
        grp('09 · DESIGN TOKEN NAMING (4 tầng)', [
          rule('tok-l1', { name: 'L1 Primitive', value: 'color.slate.500 · fs.400 · spacing.16', previewType: 'naming-pattern', previewGood: 'fs.400' }),
          rule('tok-l1-css', { name: 'L1 → CSS var', value: '--ifx-color-slate-500 · --ifx-fs-400', previewType: 'naming-pattern', previewGood: '--ifx-fs-400' }),
          rule('tok-l2', { name: 'L2 Semantic', value: 'text.primary · surface.default · border.focus', previewType: 'naming-pattern', previewGood: 'text.primary' }),
          rule('tok-l3', { name: 'L3 Component', value: 'button.primary.background · card.padding', previewType: 'naming-pattern', previewGood: 'card.padding' }),
          rule('tok-l4', { name: 'L4 Business (iFlux)', value: 'market.price.up · moneyflow.in · signal.buy', previewType: 'naming-chip', previewGood: 'market.price.up' })
        ]),
        grp('10 · ICON NAMING', [
          rule('icon-rule', { name: 'Pattern', value: 'category-action hoặc domain-action (kebab-case)', previewType: 'naming-pattern', previewGood: 'stock-buy · market-open' }),
          rule('icon-ok', { name: 'Ví dụ iFlux', value: 'user-add · portfolio-profit · community-like', previewType: 'naming-chip', previewGood: 'community-like' }),
          rule('icon-bad', { name: 'Tránh', value: 'icon1 · user2 · buygreen', previewType: 'naming-goodbad', previewGood: 'stock-sell', previewBad: 'buygreen' })
        ]),
        grp('11 · BUSINESS OBJECT NAMING', [
          rule('bo-rule', { name: 'Entity', value: 'Danh từ số ít · PascalCase trong code', previewType: 'naming-pattern', previewGood: 'Stock · Portfolio · Watchlist' }),
          rule('bo-list', { name: 'Domain iFlux', value: 'Stock · Holding · Sector · Article · Signal · Workspace · Membership', previewType: 'naming-chip', previewGood: 'Stock,Signal,Membership' }),
          rule('bo-bad', { name: 'Tránh', value: 'Stocks · UsersList · Articles', previewType: 'naming-goodbad', previewGood: 'Watchlist', previewBad: 'Stocks' })
        ]),
        grp('12 · API / JSON NAMING', [
          rule('api-rule', { name: 'JSON field', value: 'camelCase', previewType: 'naming-pattern', previewGood: 'marketCap · percentChange' }),
          rule('api-ok', { name: 'Ví dụ domain', value: 'moneyFlow · foreignBuy · averageVolume · priceChange', previewType: 'naming-chip', previewGood: 'moneyFlow' }),
          rule('api-bad', { name: 'Tránh', value: 'market_cap · MarketCap · MARKET_CAP', previewType: 'naming-goodbad', previewGood: 'marketCap', previewBad: 'market_cap' })
        ])
      ]
    };
  }

  /** TRANG Naming Convention — MODULE 02 Design Tokens */
  function buildTokenNamingPage() {
    return {
      id: 'token-naming',
      file: 'Naming Convention',
      path: 'design-tokens/naming-convention',
      layer: 'token',
      pageTier: 'naming',
      moduleOrder: 1,
      showScope: false,
      groups: [
        grp('NAMING · SEMANTIC TOKENS', [
          rule('tok-var-rule', { name: 'Semantic CSS var', value: '--color-{role} hoặc --radius-{context}', previewType: 'naming-pattern', previewGood: '--color-text-primary' }),
          rule('tok-ref-rule', { name: 'Reference → Foundation', value: 'var(--ifx-...) trỏ về L1 primitive', previewType: 'naming-pattern', previewGood: 'var(--ifx-color-slate-200)' }),
          rule('tok-l2', { name: 'L2 Semantic', value: 'text.primary · surface.default · border.focus', previewType: 'naming-pattern', previewGood: 'text.primary' }),
          rule('tok-l3', { name: 'L3 Component', value: 'button.primary.background · card.padding', previewType: 'naming-pattern', previewGood: 'card.padding' }),
          rule('tok-l4', { name: 'L4 Business (iFlux)', value: 'market.price.up · biz-signal-confirmed', previewType: 'naming-chip', previewGood: 'market.price.up' }),
          rule('tok-layer', { name: '4 tầng token', value: 'L1 Primitive → L2 Semantic → L3 Component → L4 Business', previewType: 'naming-icon', previewGood: 'ti ti-layers-intersect' }),
          rule('tok-bad', { name: 'Tránh semantic lệch', value: '--main-text · --bg1 · hardcode hex ở L2', previewType: 'naming-goodbad', previewGood: '--color-text-primary', previewBad: '--main-text' })
        ])
      ]
    };
  }

  global.IfluxDsNamingCatalog = {
    esc: esc,
    buildFoundationNamingPage: buildFoundationNamingPage,
    buildTokenNamingPage: buildTokenNamingPage
  };
})(window);
