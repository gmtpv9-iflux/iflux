/* iFlux DS — Items (business composites · 2–6 atoms · fixed structure) · GĐ1 */
(function (global) {
  'use strict';
  if (global.IfluxDsItemsCatalog) return;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function pr(key, refKind, token, variable, propType) {
    return { key: key, refKind: refKind || 'primitive', token: token, variable: variable || '', property: propType || key };
  }

  function sem(key, logicalId, variable) {
    return pr(key, 'semantic', logicalId, variable, key === 'color' || key === 'background' || key === 'border-color' ? 'color' : key);
  }

  function prim(key, token, variable, propType) {
    return pr(key, 'primitive', token, variable, propType || key);
  }

  function slot(id, label, atomLogicalId, atomClass) {
    return { id: id, label: label, atom: atomLogicalId || '', atomClass: atomClass || '' };
  }

  function item(id, name, logicalId, className, surface, previewType, slots, properties, opts) {
    opts = opts || {};
    return {
      id: id,
      name: name,
      logicalId: logicalId,
      className: className,
      surface: surface || 'user',
      previewType: previewType || 'generic',
      slots: slots || [],
      anatomy: opts.anatomy || '',
      file: opts.file || 'market-components.css',
      note: opts.note || '',
      properties: properties || []
    };
  }

  function layoutProps(extra) {
    var base = [
      prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
      prim('padding-y', 'space-12', '--ifx-item-py', 'spacing'),
      prim('padding-x', 'space-12', '--ifx-item-px', 'spacing'),
      prim('min-height', 'space-44', '--ifx-item-min-h', 'spacing')
    ];
    return extra ? base.concat(extra) : base;
  }

  function buildGroups() {
    return [
      {
        title: 'Market Data',
        note: 'Dòng dữ liệu thị trường · không phải lệnh giao dịch',
        items: [
          item('stock-row', 'Stock Row', 'item.market.stock-row', 'ifx-stock-row', 'user', 'stock-row', [
            slot('ticker', 'Ticker', 'text.body', 'ifx-stock-row__ticker'),
            slot('name', 'Company name', 'text.muted', 'ifx-stock-row__name'),
            slot('badges', 'Badges', 'chip.outline', 'ifx-stock-row__badges'),
            slot('price', 'Price', 'financial.price.m', 'ifx-stock-row__price'),
            slot('change', 'Change %', 'financial.percent.up', 'ifx-stock-row__chg'),
            slot('volume', 'Volume', 'financial.volume', 'ifx-stock-row__vol')
          ], layoutProps([
            prim('grid-gap-x', 'space-8', '--ifx-item-grid-gap-x', 'spacing')
          ]), {
            file: 'market-components.css',
            anatomy: 'ticker · name · badges\n└── price · change · volume'
          }),
          item('stock-row-wrap', 'Stock Row Wrap', 'item.market.stock-row-wrap', 'ifx-stock-row-wrap', 'user', 'stock-row-wrap', [
            slot('row', 'Stock row', 'item.market.stock-row', 'ifx-stock-row'),
            slot('badges-row', 'Badge strip', 'chip.outline', 'ifx-stock-row__badges-row'),
            slot('alert', 'Alert btn', 'button.icon', 'ifx-stock-row__alert'),
            slot('follow', 'Follow btn', 'button.icon', 'ifx-follow')
          ], layoutProps(), { file: 'watchlist.css', anatomy: 'dòng 1: tên · % · vol\ndòng 2: trạng thái · chuông · theo dõi' }),
          item('market-metric', 'Index Metric', 'item.market.index-metric', 'ifx-market-header__metric', 'user', 'market-metric', [
            slot('label', 'Label', 'label.caption', 'ifx-market-header__label'),
            slot('value', 'Value', 'financial.price.m', 'ifx-market-header__val')
          ], [
            prim('gap', 'space-4', '--ifx-item-gap', 'spacing'),
            prim('padding-y', 'space-8', '--ifx-item-py', 'spacing'),
            prim('padding-x', 'space-12', '--ifx-item-px', 'spacing'),
            prim('radius', 'radius-md', '--ix-radius', 'radius'),
            sem('background', 'surface.card', '--ifx-item-bg'),
            sem('border-color', 'border.default', '--ifx-item-border'),
            sem('color-up', 'market.price.up', '--ifx-item-metric-up'),
            sem('color-down', 'market.price.down', '--ifx-item-metric-down')
          ], { file: 'market-components.css', anatomy: 'label\n└── value' }),
          item('sector-card', 'Sector Card', 'item.market.sector-card', 'ifx-sector-card', 'user', 'sector-card', [
            slot('head', 'Head row', 'text.body', 'ifx-sector-card__head'),
            slot('name', 'Sector name', 'text.body', 'ifx-sector-card__name'),
            slot('rank', 'Rank badge', 'badge.info', 'ifx-sector-card__rank'),
            slot('metrics', 'Metrics', 'financial.price.m', 'ifx-sector-card__metrics')
          ], layoutProps([
            prim('radius', 'radius-lg', '--ix-radius-lg', 'radius'),
            sem('background', 'surface.card', '--ifx-item-bg'),
            sem('border-color', 'border.default', '--ifx-item-border')
          ]), { file: 'market-components.css', anatomy: 'head (name · rank)\n└── metrics' }),
          item('sector-metric', 'Sector Metric Cell', 'item.market.sector-metric', 'ifx-sector-card__metric', 'user', 'sector-metric', [
            slot('label', 'Caption', 'label.caption', 'span'),
            slot('value', 'Value', 'financial.price.m', 'strong')
          ], [
            prim('gap', 'space-4', '--ifx-item-gap', 'spacing'),
            sem('color-up', 'market.price.up', '--ifx-item-metric-up'),
            sem('color-down', 'market.price.down', '--ifx-item-metric-down')
          ], { file: 'market-components.css', anatomy: 'label\n└── value' }),
          item('price-cell', 'Price Change Cell', 'item.market.price-cell', 'ifx-item-price-cell', 'user', 'price-cell', [
            slot('price', 'Price', 'financial.price.m', 'ifx-typo-price-m'),
            slot('change', 'Change %', 'financial.percent.up', 'ifx-typo-percent-up')
          ], [
            prim('gap', 'space-4', '--ifx-item-gap', 'spacing'),
            prim('align', 'space-8', '--ifx-item-align', 'spacing')
          ], { file: 'market-components.css', anatomy: 'price\n└── change' }),
          item('degraded-banner', 'Degraded Banner', 'item.market.degraded-banner', 'ifx-degraded-banner', 'user', 'status-banner', [
            slot('icon', 'Icon', 'icon.alert', 'ti-alert-triangle'),
            slot('message', 'Message', 'text.body', 'span')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
            prim('padding-y', 'space-8', '--ifx-item-py', 'spacing'),
            prim('padding-x', 'space-14', '--ifx-item-px', 'spacing'),
            sem('background', 'status.warning.soft', '--ifx-item-bg'),
            sem('color', 'status.warning', '--ifx-item-color')
          ], { file: 'market-components.css', anatomy: 'icon · message' })
        ]
      },
      {
        title: 'Money Flow',
        note: 'Dòng tiền · thống kê mua/bán ròng',
        items: [
          item('flow-panel', 'Flow Panel Row', 'item.flow.panel', 'ifx-flow-panel', 'user', 'flow-panel', [
            slot('label', 'Subject', 'text.body', 'ifx-flow-panel__label'),
            slot('net', 'Net flow', 'financial.money', 'ifx-flow-panel__net'),
            slot('bar', 'Flow bar', 'item.flow.bar', 'ifx-flow-bar')
          ], layoutProps([
            sem('border-color', 'border.default', '--ifx-item-border')
          ]), { file: 'market-components.css', anatomy: 'head (label · net)\n└── bar' }),
          item('flow-bar', 'Flow Bar', 'item.flow.bar', 'ifx-flow-bar', 'user', 'flow-bar', [
            slot('buy', 'Buy side', 'status.success', 'ifx-flow-bar__buy'),
            slot('sell', 'Sell side', 'status.error', 'ifx-flow-bar__sell')
          ], [
            prim('height', 'space-8', '--ifx-item-bar-h', 'spacing'),
            prim('radius', 'radius-sm', '--ifx-item-bar-radius', 'radius'),
            sem('track', 'surface.input', '--ifx-item-bar-track')
          ], { file: 'market-components.css', anatomy: 'buy | sell' }),
          item('flow-net', 'Net Flow Value', 'item.flow.net', 'ifx-flow-panel__net', 'user', 'flow-net', [
            slot('value', 'Amount', 'financial.money', 'span'),
            slot('direction', 'Direction', 'financial.percent.up', 'span.is-up')
          ], [
            prim('font-size', 'fs-200', '--ifx-font-size-12', 'font-size'),
            sem('color-up', 'market.price.up', '--ifx-item-metric-up'),
            sem('color-down', 'market.price.down', '--ifx-item-metric-down')
          ], { file: 'market-components.css', anatomy: 'value (direction)' })
        ]
      },
      {
        title: 'Tin tức',
        items: [
          item('com-author', 'Post Author', 'item.news.author', 'ifx-com-article__author', 'user', 'com-author', [
            slot('avatar', 'Avatar', 'avatar.sm', 'ifx-com-card__avatar'),
            slot('name', 'Name', 'text.body', 'ifx-profile-link'),
            slot('tier', 'Membership', 'financial.tier.premium', 'ix-chip')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
            prim('font-size', 'fs-100', '--ifx-font-size-10', 'font-size'),
            sem('color', 'text.muted', '--ifx-item-color')
          ], { file: 'news.css', anatomy: 'avatar · name · tier (bài chi tiết — không trên feed card)' }),
          item('com-title-row', 'Post Title Row', 'item.news.title-row', 'ifx-com-post__title-row', 'user', 'com-title', [
            slot('time', 'Time', 'label.caption', 'ifx-com-post__time'),
            slot('sep', 'Separator', 'text.muted', 'ifx-com-post__title-sep'),
            slot('title', 'Title', 'text.body', 'ifx-com-post__title-text')
          ], [
            prim('gap', 'space-4', '--ifx-item-gap', 'spacing'),
            prim('font-size', 'feed-card-title', '--ifx-com-feed-card-title-size', 'font-size'),
            prim('line-clamp', 'feed-card-title-lines', '--ifx-com-feed-card-title-lines', 'line-clamp')
          ], { file: 'news.css', anatomy: 'time · sep · title (clamp 3 · 15px)' }),
          item('com-stats', 'Engagement Stats', 'item.news.stats', 'ifx-com-post__stats', 'user', 'com-stats', [
            slot('likes', 'Likes', 'text.muted', 'span'),
            slot('comments', 'Comments', 'text.muted', 'span'),
            slot('shares', 'Shares', 'text.muted', 'span')
          ], [
            prim('gap', 'space-14', '--ifx-item-gap', 'spacing'),
            prim('font-size', 'feed-card-stats', '--ifx-com-feed-card-stats-size', 'font-size'),
            sem('color', 'text.muted', '--ifx-item-color')
          ], { file: 'news.css', anatomy: 'likes · comments · shares (12px)' }),
          item('com-story-rank', 'Story Rank Row', 'item.news.story-rank', 'ifx-com-story-rank', 'user', 'story-rank', [
            slot('rank', 'Rank #', 'badge.info', 'ifx-com-story-rank__num'),
            slot('title', 'Story title', 'text.body', 'ifx-com-story-rank__title'),
            slot('sub', 'Meta', 'text.muted', 'ifx-com-story-rank__sub'),
            slot('heart', 'Reaction', 'button.icon', 'ifx-com-story-rank__heart')
          ], layoutProps(), { file: 'news.css', anatomy: 'rank · body (title · sub) · heart' }),
          item('com-topwl-row', 'Top Watchlist Row', 'item.news.topwl-row', 'ifx-com-topwl-row', 'user', 'topwl-row', [
            slot('rank', 'Rank', 'text.body', 'ifx-com-topwl-rank'),
            slot('user', 'User link', 'item.news.author', 'ifx-com-topwl-user'),
            slot('perf', 'Performance', 'financial.percent.up', 'ifx-com-topwl-perf')
          ], layoutProps(), { file: 'news.css', anatomy: 'rank · user · performance' }),
          item('com-follow', 'Follow Action', 'item.news.follow', 'ifx-com-follow-row', 'user', 'follow-row', [
            slot('avatar', 'Avatar', 'avatar.md', 'ix-avatar'),
            slot('name', 'Display name', 'text.body', 'span'),
            slot('action', 'Follow btn', 'button.outline', 'ix-btn')
          ], layoutProps(), { file: 'news.css', anatomy: 'avatar · name · action' })
        ]
      },
      {
        title: 'User & Account',
        items: [
          item('profile-timeline', 'Timeline Item', 'item.user.timeline', 'ifx-profile-timeline__item', 'user', 'timeline', [
            slot('dot', 'Rail dot', 'dot.status', 'ifx-profile-timeline__dot'),
            slot('ctx', 'Context', 'text.link', 'ifx-profile-timeline__ctx'),
            slot('time', 'Timestamp', 'label.caption', 'ifx-profile-timeline__time'),
            slot('card', 'Content card', 'surface.card', 'ifx-profile-timeline__card')
          ], [
            prim('gap', 'space-16', '--ifx-item-gap', 'spacing'),
            prim('padding-bottom', 'space-24', '--ifx-item-pb', 'spacing')
          ], { file: 'profile.css', anatomy: 'rail (dot)\n└── body (ctx · time · card)' }),
          item('profile-empty', 'Profile Empty', 'item.user.empty', 'ifx-profile-empty', 'user', 'empty', [
            slot('icon', 'Icon', 'icon.empty', 'ti-inbox'),
            slot('message', 'Message', 'text.muted', 'span')
          ], [
            prim('padding-y', 'space-40', '--ifx-item-py', 'spacing'),
            sem('color', 'text.muted', '--ifx-item-color')
          ], { file: 'profile.css', anatomy: 'icon\n└── message' }),
          item('membership-row', 'Membership Row', 'item.user.membership', 'ifx-item-membership-row', 'user', 'membership', [
            slot('avatar', 'Avatar', 'avatar.md', 'ix-avatar'),
            slot('name', 'Name', 'text.body', 'span'),
            slot('tier', 'Tier chip', 'financial.tier.premium', 'ix-chip')
          ], layoutProps(), { file: 'profile.css', anatomy: 'avatar · name · tier' }),
          item('notification-row', 'Notification Row', 'item.user.notification', 'ix-list-item', 'shared', 'notification', [
            slot('icon', 'Icon', 'icon.bell', 'ti-bell'),
            slot('title', 'Title', 'text.body', 'span'),
            slot('time', 'Time', 'label.caption', 'span'),
            slot('badge', 'Unread', 'badge.info', 'ix-badge')
          ], layoutProps(), { file: 'components.css', anatomy: 'icon · title · time · badge' }),
          item('wallet-summary', 'Wallet Summary', 'item.user.wallet', 'ifx-item-wallet', 'user', 'wallet', [
            slot('label', 'Label', 'label.caption', 'span'),
            slot('balance', 'Balance', 'financial.money', 'ifx-typo-money'),
            slot('action', 'Action', 'button.ghost', 'ix-btn')
          ], layoutProps(), { file: 'profile.css', anatomy: 'label · balance · action' }),
          item('online-status', 'Online Status', 'item.user.online', 'ifx-item-online', 'user', 'online', [
            slot('dot', 'Status dot', 'dot.status', 'ix-status-dot'),
            slot('label', 'Label', 'text.muted', 'span')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
            sem('color-online', 'status.success', '--ifx-item-online'),
            sem('color-offline', 'text.muted', '--ifx-item-offline')
          ], { file: 'profile.css', anatomy: 'dot · label' })
        ]
      },
      {
        title: 'News & Content',
        items: [
          item('article-meta', 'Article Meta', 'item.news.meta', 'ifx-com-article__meta', 'user', 'article-meta', [
            slot('source', 'Source', 'text.body', 'span'),
            slot('time', 'Published', 'label.caption', 'span'),
            slot('read', 'Read time', 'label.caption', 'span')
          ], [
            prim('gap', 'space-12', '--ifx-item-gap', 'spacing'),
            prim('font-size', 'fs-100', '--ifx-font-size-10', 'font-size'),
            sem('color', 'text.muted', '--ifx-item-color')
          ], { file: 'news.css', anatomy: 'source · time · read-time' }),
          item('tag-list', 'Tag List', 'item.news.tags', 'ifx-com-post__tags', 'user', 'tag-list', [
            slot('tags', 'Hashtags', 'chip.outline', 'ix-chip'),
            slot('ticker', 'Related stock', 'chip.info', 'ix-chip')
          ], [
            prim('gap', 'space-4', '--ifx-item-gap', 'spacing')
          ], { file: 'news.css', anatomy: 'tags* · ticker*' }),
          item('breaking-badge', 'Breaking Badge', 'item.news.breaking', 'ifx-item-breaking', 'user', 'breaking', [
            slot('badge', 'Badge', 'badge.danger', 'ix-badge'),
            slot('label', 'Label', 'text.body', 'span')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
            sem('background', 'status.error', '--ifx-item-bg'),
            sem('color', 'text.on.danger', '--ifx-item-color')
          ], { file: 'news.css', anatomy: 'badge · label' }),
          item('hot-badge', 'Hot Badge', 'item.news.hot', 'ifx-item-hot', 'user', 'hot', [
            slot('badge', 'Badge', 'badge.warning', 'ix-badge'),
            slot('label', 'Label', 'text.body', 'span')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
            sem('background', 'status.warning.soft', '--ifx-item-bg'),
            sem('color', 'status.warning', '--ifx-item-color')
          ], { file: 'news.css', anatomy: 'badge · label' }),
          item('category-chip', 'Category Chip', 'item.news.category', 'ifx-item-category', 'user', 'category', [
            slot('chip', 'Category', 'chip.outline', 'ix-chip')
          ], [
            prim('font-size', 'fs-100', '--ifx-font-size-10', 'font-size')
          ], { file: 'news.css', anatomy: 'chip' })
        ]
      },
      {
        title: 'Insights & Analysis',
        note: 'Phân tích · xu hướng · không khuyến nghị lệnh',
        items: [
          item('insight-trend', 'Trend View', 'item.insight.trend', 'ifx-item-trend', 'user', 'insight-trend', [
            slot('icon', 'Direction', 'icon.trend', 'ti-trending-up'),
            slot('label', 'View label', 'text.body', 'span'),
            slot('chip', 'Tag', 'chip.info', 'ix-chip')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
            sem('color-bull', 'market.price.up', '--ifx-item-bull'),
            sem('color-bear', 'market.price.down', '--ifx-item-bear')
          ], { file: 'foundation/share-action.css', anatomy: 'icon · label · chip' }),
          item('insight-confidence', 'Confidence Meter', 'item.insight.confidence', 'ifx-item-confidence', 'user', 'confidence', [
            slot('label', 'Label', 'label.caption', 'span'),
            slot('value', 'Score', 'text.body', 'strong'),
            slot('bar', 'Progress', 'progress.bar', 'ix-progress')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
            sem('fill', 'action.primary', '--ifx-item-progress')
          ], { file: 'foundation/share-action.css', anatomy: 'label · value\n└── bar' }),
          item('insight-scenario', 'Scenario Tag', 'item.insight.scenario', 'ifx-item-scenario', 'user', 'scenario', [
            slot('chip', 'Scenario', 'chip.outline', 'ix-chip'),
            slot('desc', 'Description', 'text.muted', 'span')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing')
          ], { file: 'foundation/share-action.css', anatomy: 'chip · desc' }),
          item('insight-risk', 'Risk Level', 'item.insight.risk', 'ifx-item-risk', 'user', 'risk', [
            slot('label', 'Risk label', 'text.body', 'span'),
            slot('level', 'Level chip', 'badge.warning', 'ix-badge')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
            sem('color', 'status.warning', '--ifx-item-color')
          ], { file: 'foundation/share-action.css', anatomy: 'label · level' }),
          item('insight-framework', 'Analysis Framework', 'item.insight.framework', 'ifx-item-framework', 'user', 'framework', [
            slot('icon', 'Icon', 'icon.chart', 'ti-chart-dots'),
            slot('name', 'Framework', 'text.body', 'span')
          ], layoutProps(), { file: 'foundation/share-action.css', anatomy: 'icon · name' }),
          item('insight-ref-price', 'Reference Level', 'item.insight.ref-price', 'ifx-item-ref-price', 'user', 'ref-price', [
            slot('label', 'Label', 'label.caption', 'span'),
            slot('value', 'Level', 'financial.price.m', 'ifx-typo-price-m')
          ], [
            prim('gap', 'space-4', '--ifx-item-gap', 'spacing'),
            sem('color', 'text.secondary', '--ifx-item-color')
          ], { file: 'foundation/share-action.css', anatomy: 'label\n└── value' })
        ]
      },
      {
        title: 'AI',
        items: [
          item('ai-summary', 'AI Summary Line', 'item.ai.summary', 'ifx-insight-card__summary', 'user', 'ai-summary', [
            slot('icon', 'AI icon', 'icon.sparkle', 'ti-sparkles'),
            slot('text', 'Summary', 'text.body', 'p')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
            prim('font-size', 'fs-300', '--ifx-font-size-14', 'font-size'),
            sem('color', 'text.secondary', '--ifx-item-color')
          ], { file: 'foundation/share-action.css', anatomy: 'icon · text', note: 'Slot trong ifx-insight-card (share modal) · Product rename insight widget: TBD · ≠ Dashboard WGT-*' }),
          item('ai-score', 'AI Score', 'item.ai.score', 'ifx-item-ai-score', 'user', 'ai-score', [
            slot('label', 'Label', 'label.caption', 'span'),
            slot('score', 'Score', 'text.body', 'strong'),
            slot('badge', 'Grade', 'badge.info', 'ix-badge')
          ], layoutProps(), { file: 'foundation/share-action.css', anatomy: 'label · score · badge' }),
          item('ai-confidence', 'AI Confidence', 'item.ai.confidence', 'ifx-item-ai-confidence', 'user', 'ai-confidence', [
            slot('label', 'Label', 'label.caption', 'span'),
            slot('pct', 'Percent', 'financial.percent.up', 'span')
          ], [
            prim('gap', 'space-4', '--ifx-item-gap', 'spacing'),
            sem('color', 'action.primary', '--ifx-item-color')
          ], { file: 'foundation/share-action.css', anatomy: 'label · pct' }),
          item('ai-reason', 'AI Reason', 'item.ai.reason', 'ifx-item-ai-reason', 'user', 'ai-reason', [
            slot('bullet', 'Bullet', 'dot.status', 'span'),
            slot('text', 'Reason', 'text.muted', 'span')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
            prim('font-size', 'fs-200', '--ifx-font-size-12', 'font-size')
          ], { file: 'foundation/share-action.css', anatomy: 'bullet · text' }),
          item('ai-warning', 'AI Warning', 'item.ai.warning', 'ifx-item-ai-warning', 'user', 'ai-warning', [
            slot('icon', 'Warning', 'icon.alert', 'ti-alert-circle'),
            slot('message', 'Message', 'text.body', 'span')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
            sem('background', 'status.warning.soft', '--ifx-item-bg'),
            sem('color', 'status.warning', '--ifx-item-color')
          ], { file: 'foundation/share-action.css', anatomy: 'icon · message' }),
          item('ai-highlight', 'AI Highlight', 'item.ai.highlight', 'ifx-item-ai-highlight', 'user', 'ai-highlight', [
            slot('marker', 'Marker', 'badge.info', 'ix-badge'),
            slot('text', 'Highlight', 'text.body', 'span')
          ], layoutProps(), { file: 'foundation/share-action.css', anatomy: 'marker · text' })
        ]
      },
      {
        title: 'General',
        items: [
          item('stat-card', 'Statistic Card', 'item.general.stat', 'ix-stat-card-h', 'shared', 'stat-card', [
            slot('icon', 'Icon wrap', 'avatar.md', 'ix-stat-icon'),
            slot('label', 'Label', 'label.caption', 'ix-stat-label'),
            slot('value', 'Value', 'text.body', 'ix-stat-value'),
            slot('sub', 'Subtext', 'text.muted', 'ix-stat-sub')
          ], layoutProps([
            prim('radius', 'radius-lg', '--ix-radius-lg', 'radius'),
            sem('background', 'surface.card', '--ifx-item-bg')
          ]), { file: 'components.css', anatomy: 'icon · info (label · value · sub)' }),
          item('kpi-pair', 'KPI Pair', 'item.general.kpi', 'ifx-item-kpi', 'shared', 'kpi', [
            slot('label', 'Label', 'label.caption', 'span'),
            slot('value', 'Value', 'financial.price.m', 'strong')
          ], [
            prim('gap', 'space-4', '--ifx-item-gap', 'spacing')
          ], { file: 'components.css', anatomy: 'label\n└── value' }),
          item('list-row', 'List Row', 'item.general.list-row', 'ix-list-item', 'shared', 'list-row', [
            slot('leading', 'Leading', 'avatar.sm', 'ix-avatar'),
            slot('title', 'Title', 'text.body', 'span'),
            slot('trailing', 'Trailing', 'text.muted', 'span')
          ], layoutProps(), { file: 'components.css', anatomy: 'leading · title · trailing' }),
          item('empty-state', 'Empty State', 'item.general.empty', 'ifx-wl-empty', 'user', 'empty', [
            slot('icon', 'Icon', 'icon.empty', 'ti-folder-off'),
            slot('message', 'Message', 'text.muted', 'span')
          ], [
            prim('padding-y', 'space-32', '--ifx-item-py', 'spacing'),
            sem('color', 'text.muted', '--ifx-item-color')
          ], { file: 'watchlist.css', anatomy: 'icon\n└── message' }),
          item('loading-row', 'Loading Row', 'item.general.loading', 'ifx-item-loading', 'shared', 'loading', [
            slot('skeleton-a', 'Skeleton', 'skeleton.text', 'ix-skeleton'),
            slot('skeleton-b', 'Skeleton', 'skeleton.text', 'ix-skeleton')
          ], [
            prim('gap', 'space-12', '--ifx-item-gap', 'spacing')
          ], { file: 'atoms-extensions.css', anatomy: 'skeleton · skeleton' }),
          item('error-row', 'Error Row', 'item.general.error', 'ifx-item-error', 'shared', 'error', [
            slot('icon', 'Icon', 'icon.alert', 'ti-alert-circle'),
            slot('message', 'Message', 'text.body', 'span'),
            slot('action', 'Retry', 'button.ghost', 'ix-btn')
          ], [
            prim('gap', 'space-12', '--ifx-item-gap', 'spacing'),
            sem('color', 'status.error', '--ifx-item-color')
          ], { file: 'components.css', anatomy: 'icon · message · action' }),
          item('filter-chip', 'Filter Chip Row', 'item.general.filter', 'ifx-wl-folder-pill', 'user', 'filter', [
            slot('chip', 'Folder pill', 'chip.outline', 'ix-btn')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing')
          ], { file: 'watchlist.css', anatomy: 'chip' }),
          item('alert-item', 'Alert List Item', 'item.general.alert', 'ifx-alert-item', 'user', 'alert-item', [
            slot('condition', 'Condition', 'text.body', 'ifx-alert-item__cond'),
            slot('state', 'State', 'text.muted', 'ifx-alert-item__state'),
            slot('actions', 'Actions', 'button.ghost', 'ifx-alert-item__actions')
          ], layoutProps([
            prim('radius', 'radius-md', '--ix-radius', 'radius'),
            sem('border-color', 'border.default', '--ifx-item-border')
          ]), { file: 'alerts.css', anatomy: 'main (cond · state) · actions' }),
          item('progress-item', 'Progress Item', 'item.general.progress', 'ifx-item-progress', 'shared', 'progress', [
            slot('label', 'Label', 'label.caption', 'span'),
            slot('bar', 'Bar', 'progress.bar', 'ix-progress'),
            slot('pct', 'Percent', 'text.muted', 'span')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing'),
            sem('fill', 'action.primary', '--ifx-item-progress')
          ], { file: 'components.css', anatomy: 'label · bar · pct' }),
          item('status-item', 'Status Item', 'item.general.status', 'ifx-item-status', 'shared', 'status', [
            slot('dot', 'Dot', 'dot.status', 'ix-status-dot'),
            slot('label', 'Label', 'text.body', 'span')
          ], [
            prim('gap', 'space-8', '--ifx-item-gap', 'spacing')
          ], { file: 'components.css', anatomy: 'dot · label' })
        ]
      }
    ];
  }

  var PAGE = {
    id: 'items',
    file: 'Items',
    subtitle: 'Business composites',
    layer: 'items',
    editMode: 'itemLayout',
    groups: buildGroups()
  };

  function propKey(groupTitle, bundle, property) {
    return 'items::' + groupTitle + '::' + bundle.id + '::' + property.key;
  }

  function pageCounts() {
    var total = 0;
    var shared = 0;
    var user = 0;
    PAGE.groups.forEach(function (g) {
      g.items.forEach(function (it) {
        total += 1;
        if (it.surface === 'user') user += 1;
        else shared += 1;
      });
    });
    return { total: total, shared: shared, user: user };
  }

  global.IfluxDsItemsCatalog = {
    esc: esc,
    PAGE: PAGE,
    propKey: propKey,
    pageCounts: pageCounts
  };
})(window);
