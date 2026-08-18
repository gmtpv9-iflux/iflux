/* iFlux DS — Design Tokens (Semantic + Business) · map --color-* / --biz-* */
(function (global) {
  'use strict';
  if (global.IfluxDsDesignTokensCatalog) return;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function prop(logicalId, token, variable, propType) {
    return {
      logicalId: logicalId,
      property: propType || 'color',
      token: token || '',
      variable: variable || ''
    };
  }

  function tok(id, name, logicalId, variable, token, opts) {
    opts = opts || {};
    return {
      id: id,
      name: name,
      tier: opts.tier || 'semantic',
      previewType: opts.preview || 'color',
      icon: opts.icon || 'ti-adjustments',
      properties: [prop(logicalId, token, variable, opts.propType || 'color')]
    };
  }

  function heatmap(i) {
    return tok(
      'heatmap-' + i,
      'Heat ' + i,
      'heatmap.' + i,
      '--biz-heatmap-' + i,
      'color-chart-' + i,
      { tier: 'business', icon: 'ti-grid-pattern' }
    );
  }

  function buildGroups() {
    return [
      {
        title: 'Text',
        tier: 'semantic',
        note: 'semantic/theme.css · --color-text-*',
        items: [
          tok('dt-text-primary', 'Text Primary', 'text.primary', '--color-text-primary', 'color-slate-200', { icon: 'ti-typography' }),
          tok('dt-text-secondary', 'Text Secondary', 'text.secondary', '--color-text-secondary', 'color-slate-400'),
          tok('dt-text-muted', 'Text Muted', 'text.muted', '--color-text-muted', 'color-slate-600'),
          tok('dt-text-disabled', 'Text Disabled', 'text.disabled', '--color-text-disabled', 'color-slate-500'),
          tok('dt-text-inverse', 'Text Inverse', 'text.inverse', '--color-text-inverse', 'color-slate-850'),
          tok('dt-text-card-title', 'Card Title', 'text.card-title', '--color-text-card-title', 'color-slate-200'),
          tok('dt-text-link', 'Text Link', 'text.link', '--color-text-link', 'color-violet-500')
        ]
      },
      {
        title: 'Surface',
        tier: 'semantic',
        note: 'semantic/theme.css · --color-bg-*',
        items: [
          tok('dt-surface-canvas', 'Canvas', 'surface.canvas', '--color-bg-canvas', 'color-slate-850', { icon: 'ti-layout' }),
          tok('dt-surface-default', 'Surface', 'surface.default', '--color-bg-surface', 'color-slate-800'),
          tok('dt-surface-elevated', 'Elevated', 'surface.elevated', '--color-bg-elevated', 'color-slate-700'),
          tok('dt-surface-subtle', 'Subtle', 'surface.subtle', '--color-bg-subtle', 'color-slate-900'),
          tok('dt-surface-input', 'Input', 'surface.input', '--color-bg-input', 'color-slate-900'),
          tok('dt-surface-hover', 'Hover', 'surface.hover', '--color-bg-hover', 'color-slate-700'),
          tok('dt-surface-active', 'Active', 'surface.active', '--color-bg-active', 'alpha-violet-16'),
          tok('dt-surface-sidebar', 'Sidebar', 'surface.sidebar', '--color-bg-sidebar', 'color-slate-800'),
          tok('dt-surface-navbar', 'Navbar', 'surface.navbar', '--color-bg-navbar', 'color-slate-800')
        ]
      },
      {
        title: 'Border',
        tier: 'semantic',
        items: [
          tok('dt-border-default', 'Default', 'border.default', '--color-border-default', 'color-border-frost', { icon: 'ti-border-outer' }),
          tok('dt-border-strong', 'Strong', 'border.strong', '--color-border-strong', 'alpha-white-20'),
          tok('dt-border-subtle', 'Subtle', 'border.subtle', '--color-border-subtle', 'alpha-white-8'),
          tok('dt-border-focus', 'Focus', 'border.focus', '--color-border-focus', 'color-violet-500')
        ]
      },
      {
        title: 'Action',
        tier: 'semantic',
        note: 'CTA / interactive · không trùng Foundations brand primary',
        items: [
          tok('dt-action-primary', 'Primary', 'action.primary', '--color-action-primary', 'color-violet-500', { icon: 'ti-click' }),
          tok('dt-action-primary-hover', 'Primary Hover', 'action.primary.hover', '--color-action-primary-hover', 'color-violet-600'),
          tok('dt-action-primary-soft', 'Primary Soft', 'action.primary.soft', '--color-action-primary-soft', 'alpha-violet-16'),
          tok('dt-action-secondary', 'Secondary', 'action.secondary', '--color-action-secondary', 'color-orange-500'),
          tok('dt-action-secondary-hover', 'Secondary Hover', 'action.secondary.hover', '--color-action-secondary-hover', 'color-orange-600'),
          tok('dt-action-secondary-soft', 'Secondary Soft', 'action.secondary.soft', '--color-action-secondary-soft', 'alpha-orange-14')
        ]
      },
      {
        title: 'Feedback',
        tier: 'semantic',
        items: [
          tok('dt-feedback-success', 'Success', 'status.success', '--color-success', 'color-lime-500', { icon: 'ti-circle-check' }),
          tok('dt-feedback-success-soft', 'Success Soft', 'status.success.soft', '--color-success-soft', 'alpha-lime-16'),
          tok('dt-feedback-warning', 'Warning', 'status.warning', '--color-warning', 'color-amber-550'),
          tok('dt-feedback-warning-soft', 'Warning Soft', 'status.warning.soft', '--color-warning-soft', 'alpha-amber-16'),
          tok('dt-feedback-danger', 'Danger', 'status.error', '--color-danger', 'color-red-450'),
          tok('dt-feedback-danger-soft', 'Danger Soft', 'status.error.soft', '--color-danger-soft', 'alpha-red-16'),
          tok('dt-feedback-info', 'Info', 'status.info', '--color-info', 'color-cyan-500'),
          tok('dt-feedback-info-soft', 'Info Soft', 'status.info.soft', '--color-info-soft', 'alpha-cyan-16')
        ]
      },
      {
        title: 'Chrome & Overlay',
        tier: 'semantic',
        items: [
          tok('dt-overlay-scrim', 'Scrim', 'overlay.scrim', '--color-scrim', 'color-scrim', { icon: 'ti-layers-subtract' }),
          tok('dt-chrome-topnav-bg', 'Topnav BG', 'chrome.topnav.background', '--color-topnav-bg', 'color-topnav-bg'),
          tok('dt-chrome-topnav-shadow', 'Topnav Shadow', 'chrome.topnav.shadow', '--color-topnav-shadow', 'shadow-md', { preview: 'shadow', propType: 'shadow' }),
          tok('dt-surface-elevated-alpha', 'Elevated Tint', 'surface.elevated.tint', '--color-surface-elevated', 'alpha-white-4')
        ]
      },
      {
        title: 'Text on Fill',
        tier: 'semantic',
        items: [
          tok('dt-text-on-primary', 'On Primary', 'text.on.primary', '--color-text-on-primary', 'color-white'),
          tok('dt-text-on-success', 'On Success', 'text.on.success', '--color-text-on-success', 'color-slate-900'),
          tok('dt-text-on-warning', 'On Warning', 'text.on.warning', '--color-text-on-warning', 'color-slate-900'),
          tok('dt-text-on-danger', 'On Danger', 'text.on.danger', '--color-text-on-danger', 'color-white'),
          tok('dt-text-on-info', 'On Info', 'text.on.info', '--color-text-on-info', 'color-slate-900')
        ]
      },
      {
        title: 'Market Price',
        tier: 'business',
        note: 'semantic/theme.css · --color-market-*',
        items: [
          tok('dt-market-up', 'Price Up', 'market.price.up', '--color-market-up', 'color-lime-500', { tier: 'business', icon: 'ti-trending-up', preview: 'market-up' }),
          tok('dt-market-up-soft', 'Price Up Soft', 'market.price.up.soft', '--color-market-up-soft', 'alpha-lime-16', { tier: 'business', preview: 'market-up' }),
          tok('dt-market-down', 'Price Down', 'market.price.down', '--color-market-down', 'color-red-450', { tier: 'business', icon: 'ti-trending-down', preview: 'market-down' }),
          tok('dt-market-down-soft', 'Price Down Soft', 'market.price.down.soft', '--color-market-down-soft', 'alpha-red-16', { tier: 'business', preview: 'market-down' }),
          tok('dt-market-ref', 'Reference', 'market.price.ref', '--color-market-ref', 'color-amber-550', { tier: 'business' }),
          tok('dt-market-ref-soft', 'Reference Soft', 'market.price.ref.soft', '--color-market-ref-soft', 'alpha-amber-16', { tier: 'business' }),
          tok('dt-market-ceiling', 'Ceiling (Trần)', 'market.price.ceiling', '--color-market-ceiling', 'color-purple-500', { tier: 'business' }),
          tok('dt-market-ceiling-soft', 'Ceiling Soft', 'market.price.ceiling.soft', '--color-market-ceiling-soft', 'alpha-purple-10', { tier: 'business' }),
          tok('dt-market-floor', 'Floor (Sàn)', 'market.price.floor', '--color-market-floor', 'color-cyan-500', { tier: 'business' }),
          tok('dt-market-floor-soft', 'Floor Soft', 'market.price.floor.soft', '--color-market-floor-soft', 'alpha-cyan-16', { tier: 'business' })
        ]
      },
      {
        title: 'Money Flow',
        tier: 'business',
        items: [
          tok('dt-flow-in', 'Flow In', 'moneyflow.in', '--color-flow-in', 'color-lime-500', { tier: 'business', icon: 'ti-arrow-down-left', preview: 'market-up' }),
          tok('dt-flow-out', 'Flow Out', 'moneyflow.out', '--color-flow-out', 'color-red-450', { tier: 'business', icon: 'ti-arrow-up-right', preview: 'market-down' }),
          tok('dt-flow-strong-in', 'Strong In', 'moneyflow.strong.in', '--biz-money-flow-strong-in', 'color-lime-500', { tier: 'business', preview: 'market-up' }),
          tok('dt-flow-strong-out', 'Strong Out', 'moneyflow.strong.out', '--biz-money-flow-strong-out', 'color-red-450', { tier: 'business', preview: 'market-down' })
        ]
      },
      {
        title: 'Membership',
        tier: 'business',
        items: [
          tok('dt-tier-free', 'Free', 'membership.free', '--color-tier-free', 'color-slate-400', { tier: 'business', icon: 'ti-user' }),
          tok('dt-tier-premium', 'Premium', 'membership.premium', '--color-tier-premium', 'color-violet-500', { tier: 'business', icon: 'ti-crown' }),
          tok('dt-tier-elite', 'Elite', 'membership.elite', '--color-tier-elite', 'color-orange-500', { tier: 'business', icon: 'ti-diamond' })
        ]
      },
      {
        title: 'Signal',
        tier: 'business',
        note: 'semantic/business-tokens.css · --biz-signal-*',
        items: [
          tok('dt-signal-confirmed', 'Confirmed', 'signal.confirmed', '--biz-signal-confirmed', 'color-lime-500', { tier: 'business', icon: 'ti-bolt' }),
          tok('dt-signal-pending', 'Pending', 'signal.pending', '--biz-signal-pending', 'color-amber-550', { tier: 'business' }),
          tok('dt-signal-invalid', 'Invalid', 'signal.invalid', '--biz-signal-invalid', 'color-red-450', { tier: 'business' })
        ]
      },
      {
        title: 'Portfolio',
        tier: 'business',
        items: [
          tok('dt-portfolio-profit', 'Profit', 'portfolio.profit', '--biz-portfolio-profit', 'color-lime-500', { tier: 'business', icon: 'ti-chart-line', preview: 'market-up' }),
          tok('dt-portfolio-loss', 'Loss', 'portfolio.loss', '--biz-portfolio-loss', 'color-red-450', { tier: 'business', preview: 'market-down' })
        ]
      },
      {
        title: 'Heatmap',
        tier: 'business',
        note: 'semantic/business-tokens.css · --biz-heatmap-*',
        items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(heatmap)
      }
    ];
  }

  var PAGE = {
    id: 'design-tokens',
    file: 'Design Tokens',
    subtitle: 'Semantic + Business',
    layer: 'design-tokens',
    editMode: 'tokenRef',
    groups: buildGroups()
  };

  function propKey(groupTitle, bundle, property) {
    return 'design-tokens::' + groupTitle + '::' + bundle.id + '::' + (property.logicalId || property.property);
  }

  function pageCounts() {
    var total = 0;
    var semantic = 0;
    var business = 0;
    PAGE.groups.forEach(function (g) {
      total += g.items.length;
      if (g.tier === 'business') business += g.items.length;
      else semantic += g.items.length;
    });
    return { total: total, semantic: semantic, business: business };
  }

  function allEntries() {
    var out = [];
    PAGE.groups.forEach(function (g) {
      g.items.forEach(function (item) {
        item.properties.forEach(function (p) {
          out.push({
            logicalId: p.logicalId,
            variable: p.variable,
            token: p.token,
            property: p.property,
            tier: item.tier || g.tier || 'semantic'
          });
        });
      });
    });
    return out;
  }

  function entriesByProperty(propType) {
    return allEntries().filter(function (e) { return e.property === propType; });
  }

  global.IfluxDsDesignTokensCatalog = {
    esc: esc,
    PAGE: PAGE,
    propKey: propKey,
    pageCounts: pageCounts,
    allEntries: allEntries,
    entriesByProperty: entriesByProperty
  };
})(window);
