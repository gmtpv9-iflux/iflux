/* iFlux DS — Catalog: MODULE → TRANG → NHÓM → TOKEN */
(function (global) {
  'use strict';
  if (global.IfluxDsFtCatalog) return;

  var STATUS = {
    ok: { label: 'Có', cls: 'ds-status--ok', icon: '✅' },
    partial: { label: 'Một phần', cls: 'ds-status--partial', icon: '⚠️' },
    miss: { label: 'Thiếu', cls: 'ds-status--miss', icon: '❌' }
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
  }

  /** @param {string} id @param {{name?,group?,variable?,value?,property?,previewType?,status?,className?,note?}} o */
  function tok(id, o) {
    o = o || {};
    return {
      id: id,
      name: o.name || id,
      group: o.group || '',
      property: o.property || '',
      variable: o.variable || '',
      value: o.value != null ? String(o.value) : '',
      previewType: o.previewType || 'color',
      status: o.status || 'ok',
      className: o.className || '',
      note: o.note || ''
    };
  }

  function defaultProperty(it) {
    if (it.property) return it.property;
    var pt = it.previewType || 'color';
    if (pt === 'color' || pt === 'text') return 'Color';
    if (pt === 'spacing') return 'Spacing';
    if (pt === 'radius') return 'Radius';
    if (pt === 'shadow') return 'Shadow';
    if (pt === 'border') return 'Border';
    if (pt === 'typography' || pt === 'numeric') return 'Font Size';
    if (pt.indexOf('naming') === 0) return 'Rule';
    return 'Value';
  }

  function bundle(bundleId, groupName, meta, properties) {
    meta = meta || {};
    return {
      bundleId: bundleId,
      groupName: groupName,
      previewType: meta.previewType || 'color',
      className: meta.className || '',
      previewGood: meta.previewGood || '',
      previewBad: meta.previewBad || '',
      previewSample: meta.previewSample || '',
      properties: (properties || []).map(function (p) {
        return {
          id: p.id,
          scope: p.scope || '',
          property: p.property || defaultProperty(meta),
          variable: p.variable || '',
          value: p.value != null ? String(p.value) : ''
        };
      })
    };
  }

  function itemToBundle(it) {
    return bundle(it.id, it.name, it, [{
      id: it.id,
      scope: it.scope || '',
      property: it.property || defaultProperty(it),
      variable: it.variable,
      value: it.value
    }]);
  }

  function normalizeGroup(grp) {
    if (grp.bundles) return { title: grp.title, groupKind: grp.groupKind || '', bundles: grp.bundles };
    return { title: grp.title, groupKind: grp.groupKind || '', bundles: (grp.items || []).map(itemToBundle) };
  }

  function normalizePage(page) {
    if (!page) return page;
    return {
      id: page.id,
      file: page.file,
      path: page.path,
      layer: page.layer,
      pageKind: page.pageKind,
      pageTier: page.pageTier || '',
      moduleOrder: page.moduleOrder || 0,
      showScope: !!page.showScope,
      groups: (page.groups || []).map(normalizeGroup)
    };
  }

  function headingBundle(key, cls, sample) {
    var k = key.toLowerCase();
    return bundle('heading-' + k, key, {
      previewType: 'typography',
      className: cls,
      previewSample: sample || key
    }, [
      { id: k + '-size', property: 'Font Size', variable: '--ifx-text-' + k + '-size', value: '' },
      { id: k + '-line', property: 'Line Height', variable: '--ifx-text-' + k + '-line', value: '' },
      { id: k + '-weight', property: 'Font Weight', variable: '--ifx-text-' + k + '-weight', value: '' },
      { id: k + '-tracking', property: 'Letter Spacing', variable: '--ifx-text-' + k + '-tracking', value: '' }
    ]);
  }

  function filePage(id, file, layer, groups, opts) {
    opts = opts || {};
    return {
      id: id,
      file: file,
      path: opts.path || ('iflux-admin-ui/' + file),
      layer: layer || 'foundation',
      pageKind: opts.pageKind || '',
      pageTier: opts.pageTier || '',
      moduleOrder: opts.moduleOrder || 0,
      showScope: !!opts.showScope,
      groups: groups || []
    };
  }

  function group(title, itemsOrBundles, opts) {
    opts = opts || {};
    if (!itemsOrBundles || !itemsOrBundles.length) {
      return { title: title, groupKind: opts.groupKind || '', items: [], bundles: [] };
    }
    if (itemsOrBundles[0].bundleId || itemsOrBundles[0].properties) {
      return { title: title, groupKind: opts.groupKind || '', bundles: itemsOrBundles };
    }
    return { title: title, groupKind: opts.groupKind || '', items: itemsOrBundles };
  }

  var FS_SCALE = [
    [100, '0.625rem', '10px'],
    [200, '0.75rem', '12px'],
    [300, '0.875rem', '14px'],
    [400, '1rem', '16px'],
    [500, '1.125rem', '18px'],
    [600, '1.25rem', '20px'],
    [700, '1.5rem', '24px'],
    [800, '2rem', '32px'],
    [900, '3rem', '48px']
  ];

  function buildTypographyPrimitivePage() {
    return filePage('primitives-typography', 'primitives/typography.css', 'foundation', [
      group('NHÓM FONT FAMILY', [
        tok('font-primary', { name: 'Primary Font', property: 'Font Family', variable: '--ifx-font-primary', value: "'Be Vietnam Pro', system-ui, sans-serif", previewType: 'typography' }),
        tok('font-mono', { name: 'Monospace', property: 'Font Family', variable: '--ifx-font-mono', value: "ui-monospace, 'SF Mono', monospace", previewType: 'typography' }),
        tok('font-numeric', { name: 'Number Font', property: 'Font Family', variable: '--ifx-font-numeric', value: 'var(--ifx-font-primary)', previewType: 'numeric' })
      ]),
      group('NHÓM FONT SIZE', FS_SCALE.map(function (row) {
        return tok('fs-' + row[0], {
          name: 'FS ' + row[0],
          property: 'Font Size',
          variable: '--ifx-fs-' + row[0],
          value: row[1],
          previewType: 'typography',
          note: row[2]
        });
      })),
      group('NHÓM FONT WEIGHT', [
        [200, 'extralight'], [400, 'regular'], [600, 'semibold'], [800, 'extrabold']
      ].map(function (w) {
        return tok('weight-' + w[0], {
          name: 'Weight ' + w[0],
          property: 'Font Weight',
          variable: '--ifx-font-weight-' + w[1],
          value: String(w[0]),
          previewType: 'typography'
        });
      })),
      group('NHÓM LINE HEIGHT (Primitive)', [
        ['tight', '1.25'], ['normal', '1.5'], ['relaxed', '1.625'], ['loose', '1.75']
      ].map(function (row) {
        return tok('lh-' + row[0], {
          name: 'Line Height ' + row[0],
          property: 'Line Height',
          variable: '--ifx-line-height-' + row[0],
          value: row[1],
          previewType: 'typography'
        });
      })),
      group('NHÓM LINE HEIGHT (Scale)', [
        [10, '0.875rem'], [12, '1rem'], [14, '1.25rem'], [16, '1.5rem'], [18, '1.75rem'],
        [20, '1.875rem'], [24, '2.25rem'], [28, '2.625rem'], [32, '2.75rem'], [40, '3.25rem'],
        [48, '3.5rem'], [56, '4rem'], [64, '4.5rem'], [72, '5rem']
      ].map(function (pair) {
        return tok('lh-' + pair[0], {
          name: 'Line Height ' + pair[0] + 'px',
          property: 'Line Height',
          variable: '--ifx-line-height-' + pair[0],
          value: pair[1],
          previewType: 'typography'
        });
      })),
      group('NHÓM LETTER SPACING', [
        ['tighter', '-0.02em'], ['tight', '-0.01em'], ['normal', '0'],
        ['wide', '0.01em'], ['wider', '0.02em'], ['caps', '0.06em']
      ].map(function (row) {
        return tok('ls-' + row[0], {
          name: 'Tracking ' + row[0],
          property: 'Letter Spacing',
          variable: '--ifx-letter-spacing-' + row[0],
          value: row[1],
          previewType: 'typography'
        });
      }))
    ], { pageTier: 'primitive', moduleOrder: 12 });
  }

  function buildFoundationPages() {
    var pages = [];

    if (global.IfluxDsNamingCatalog) {
      pages.push(global.IfluxDsNamingCatalog.buildFoundationNamingPage());
    }

    /* ── TRANG primitive: primitives/color.css ── */
    pages.push(filePage('primitives-color', 'primitives/color.css', 'foundation', [
      group('NHÓM NEUTRAL', [
        ['25', '#fafafc'], ['50', '#f5f5f9'], ['100', '#ececf1'], ['200', '#cfd3ec'],
        ['300', '#a1acb8'], ['400', '#8592a3'], ['500', '#697a8d'], ['600', '#5f6582'],
        ['700', '#3a3b55'], ['800', '#2b2c40'], ['850', '#232333'], ['900', '#1e1e2d'], ['950', '#16161f']
      ].map(function (n) {
        var step = n[0];
        var v = step === '25' ? '--ifx-color-neutral-25' : '--ifx-color-slate-' + step;
        return tok('neutral-' + step, {
          name: 'Neutral ' + step,
          group: 'NHÓM NEUTRAL',
          property: 'Color',
          variable: v,
          value: n[1],
          previewType: 'color'
        });
      })),
      group('NHÓM NAVY (Brand)', [
        ['50', '#eef1fa'], ['100', '#d5dcf2'], ['200', '#aab8e5'], ['300', '#7f94d8'],
        ['400', '#5470cb'], ['500', '#3a56b5'], ['600', '#1b3587'], ['700', '#152a6b'],
        ['800', '#0f1f50'], ['900', '#0a1438']
      ].map(function (n) {
        return tok('navy-' + n[0], {
          name: 'Navy ' + n[0], group: 'NHÓM NAVY (Brand)',
          variable: '--ifx-color-navy-' + n[0], value: n[1], previewType: 'color'
        });
      })),
      group('NHÓM ORANGE (Accent)', [
        ['50', '#fff4ed'], ['100', '#ffe4d1'], ['200', '#ffc9a3'], ['300', '#ffa96f'],
        ['400', '#ff8840'], ['500', '#f26522'], ['600', '#d95518'], ['700', '#b34412'],
        ['800', '#8c350e'], ['900', '#662709']
      ].map(function (n) {
        return tok('orange-' + n[0], {
          name: 'Orange ' + n[0], group: 'NHÓM ORANGE (Accent)',
          variable: '--ifx-color-orange-' + n[0], value: n[1], previewType: 'color'
        });
      })),
      group('NHÓM FEEDBACK', [
        tok('green-500', { name: 'Green 500', variable: '--ifx-color-green-500', value: '#00a67e', previewType: 'color' }),
        tok('red-500', { name: 'Red 500', variable: '--ifx-color-red-500', value: '#e8304a', previewType: 'color' }),
        tok('amber-550', { name: 'Amber 550', variable: '--ifx-color-amber-550', value: '#ffab00', previewType: 'color' }),
        tok('cyan-500', { name: 'Cyan 500', variable: '--ifx-color-cyan-500', value: '#03c3ec', previewType: 'color' }),
        tok('lime-500', { name: 'Lime 500', variable: '--ifx-color-lime-500', value: '#71dd37', previewType: 'color' }),
        tok('violet-500', { name: 'Violet 500', variable: '--ifx-color-violet-500', value: '#696cff', previewType: 'color' }),
        tok('purple-500', { name: 'Purple 500 (Trần)', variable: '--ifx-color-purple-500', value: '#a855f7', previewType: 'color' })
      ]),
      group('NHÓM CHART (Series 1–10)', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (i) {
        return tok('chart-' + i, {
          name: 'Chart ' + i, group: 'NHÓM CHART (Series 1–10)',
          variable: '--ifx-color-chart-' + i,
          value: i === 9 ? '#e91e8c' : i === 10 ? '#b4b7bd' : 'var(--ifx-color-violet-500)',
          previewType: 'color', status: 'ok'
        });
      }))
    ], { pageTier: 'primitive', moduleOrder: 11 }));

    pages.push(buildTypographyPrimitivePage());

    pages.push(filePage('primitives-radius', 'primitives/radius.css', 'foundation', [
      group('NHÓM RADIUS PRIMITIVE', [
        tok('r-none', { name: 'Radius 0', variable: '--ifx-radius-none', value: '0', previewType: 'radius' }),
        tok('r-xs', { name: 'Radius 2', variable: '--ifx-radius-xs', value: '2px', previewType: 'radius' }),
        tok('r-sm', { name: 'Radius 4', variable: '--ifx-radius-sm', value: '4px', previewType: 'radius' }),
        tok('r-md', { name: 'Radius 6', variable: '--ifx-radius-md', value: '6px', previewType: 'radius' }),
        tok('r-lg', { name: 'Radius 8', variable: '--ifx-radius-lg', value: '8px', previewType: 'radius' }),
        tok('r-xl', { name: 'Radius 12', variable: '--ifx-radius-xl', value: '12px', previewType: 'radius' }),
        tok('r-2xl', { name: 'Radius 16', variable: '--ifx-radius-2xl', value: '16px', previewType: 'radius' }),
        tok('r-24', { name: 'Radius 24', variable: '--ifx-radius-3xl', value: '24px', previewType: 'radius' }),
        tok('r-full', { name: 'Radius Full', variable: '--ifx-radius-full', value: '9999px', previewType: 'radius' })
      ])
    ], { pageTier: 'primitive', moduleOrder: 13 }));

    pages.push(filePage('primitives-shadow', 'primitives/shadow.css', 'foundation', [
      group('NHÓM SHADOW', ['xs', 'sm', 'md', 'lg', 'xl'].map(function (s) {
        return tok('shadow-' + s, {
          name: 'Shadow ' + s.toUpperCase(), group: 'NHÓM SHADOW',
          variable: '--ifx-shadow-' + s,
          value: '0 4px 16px var(--ifx-alpha-black-12)',
          previewType: 'shadow'
        });
      }))
    ], { pageTier: 'primitive', moduleOrder: 14 }));

    pages.push(filePage('primitives-zindex', 'primitives/z-index.css', 'foundation', [
      group('NHÓM ELEVATION / Z-INDEX', [
        ['base', 0], ['dropdown', 100], ['sticky', 200], ['topnav', 220], ['drawer', 230],
        ['overlay', 240], ['modal', 300], ['toast', 400], ['onboarding', 500]
      ].map(function (z) {
        return tok('z-' + z[0], {
          name: 'Z · ' + z[0], group: 'NHÓM ELEVATION / Z-INDEX',
          variable: '--ifx-z-' + z[0], value: String(z[1]), previewType: 'text'
        });
      }))
    ], { pageTier: 'primitive', moduleOrder: 15 }));

    pages.push(filePage('primitives-motion', 'primitives/motion.css', 'foundation', [
      group('NHÓM DURATION', [
        tok('dur-fast', { name: '100ms · Hover', variable: '--ifx-duration-fast', value: '100ms', previewType: 'text' }),
        tok('dur-normal', { name: '200ms · Fade', variable: '--ifx-duration-normal', value: '200ms', previewType: 'text' }),
        tok('dur-slow', { name: '300ms · Drawer', variable: '--ifx-duration-slow', value: '300ms', previewType: 'text' }),
        tok('dur-150', { name: '150ms', variable: '--ifx-duration-150', value: '150ms', previewType: 'text' }),
        tok('dur-500', { name: '500ms · Modal', variable: '--ifx-duration-500', value: '500ms', previewType: 'text' })
      ]),
      group('NHÓM EASING', [
        tok('ease-default', { name: 'Ease Default', variable: '--ifx-ease-default', value: 'cubic-bezier(0.4, 0, 0.2, 1)', previewType: 'text' }),
        tok('ease-out', { name: 'Ease Out', variable: '--ifx-ease-out', value: 'cubic-bezier(0, 0, 0.2, 1)', previewType: 'text' })
      ])
    ], { pageTier: 'primitive', moduleOrder: 16 }));

    pages.push(filePage('primitives-layout', 'primitives/layout.css', 'foundation', [
      group('NHÓM BREAKPOINT', [
        ['xs', 480], ['sm', 640], ['md', 768], ['lg', 1024],
        ['xl', 1280], ['2xl', 1440], ['3xl', 1920]
      ].map(function (bp) {
        return tok('bp-' + bp[0], {
          name: 'Breakpoint ' + bp[0], group: 'NHÓM BREAKPOINT',
          variable: '--ifx-bp-' + bp[0], value: bp[1] + 'px', previewType: 'text'
        });
      })),
      group('NHÓM LAYOUT SIZE', [
        tok('sidebar-w', { name: 'Sidebar Width', variable: '--ifx-size-sidebar-w', value: '260px', previewType: 'text' }),
        tok('topnav-h', { name: 'Topnav Height', variable: '--ifx-size-topnav-h', value: '56px', previewType: 'text' }),
        tok('container-max', { name: 'Container Max', variable: '--ifx-size-container-max', value: '1280px', previewType: 'text' }),
        tok('icon-sm', { name: 'Icon 16', variable: '--ifx-size-icon-sm', value: '16px', previewType: 'text' }),
        tok('icon-md', { name: 'Icon 20', variable: '--ifx-size-icon-md', value: '20px', previewType: 'text' }),
        tok('icon-lg', { name: 'Icon 24', variable: '--ifx-size-icon-lg', value: '24px', previewType: 'text' })
      ])
    ], { pageTier: 'primitive', moduleOrder: 17 }));

    /* ── TRANG: spacing.css (primitive scale + semantic) ── */
    pages.push(filePage('spacing', 'spacing.css', 'foundation', [
      group('NHÓM SPACING SCALE', [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96].map(function (n) {
        return tok('space-' + n, {
          name: 'Space ' + n, group: 'NHÓM SPACING SCALE',
          variable: '--ifx-space-' + n, value: n === 0 ? '0' : (n / 16) + 'rem',
          previewType: 'spacing'
        });
      })),
      group('NHÓM SPACING SEMANTIC', [
        tok('inline-xs', { name: 'Inline XS', variable: '--ifx-inline-xs', value: 'var(--ifx-space-4)', previewType: 'spacing' }),
        tok('inline-sm', { name: 'Inline SM', variable: '--ifx-inline-sm', value: 'var(--ifx-space-8)', previewType: 'spacing' }),
        tok('stack-md', { name: 'Stack MD', variable: '--ifx-stack-md', value: 'var(--ifx-space-16)', previewType: 'spacing' }),
        tok('section', { name: 'Section XL', variable: '--ifx-space-section', value: 'var(--ifx-space-64)', previewType: 'spacing' }),
        tok('page', { name: 'Layout XXL', variable: '--ifx-space-page', value: 'var(--ifx-space-80)', previewType: 'spacing' }),
        tok('container', { name: 'Page Margin', variable: '--ifx-space-container', value: 'var(--ifx-space-24)', previewType: 'spacing' }),
        tok('btn-x', { name: 'Button Padding X', variable: '--ifx-space-button-x', value: 'var(--ifx-space-16)', previewType: 'spacing' }),
        tok('card-inset', { name: 'Card Padding', variable: '--ifx-inset-card', value: 'var(--ifx-space-16) var(--ifx-space-20)', previewType: 'spacing' })
      ])
    ], { pageTier: 'semantic', moduleOrder: 20 }));

    /* ── TRANG semantic: typography.css ── */
    var typoHeadings = [
      ['H1', '.ifx-typo-h1', 'Membership iFlux', 'var(--ifx-fs-700)', 'var(--ifx-font-weight-bold)', 'var(--ifx-line-height-tight)', 'var(--ifx-letter-spacing-tight)'],
      ['H2', '.ifx-typo-h2', 'Thị trường', 'var(--ifx-fs-600)', 'var(--ifx-font-weight-bold)', 'var(--ifx-line-height-tight)', 'var(--ifx-letter-spacing-normal)'],
      ['H3', '.ifx-typo-h3', 'Dòng tiền', 'var(--ifx-fs-500)', 'var(--ifx-font-weight-semibold)', 'var(--ifx-line-height-normal)', 'var(--ifx-letter-spacing-normal)'],
      ['H4', '.ifx-typo-h4', 'Top ngành', 'var(--ifx-fs-400)', 'var(--ifx-font-weight-semibold)', 'var(--ifx-line-height-normal)', 'var(--ifx-letter-spacing-normal)'],
      ['H5', '.ifx-typo-h5', 'Chi tiết', 'var(--ifx-fs-400)', 'var(--ifx-font-weight-semibold)', 'var(--ifx-line-height-normal)', 'var(--ifx-letter-spacing-normal)'],
      ['H6', '.ifx-typo-h6', 'Ghi chú', 'var(--ifx-fs-300)', 'var(--ifx-font-weight-semibold)', 'var(--ifx-line-height-normal)', 'var(--ifx-letter-spacing-normal)']
    ];
    pages.push(filePage('typography', 'typography.css', 'foundation', [
      group('NHÓM DISPLAY', [
        tok('display-xl', { name: 'Display XL', property: 'Font Size', variable: '--ifx-text-display-xl-size', value: 'var(--ifx-fs-900)', className: '.ifx-typo-display-xl', previewType: 'typography' }),
        tok('display-l', { name: 'Display L', property: 'Font Size', variable: '--ifx-text-display-l-size', value: 'var(--ifx-fs-800)', className: '.ifx-typo-display-l', previewType: 'typography' }),
        tok('display-m', { name: 'Display M', property: 'Font Size', variable: '--ifx-text-display-m-size', value: 'var(--ifx-fs-700)', className: '.ifx-typo-display-m', previewType: 'typography' })
      ]),
      group('NHÓM HEADING', typoHeadings.map(function (h) {
        var k = h[0].toLowerCase();
        return bundle('heading-' + k, h[0], {
          previewType: 'typography', className: h[1], previewSample: h[2]
        }, [
          { id: k + '-size', property: 'Font Size', variable: '--ifx-text-' + k + '-size', value: h[3] },
          { id: k + '-line', property: 'Line Height', variable: '--ifx-text-' + k + '-line', value: h[5] },
          { id: k + '-weight', property: 'Font Weight', variable: '--ifx-text-' + k + '-weight', value: h[4] },
          { id: k + '-tracking', property: 'Letter Spacing', variable: '--ifx-text-' + k + '-tracking', value: h[6] }
        ]);
      })),
      group('NHÓM BODY', [
        tok('body-lg', { name: 'Body Large', variable: '--ifx-text-body-lg-size', value: 'var(--ifx-fs-500)', className: '.ifx-typo-body-lg', previewType: 'typography' }),
        tok('body-md', { name: 'Body Medium', variable: '--ifx-text-body-md-size', value: 'var(--ifx-fs-400)', className: '.ifx-typo-body-md', previewType: 'typography' }),
        tok('body-sm', { name: 'Body Small', variable: '--ifx-text-body-sm-size', value: 'var(--ifx-fs-300)', className: '.ifx-typo-body-sm', previewType: 'typography' }),
        tok('caption', { name: 'Caption / Tiny', variable: '--ifx-text-caption-size', value: 'var(--ifx-fs-200)', className: '.ifx-typo-caption', previewType: 'typography' })
      ]),
      group('NHÓM NUMERIC', [
        tok('price-m', { name: 'Price', variable: '--ifx-text-price-m-size', value: 'var(--ifx-fs-700)', className: '.ifx-typo-price-m', previewType: 'numeric' }),
        tok('volume', { name: 'Volume', variable: '--ifx-text-volume-size', value: 'var(--ifx-fs-300)', className: '.ifx-typo-volume', previewType: 'numeric' }),
        tok('percent', { name: 'Percent', variable: '--ifx-text-percentage-size', value: 'var(--ifx-fs-400)', className: '.ifx-typo-percentage', previewType: 'numeric' }),
        tok('money', { name: 'Currency', variable: '--ifx-text-money-size', value: 'var(--ifx-fs-400)', className: '.ifx-typo-money', previewType: 'numeric' }),
        tok('ranking', { name: 'Ranking', variable: '--ifx-text-ranking-num-size', value: 'var(--ifx-fs-200)', className: '.ifx-typo-ranking-num', previewType: 'numeric' }),
        tok('timestamp', { name: 'Timer', variable: '--ifx-text-timestamp-size', value: 'var(--ifx-fs-200)', className: '.ifx-typo-timestamp', previewType: 'numeric' })
      ])
    ], { pageTier: 'semantic', moduleOrder: 30 }));

    return pages;
  }

  function buildTokenPages() {
    var pages = [];

    if (global.IfluxDsNamingCatalog) {
      pages.push(global.IfluxDsNamingCatalog.buildTokenNamingPage());
    }

    pages.push(filePage('semantic-theme', 'semantic/theme.css', 'token', [
      group('NHÓM TEXT (L2 Semantic)', [
        tok('text-primary', { name: 'Text Primary', variable: '--color-text-primary', value: 'var(--ifx-color-slate-200)', previewType: 'text' }),
        tok('text-secondary', { name: 'Text Secondary', variable: '--color-text-secondary', value: 'var(--ifx-color-slate-400)', previewType: 'text' }),
        tok('text-muted', { name: 'Text Muted', variable: '--color-text-muted', value: 'var(--ifx-color-slate-600)', previewType: 'text' }),
        tok('text-disabled', { name: 'Text Disabled', variable: '--color-text-disabled', value: 'var(--ifx-color-slate-500)', previewType: 'text' }),
        tok('text-inverse', { name: 'Text Inverse', variable: '--color-text-inverse', value: 'var(--ifx-color-slate-850)', previewType: 'text' }),
        tok('text-link', { name: 'Text Link', variable: '--color-text-link', value: 'var(--ifx-color-violet-500)', previewType: 'text' }),
        tok('text-placeholder', { name: 'Text Placeholder', variable: '--color-text-placeholder', value: 'var(--ifx-color-slate-500)', previewType: 'text' })
      ]),
      group('NHÓM BACKGROUND (L2 Semantic)', [
        tok('bg-canvas', { name: 'Background Canvas', variable: '--color-bg-canvas', value: 'var(--ifx-color-slate-850)', previewType: 'color' }),
        tok('bg-surface', { name: 'Background Surface', variable: '--color-bg-surface', value: 'var(--ifx-color-slate-800)', previewType: 'color' }),
        tok('bg-elevated', { name: 'Background Elevated', variable: '--color-bg-elevated', value: 'var(--ifx-color-slate-700)', previewType: 'color' }),
        tok('bg-hover', { name: 'Background Hover', variable: '--color-bg-hover', value: 'var(--ifx-color-slate-700)', previewType: 'color' }),
        tok('bg-active', { name: 'Background Selected', variable: '--color-bg-active', value: 'var(--ifx-alpha-violet-16)', previewType: 'color' }),
        tok('bg-scrim', { name: 'Background Overlay', variable: '--color-scrim', value: 'var(--ifx-color-scrim)', previewType: 'color' })
      ]),
      group('NHÓM BORDER (L2 Semantic)', [
        tok('border-default', { name: 'Border Default', variable: '--color-border-default', value: 'var(--ifx-color-border-frost)', previewType: 'border' }),
        tok('border-strong', { name: 'Border Strong', variable: '--color-border-strong', value: 'rgba(207, 211, 236, 0.2)', previewType: 'border' }),
        tok('border-focus', { name: 'Border Focus', variable: '--color-border-focus', value: 'var(--ifx-color-violet-500)', previewType: 'border' })
      ]),
      group('NHÓM ACTION (Brand semantic)', [
        tok('action-primary', { name: 'Primary', variable: '--color-action-primary', value: 'var(--ifx-color-violet-500)', previewType: 'color' }),
        tok('action-primary-hover', { name: 'Primary Hover', variable: '--color-action-primary-hover', value: 'var(--ifx-color-violet-600)', previewType: 'color' }),
        tok('action-primary-soft', { name: 'Primary Soft', variable: '--color-action-primary-soft', value: 'var(--ifx-alpha-violet-16)', previewType: 'color' }),
        tok('action-secondary', { name: 'Secondary', variable: '--color-action-secondary', value: 'var(--ifx-color-orange-500)', previewType: 'color' })
      ]),
      group('NHÓM FEEDBACK (L2 Semantic)', [
        tok('success', { name: 'Success', variable: '--color-success', value: 'var(--ifx-color-lime-500)', previewType: 'color' }),
        tok('warning', { name: 'Warning', variable: '--color-warning', value: 'var(--ifx-color-amber-550)', previewType: 'color' }),
        tok('danger', { name: 'Error', variable: '--color-danger', value: 'var(--ifx-color-red-450)', previewType: 'color' }),
        tok('info', { name: 'Info', variable: '--color-info', value: 'var(--ifx-color-cyan-500)', previewType: 'color' })
      ]),
      group('NHÓM MARKET / BUSINESS (L4)', [
        tok('market-up', { name: 'Stock Up', variable: '--color-market-up', value: 'var(--ifx-color-lime-500)', previewType: 'market-up' }),
        tok('market-down', { name: 'Stock Down', variable: '--color-market-down', value: 'var(--ifx-color-red-450)', previewType: 'market-down' }),
        tok('market-ref', { name: 'Reference', variable: '--color-market-ref', value: 'var(--ifx-color-amber-550)', previewType: 'color' }),
        tok('market-ceiling', { name: 'Ceiling (Trần)', variable: '--color-market-ceiling', value: 'var(--ifx-color-purple-500)', previewType: 'color' }),
        tok('market-floor', { name: 'Floor (Sàn)', variable: '--color-market-floor', value: 'var(--ifx-color-cyan-500)', previewType: 'color' }),
        tok('flow-in', { name: 'Money Flow In', variable: '--color-flow-in', value: 'var(--ifx-color-lime-500)', previewType: 'color' }),
        tok('flow-out', { name: 'Money Flow Out', variable: '--color-flow-out', value: 'var(--ifx-color-red-450)', previewType: 'color' }),
        tok('biz-strong-buy', { name: 'Strong Buy', variable: '--biz-money-flow-strong-in', value: 'var(--ifx-color-lime-500)', previewType: 'color' }),
        tok('biz-strong-sell', { name: 'Strong Sell', variable: '--biz-money-flow-strong-out', value: 'var(--ifx-color-red-450)', previewType: 'color' })
      ]),
      group('NHÓM MEMBERSHIP TIER', [
        tok('tier-free', { name: 'Free', variable: '--color-tier-free', value: 'var(--ifx-color-slate-400)', previewType: 'color' }),
        tok('tier-premium', { name: 'Premium', variable: '--color-tier-premium', value: 'var(--ifx-color-violet-500)', previewType: 'color' }),
        tok('tier-elite', { name: 'Elite', variable: '--color-tier-elite', value: 'var(--ifx-color-orange-500)', previewType: 'color' })
      ]),
      group('NHÓM SHADOW / RADIUS (L2)', [
        tok('radius-button', { name: 'Button Radius', variable: '--radius-button', value: 'var(--ifx-radius-md)', previewType: 'radius' }),
        tok('radius-card', { name: 'Card Radius', variable: '--radius-card', value: 'var(--ifx-radius-lg)', previewType: 'radius' }),
        tok('radius-modal', { name: 'Modal Radius', variable: '--radius-modal', value: 'var(--ifx-radius-lg)', previewType: 'radius' }),
        tok('shadow-card', { name: 'Card Shadow', variable: '--shadow-card', value: 'var(--ifx-shadow-sm)', previewType: 'shadow' }),
        tok('shadow-dropdown', { name: 'Dropdown Shadow', variable: '--shadow-dropdown', value: 'var(--ifx-shadow-lg)', previewType: 'shadow' }),
        tok('shadow-modal', { name: 'Modal Shadow', variable: '--shadow-modal', value: 'var(--ifx-shadow-xl)', previewType: 'shadow' })
      ])
    ], { pageTier: 'semantic', moduleOrder: 2 }));

    pages.push(filePage('semantic-business', 'semantic/business-tokens.css', 'token', [
      group('NHÓM HEATMAP (L4)', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (i) {
        return tok('heatmap-' + i, {
          name: 'Heat ' + i, group: 'NHÓM HEATMAP (L4)',
          variable: '--biz-heatmap-' + i, value: 'var(--ifx-color-chart-' + i + ')',
          previewType: 'color'
        });
      })),
      group('NHÓM SIGNAL (L4)', [
        tok('signal-confirmed', { name: 'Confirmed', variable: '--biz-signal-confirmed', value: 'var(--color-success)', previewType: 'color' }),
        tok('signal-pending', { name: 'Pending', variable: '--biz-signal-pending', value: 'var(--color-warning)', previewType: 'color' }),
        tok('signal-invalid', { name: 'Invalid', variable: '--biz-signal-invalid', value: 'var(--color-danger)', previewType: 'color' })
      ]),
      group('NHÓM PORTFOLIO (L4)', [
        tok('pf-profit', { name: 'Profit', variable: '--biz-portfolio-profit', value: 'var(--color-market-up)', previewType: 'market-up' }),
        tok('pf-loss', { name: 'Loss', variable: '--biz-portfolio-loss', value: 'var(--color-market-down)', previewType: 'market-down' })
      ]),
      group('NHÓM OPACITY (Foundation)', [
        tok('op-disabled', { name: 'Disabled', variable: '--ifx-opacity-disabled', value: '0.4', previewType: 'text' }),
        tok('op-overlay', { name: 'Overlay', variable: '--ifx-opacity-overlay', value: '0.55', previewType: 'text' }),
        tok('op-skeleton', { name: 'Skeleton', variable: '--ifx-opacity-skeleton', value: '0.3', previewType: 'text' })
      ]),
      group('NHÓM BLUR (Foundation)', [
        tok('blur-glass', { name: 'Glass', variable: '--ifx-blur-glass', value: '12px', previewType: 'text' }),
        tok('blur-backdrop', { name: 'Backdrop', variable: '--ifx-blur-backdrop', value: '8px', previewType: 'text' })
      ])
    ], { pageTier: 'semantic', moduleOrder: 3 }));

    return pages;
  }

  function buildFilePages() {
    return buildFoundationPages().concat(buildTokenPages());
  }

  var FILE_PAGES = buildFilePages();

  function allItems(pages) {
    var out = [];
    (pages || FILE_PAGES).forEach(function (pg) {
      normalizePage(pg).groups.forEach(function (g) {
        g.bundles.forEach(function (b) {
          b.properties.forEach(function (p) {
            out.push({
              id: p.id,
              name: b.groupName,
              property: p.property,
              variable: p.variable,
              value: p.value,
              previewType: b.previewType,
              status: 'ok'
            });
          });
        });
      });
    });
    return out;
  }

  function pageCounts(page) {
    var norm = normalizePage(page);
    var c = { ok: 0, partial: 0, miss: 0, total: 0 };
    norm.groups.forEach(function (g) {
      g.bundles.forEach(function (b) {
        b.properties.forEach(function () {
          c.total++;
          c.ok++;
        });
      });
    });
    return c;
  }

  function countAll(pages) {
    var c = { total: 0, ok: 0, partial: 0, miss: 0 };
    allItems(pages).forEach(function (it) {
      c.total++;
      c[it.status] = (c[it.status] || 0) + 1;
    });
    return c;
  }

  function itemKey(fileId, it) {
    return fileId + '::' + (it.id || slug(it.name));
  }

  function propKey(fileId, bundle, prop) {
    return fileId + '::' + bundle.bundleId + '::' + prop.id;
  }

  /** @deprecated use groupName on bundle */
  function assetName(page, it) {
    if (it.assetKind === 'naming') return it.name;
    if (page && page.layer === 'token') return it.variable || it.name;
    return it.name;
  }

  function pageUsesScope(page) {
    return !!(page && page.showScope);
  }

  /** Foundation + Naming: sửa Value. Token layer+: sửa Token (ref), Value tự resolve */
  function pageEditMode(page) {
    if (!page) return 'value';
    if (page.layer === 'foundation') return 'value';
    if (page.layer === 'token') return 'tokenRef';
    return 'value';
  }

  function forEachFoundationProp(fn) {
    foundationPages().forEach(function (pg) {
      normalizePage(pg).groups.forEach(function (g) {
        if (g.groupKind === 'naming') return;
        g.bundles.forEach(function (b) {
          b.properties.forEach(function (p) {
            if (!p.variable || p.variable.indexOf('naming.') === 0) return;
            fn(pg, b, p);
          });
        });
      });
    });
  }

  function getPage(id) {
    return FILE_PAGES.find(function (p) { return p.id === id; });
  }

  function foundationPages() {
    return FILE_PAGES.filter(function (p) { return p.layer === 'foundation'; })
      .sort(function (a, b) { return (a.moduleOrder || 0) - (b.moduleOrder || 0); });
  }

  function tokenPages() {
    return FILE_PAGES.filter(function (p) { return p.layer === 'token'; })
      .sort(function (a, b) { return (a.moduleOrder || 0) - (b.moduleOrder || 0); });
  }

  global.IfluxDsFtCatalog = {
    STATUS: STATUS,
    FILE_PAGES: FILE_PAGES,
    foundationPages: foundationPages,
    tokenPages: tokenPages,
    getPage: getPage,
    allItems: allItems,
    esc: esc,
    slug: slug,
    itemKey: itemKey,
    propKey: propKey,
    bundle: bundle,
    normalizePage: normalizePage,
    normalizeGroup: normalizeGroup,
    pageUsesScope: pageUsesScope,
    pageEditMode: pageEditMode,
    forEachFoundationProp: forEachFoundationProp,
    assetName: assetName,
    pageCounts: pageCounts,
    countAll: countAll,
    statusBadge: function (st) {
      var m = STATUS[st] || STATUS.miss;
      return '<span class="ds-status ' + m.cls + '">' + m.icon + ' ' + m.label + '</span>';
    }
  };
})(window);
