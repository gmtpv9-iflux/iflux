/* iFlux DS — 01 Primitive Tokens (18 nhóm) */
(function (global) {
  'use strict';
  if (global.IfluxDsPrimitiveCatalog) return;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var FS_SCALE = [
    [100, '0.625rem', '10px'], [200, '0.75rem', '12px'], [300, '0.875rem', '14px'],
    [400, '1rem', '16px'], [500, '1.125rem', '18px'], [600, '1.25rem', '20px'],
    [700, '1.5rem', '24px'], [800, '2rem', '32px'], [900, '3rem', '48px']
  ];

  function pt(id, o) {
    o = o || {};
    var token = o.token || id;
    return {
      id: id,
      name: o.name || id,
      property: o.property || 'value',
      token: token,
      cssVar: o.cssVar || ('--ifx-' + token),
      value: o.value != null ? String(o.value) : '',
      previewType: o.previewType || 'text',
      note: o.note || ''
    };
  }

  function paletteColors(prefix, label, steps) {
    return steps.map(function (s) {
      var step = s[0];
      var token = 'color-' + prefix + '-' + step;
      return pt(token, {
        name: label + ' ' + step,
        property: 'color',
        token: token,
        value: s[1],
        previewType: 'color'
      });
    });
  }

  function buildGroups() {
    return [
      {
        title: 'Color',
        items: paletteColors('slate', 'Slate', [
          ['50', '#f5f5f9'], ['100', '#ececf1'], ['200', '#cfd3ec'], ['300', '#a1acb8'],
          ['400', '#8592a3'], ['500', '#697a8d'], ['600', '#5f6582'], ['700', '#3a3b55'],
          ['800', '#2b2c40'], ['850', '#232333'], ['900', '#1e1e2d'], ['950', '#16161f']
        ]).concat(
          paletteColors('navy', 'Navy', [
            ['50', '#eef1fa'], ['100', '#d5dcf2'], ['200', '#aab8e5'], ['300', '#7f94d8'],
            ['400', '#5470cb'], ['500', '#3a56b5'], ['600', '#1b3587'], ['700', '#152a6b'],
            ['800', '#0f1f50'], ['900', '#0a1438']
          ]),
          paletteColors('orange', 'Orange', [
            ['50', '#fff4ed'], ['100', '#ffe4d1'], ['200', '#ffc9a3'], ['300', '#ffa96f'],
            ['400', '#ff8840'], ['500', '#f26522'], ['600', '#d95518'], ['700', '#b34412'],
            ['800', '#8c350e'], ['900', '#662709']
          ]),
          [
            pt('color-green-400', { name: 'Green 400', property: 'color', value: '#33b894', previewType: 'color' }),
            pt('color-green-500', { name: 'Green 500', property: 'color', value: '#00a67e', previewType: 'color' }),
            pt('color-green-600', { name: 'Green 600', property: 'color', value: '#008566', previewType: 'color' }),
            pt('color-red-400', { name: 'Red 400', property: 'color', value: '#ef5a6f', previewType: 'color' }),
            pt('color-red-500', { name: 'Red 500', property: 'color', value: '#e8304a', previewType: 'color' }),
            pt('color-red-450', { name: 'Red 450', property: 'color', value: '#ff3e1d', previewType: 'color' }),
            pt('color-red-600', { name: 'Red 600', property: 'color', value: '#c4243b', previewType: 'color' }),
            pt('color-amber-400', { name: 'Amber 400', property: 'color', value: '#fcd34d', previewType: 'color' }),
            pt('color-amber-500', { name: 'Amber 500', property: 'color', value: '#fbbf24', previewType: 'color' }),
            pt('color-amber-550', { name: 'Amber 550', property: 'color', value: '#ffab00', previewType: 'color' }),
            pt('color-amber-600', { name: 'Amber 600', property: 'color', value: '#d97706', previewType: 'color' }),
            pt('color-cyan-400', { name: 'Cyan 400', property: 'color', value: '#38d9f5', previewType: 'color' }),
            pt('color-cyan-500', { name: 'Cyan 500', property: 'color', value: '#03c3ec', previewType: 'color' }),
            pt('color-cyan-600', { name: 'Cyan 600', property: 'color', value: '#0299b8', previewType: 'color' }),
            pt('color-violet-400', { name: 'Violet 400', property: 'color', value: '#8592ff', previewType: 'color' }),
            pt('color-violet-500', { name: 'Violet 500', property: 'color', value: '#696cff', previewType: 'color' }),
            pt('color-violet-600', { name: 'Violet 600', property: 'color', value: '#5f61e6', previewType: 'color' }),
            pt('color-lime-500', { name: 'Lime 500', property: 'color', value: '#71dd37', previewType: 'color' }),
            pt('color-purple-500', { name: 'Purple 500', property: 'color', value: '#a855f7', previewType: 'color' }),
            pt('color-border-frost', { name: 'Border Frost', property: 'color', value: 'rgba(207, 211, 236, 0.12)', previewType: 'color' }),
            pt('color-scrim', { name: 'Scrim', property: 'color', token: 'color-scrim', cssVar: '--ifx-color-scrim', value: 'rgba(0, 0, 0, 0.45)', previewType: 'color' }),
            pt('color-white', { name: 'White', property: 'color', token: 'color-white', cssVar: '--ifx-color-white', value: '#ffffff', previewType: 'color' }),
            pt('color-topnav-bg', { name: 'Topnav BG', property: 'color', token: 'color-topnav-bg', cssVar: '--ifx-color-topnav-bg', value: 'rgba(43, 44, 64, 0.94)', previewType: 'color' })
          ],
          [
            ['white', '4', 'rgba(255, 255, 255, 0.04)'], ['white', '8', 'rgba(255, 255, 255, 0.08)'],
            ['white', '12', 'rgba(255, 255, 255, 0.12)'], ['white', '16', 'rgba(255, 255, 255, 0.16)'],
            ['white', '20', 'rgba(207, 211, 236, 0.2)'],
            ['black', '4', 'rgba(0, 0, 0, 0.04)'], ['black', '8', 'rgba(0, 0, 0, 0.08)'],
            ['black', '12', 'rgba(0, 0, 0, 0.12)'], ['black', '16', 'rgba(0, 0, 0, 0.16)'],
            ['black', '45', 'rgba(0, 0, 0, 0.45)'], ['black', '60', 'rgba(0, 0, 0, 0.60)'],
            ['violet', '16', 'rgba(105, 108, 255, 0.16)'], ['lime', '16', 'rgba(113, 221, 55, 0.16)'],
            ['amber', '16', 'rgba(255, 171, 0, 0.16)'], ['red', '16', 'rgba(255, 62, 29, 0.16)'],
            ['cyan', '16', 'rgba(3, 195, 236, 0.16)'],
            ['purple', '10', 'rgba(168, 85, 247, 0.10)'],
            ['orange', '14', 'rgba(242, 101, 34, 0.14)']
          ].map(function (a) {
            return pt('alpha-' + a[0] + '-' + a[1], {
              name: 'Alpha ' + a[0] + ' ' + a[1],
              property: 'color',
              token: 'alpha-' + a[0] + '-' + a[1],
              cssVar: '--ifx-alpha-' + a[0] + '-' + a[1],
              value: a[2],
              previewType: 'color'
            });
          }),
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (i) {
            var vals = ['#696cff', '#71dd37', '#ffab00', '#ff3e1d', '#03c3ec', '#f26522', '#8592ff', '#00a67e', '#e91e8c', '#b4b7bd'];
            return pt('color-chart-' + i, { name: 'Chart ' + i, property: 'color', value: vals[i - 1], previewType: 'color' });
          })
        )
      },
      {
        title: 'Font Family',
        items: [
          pt('font-family-primary', { name: 'Primary', property: 'font-family', token: 'font-family-primary', cssVar: '--ifx-font-primary', value: "'Be Vietnam Pro', system-ui, sans-serif", previewType: 'typography' }),
          pt('font-family-mono', { name: 'Monospace', property: 'font-family', token: 'font-family-mono', cssVar: '--ifx-font-mono', value: "ui-monospace, 'SF Mono', Menlo, monospace", previewType: 'typography' }),
          pt('font-family-emoji', { name: 'Emoji', property: 'font-family', token: 'font-family-emoji', cssVar: '--ifx-font-emoji', value: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'", previewType: 'typography' }),
          pt('font-family-system', { name: 'System', property: 'font-family', token: 'font-family-system', cssVar: '--ifx-font-system', value: 'system-ui, sans-serif', previewType: 'typography' })
        ]
      },
      {
        title: 'Font Size',
        items: FS_SCALE.map(function (row) {
          return pt('fs-' + row[0], {
            name: 'FS ' + row[0],
            property: 'font-size',
            token: 'fs-' + row[0],
            cssVar: '--ifx-fs-' + row[0],
            value: row[1],
            previewType: 'font-size',
            note: row[2]
          });
        })
      },
      {
        title: 'Font Weight',
        items: [
          [200, 'extralight'], [400, 'regular'], [600, 'semibold'], [800, 'extrabold']
        ].map(function (w) {
          return pt('font-weight-' + w[1], {
            name: 'Weight ' + w[0],
            property: 'font-weight',
            token: 'font-weight-' + w[1],
            cssVar: '--ifx-font-weight-' + w[1],
            value: String(w[0]),
            previewType: 'font-weight'
          });
        })
      },
      {
        title: 'Line Height',
        items: [
          ['tight', '1.25'], ['normal', '1.5'], ['relaxed', '1.625'], ['loose', '1.75']
        ].map(function (r) {
          return pt('line-height-' + r[0], {
            name: 'Line Height ' + r[0],
            property: 'line-height',
            token: 'line-height-' + r[0],
            cssVar: '--ifx-line-height-' + r[0],
            value: r[1],
            previewType: 'line-height'
          });
        }).concat(
          [[10, '0.875rem'], [12, '1rem'], [14, '1.25rem'], [16, '1.5rem'], [18, '1.75rem'],
            [20, '1.875rem'], [24, '2.25rem'], [28, '2.625rem'], [32, '2.75rem'], [40, '3.25rem'],
            [48, '3.5rem'], [56, '4rem'], [64, '4.5rem'], [72, '5rem']
          ].map(function (p) {
            return pt('line-height-' + p[0], {
              name: 'Line Height ' + p[0] + 'px',
              property: 'line-height',
              token: 'line-height-' + p[0],
              cssVar: '--ifx-line-height-' + p[0],
              value: p[1],
              previewType: 'line-height'
            });
          })
        )
      },
      {
        title: 'Letter Spacing',
        items: [
          ['tighter', '-0.02em'], ['tight', '-0.01em'], ['normal', '0'],
          ['wide', '0.01em'], ['wider', '0.02em'], ['caps', '0.06em']
        ].map(function (r) {
          return pt('letter-spacing-' + r[0], {
            name: 'Tracking ' + r[0],
            property: 'letter-spacing',
            token: 'letter-spacing-' + r[0],
            cssVar: '--ifx-letter-spacing-' + r[0],
            value: r[1],
            previewType: 'letter-spacing'
          });
        })
      },
      {
        title: 'Paragraph Spacing',
        items: [
          pt('paragraph-spacing', { name: 'Paragraph Spacing', property: 'paragraph-spacing', token: 'paragraph-spacing', cssVar: '--ifx-paragraph-spacing', value: '1em', previewType: 'spacing' }),
          pt('paragraph-indent', { name: 'Paragraph Indent', property: 'paragraph-indent', token: 'paragraph-indent', cssVar: '--ifx-paragraph-indent', value: '1.5em', previewType: 'spacing' })
        ]
      },
      {
        title: 'Spacing',
        items: [
          pt('space-unit', { name: 'Base Unit', property: 'spacing', token: 'space-unit', cssVar: '--ifx-space-unit', value: '4px', previewType: 'spacing' })
        ].concat([0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128, 160, 192, 256, 320].map(function (n) {
          return pt('space-' + n, {
            name: 'Space ' + n,
            property: 'spacing',
            token: 'space-' + n,
            cssVar: '--ifx-space-' + n,
            value: n === 0 ? '0' : (n / 16) + 'rem',
            previewType: 'spacing'
          });
        }))
      },
      {
        title: 'Radius',
        items: [
          ['none', '0'], ['xs', '2px'], ['sm', '4px'], ['md', '6px'], ['lg', '8px'],
          ['xl', '12px'], ['2xl', '16px'], ['full', '9999px']
        ].map(function (r) {
          return pt('radius-' + r[0], {
            name: 'Radius ' + r[0],
            property: 'radius',
            token: 'radius-' + r[0],
            cssVar: '--ifx-radius-' + r[0],
            value: r[1],
            previewType: 'radius'
          });
        })
      },
      {
        title: 'Border Width',
        items: [
          ['0', '0'], ['1', '1px'], ['2', '2px'], ['4', '4px']
        ].map(function (r) {
          return pt('border-width-' + r[0], {
            name: 'Border ' + r[0],
            property: 'border-width',
            token: 'border-width-' + r[0],
            cssVar: '--ifx-border-width-' + r[0],
            value: r[1],
            previewType: 'border-width'
          });
        })
      },
      {
        title: 'Opacity',
        items: [
          ['0', '0'], ['10', '0.1'], ['25', '0.25'], ['40', '0.4'], ['55', '0.55'],
          ['72', '0.72'], ['100', '1']
        ].map(function (r) {
          return pt('opacity-' + r[0], {
            name: 'Opacity ' + r[0],
            property: 'opacity',
            token: 'opacity-' + r[0],
            cssVar: '--ifx-opacity-' + r[0],
            value: r[1],
            previewType: 'opacity'
          });
        }).concat([
          pt('opacity-disabled', { name: 'Disabled', property: 'opacity', token: 'opacity-disabled', cssVar: '--ifx-opacity-disabled', value: '0.4', previewType: 'opacity' }),
          pt('opacity-overlay', { name: 'Overlay', property: 'opacity', token: 'opacity-overlay', cssVar: '--ifx-opacity-overlay', value: '0.55', previewType: 'opacity' }),
          pt('opacity-skeleton', { name: 'Skeleton', property: 'opacity', token: 'opacity-skeleton', cssVar: '--ifx-opacity-skeleton', value: '0.3', previewType: 'opacity' })
        ])
      },
      {
        title: 'Shadow',
        items: ['xs', 'sm', 'md', 'lg', 'xl'].map(function (s) {
          var alphas = { xs: '8', sm: '8', md: '12', lg: '16', xl: '16' };
          return pt('shadow-' + s, {
            name: 'Shadow ' + s.toUpperCase(),
            property: 'shadow',
            token: 'shadow-' + s,
            cssVar: '--ifx-shadow-' + s,
            value: '0 4px 16px var(--ifx-alpha-black-' + alphas[s] + ')',
            previewType: 'shadow'
          });
        })
      },
      {
        title: 'Blur',
        items: [
          pt('blur-sm', { name: 'Blur SM', property: 'blur', token: 'blur-sm', cssVar: '--ifx-blur-sm', value: '4px', previewType: 'blur' }),
          pt('blur-backdrop', { name: 'Backdrop', property: 'blur', token: 'blur-backdrop', cssVar: '--ifx-blur-backdrop', value: '8px', previewType: 'blur' }),
          pt('blur-glass', { name: 'Glass', property: 'blur', token: 'blur-glass', cssVar: '--ifx-blur-glass', value: '12px', previewType: 'blur' })
        ]
      },
      {
        title: 'Duration',
        items: [
          ['instant', '0ms'], ['fast', '100ms'], ['normal', '200ms'], ['slow', '300ms'], ['slower', '400ms']
        ].map(function (r) {
          return pt('duration-' + r[0], {
            name: 'Duration ' + r[0],
            property: 'duration',
            token: 'duration-' + r[0],
            cssVar: '--ifx-duration-' + r[0],
            value: r[1],
            previewType: 'duration'
          });
        })
      },
      {
        title: 'Easing',
        items: [
          ['default', 'cubic-bezier(0.4, 0, 0.2, 1)'],
          ['in', 'cubic-bezier(0.4, 0, 1, 1)'],
          ['out', 'cubic-bezier(0, 0, 0.2, 1)'],
          ['in-out', 'cubic-bezier(0.4, 0, 0.2, 1)']
        ].map(function (r) {
          return pt('ease-' + r[0], {
            name: 'Ease ' + r[0],
            property: 'easing',
            token: 'ease-' + r[0],
            cssVar: '--ifx-ease-' + r[0],
            value: r[1],
            previewType: 'easing'
          });
        })
      },
      {
        title: 'Z-index',
        items: [
          ['base', 0], ['raised', 1], ['dropdown', 100], ['sticky', 200], ['topnav', 220],
          ['drawer', 230], ['overlay', 240], ['modal', 300], ['toast', 400], ['onboarding', 500]
        ].map(function (z) {
          return pt('z-' + z[0], {
            name: 'Z ' + z[0],
            property: 'z-index',
            token: 'z-' + z[0],
            cssVar: '--ifx-z-' + z[0],
            value: String(z[1]),
            previewType: 'z-index'
          });
        })
      },
      {
        title: 'Breakpoints',
        items: [
          ['xs', '375px'], ['sm', '640px'], ['md', '768px'], ['lg', '1024px'], ['xl', '1280px'], ['2xl', '1440px'], ['3xl', '1600px']
        ].map(function (bp) {
          return pt('bp-' + bp[0], {
            name: 'Breakpoint ' + bp[0],
            property: 'breakpoint',
            token: 'bp-' + bp[0],
            cssVar: '--ifx-bp-' + bp[0],
            value: bp[1],
            previewType: 'breakpoint'
          });
        })
      },
      {
        title: 'Grid',
        items: [
          pt('grid-gutter', { name: 'Grid Gutter', property: 'grid-gap', token: 'grid-gutter', cssVar: '--ifx-grid-gutter', value: 'var(--ifx-space-24)', previewType: 'spacing' }),
          pt('grid-col-gap', { name: 'Column Gap', property: 'grid-gap', token: 'grid-col-gap', cssVar: '--ifx-grid-col-gap', value: 'var(--ifx-space-16)', previewType: 'spacing' }),
          pt('grid-row-gap', { name: 'Row Gap', property: 'grid-gap', token: 'grid-row-gap', cssVar: '--ifx-grid-row-gap', value: 'var(--ifx-space-24)', previewType: 'spacing' }),
          pt('grid-container-margin', { name: 'Container Margin', property: 'spacing', token: 'grid-container-margin', cssVar: '--ifx-container-margin', value: 'var(--ifx-space-24)', previewType: 'spacing' }),
          pt('grid-columns-12', { name: 'Columns 12', property: 'grid-columns', token: 'grid-columns-12', value: '12', previewType: 'text' }),
          pt('grid-columns-auto', { name: 'Auto Fit Min 220px', property: 'grid-columns', token: 'grid-columns-auto', value: 'repeat(auto-fit, minmax(220px, 1fr))', previewType: 'text' })
        ]
      }
    ];
  }

  var PAGE = {
    id: 'primitive-tokens',
    file: 'Primitive Tokens',
    path: 'primitives/',
    layer: 'primitive',
    editMode: 'tokenValue',
    groups: buildGroups()
  };

  function propKey(groupTitle, item) {
    return 'primitive-tokens::' + groupTitle + '::' + item.id;
  }

  function pageCounts() {
    var total = 0;
    PAGE.groups.forEach(function (g) { total += g.items.length; });
    return { total: total, ok: total, partial: 0, miss: 0 };
  }

  var _tokenIndex = null;
  var _propertyIndex = null;
  var _cssVarIndex = null;
  var _primitiveOverrides = {};

  function rebuildIndex() {
    _tokenIndex = {};
    _propertyIndex = {};
    _cssVarIndex = {};
    PAGE.groups.forEach(function (group) {
      group.items.forEach(function (item) {
        var entry = {
          id: item.id,
          name: item.name,
          property: item.property,
          token: item.token,
          cssVar: item.cssVar,
          value: item.value,
          previewType: item.previewType,
          groupTitle: group.title
        };
        _tokenIndex[item.token] = entry;
        _tokenIndex[item.id] = entry;
        if (entry.cssVar) _cssVarIndex[entry.cssVar] = entry;
        if (!_propertyIndex[item.property]) _propertyIndex[item.property] = [];
        _propertyIndex[item.property].push(entry);
      });
    });
  }

  function ensureIndex() {
    if (!_tokenIndex) rebuildIndex();
  }

  function setPrimitiveOverrides(map) {
    _primitiveOverrides = map || {};
  }

  function resolveToken(tokenId) {
    ensureIndex();
    var base = _tokenIndex[tokenId];
    if (!base) return { token: tokenId || '', value: '', cssVar: tokenToCssVar(tokenId) };
    var ov = null;
    Object.keys(_primitiveOverrides).some(function (k) {
      var o = _primitiveOverrides[k];
      if (o && (o.token === tokenId || k.indexOf('::' + tokenId) >= 0)) {
        ov = o;
        return true;
      }
      return false;
    });
    if (!ov) {
      var pk = propKey(base.groupTitle, base);
      ov = _primitiveOverrides[pk];
    }
    return {
      token: (ov && ov.token) ? ov.token : base.token,
      value: (ov && ov.value != null) ? ov.value : base.value,
      cssVar: (ov && ov.cssVar) ? ov.cssVar : base.cssVar,
      previewType: base.previewType,
      name: base.name,
      property: base.property
    };
  }

  function tokenToCssVar(token) {
    if (!token) return '';
    if (token.indexOf('--') === 0) return token;
    return '--ifx-' + token;
  }

  function resolveLiteralValue(tokenId, seen) {
    ensureIndex();
    seen = seen || {};
    if (!tokenId || seen[tokenId]) return '';
    seen[tokenId] = true;
    var resolved = resolveToken(tokenId);
    var val = String(resolved.value != null ? resolved.value : '');
    if (!/var\(/i.test(val)) return val;
    return val.replace(/var\(\s*(--[a-zA-Z0-9-]+)\s*\)/g, function (full, cssVar) {
      var ref = _cssVarIndex[cssVar];
      if (!ref) return full;
      return resolveLiteralValue(ref.token, seen);
    });
  }

  function getTokensByProperty(property) {
    ensureIndex();
    return (_propertyIndex[property] || []).slice();
  }

  function getAllTokens() {
    ensureIndex();
    return Object.keys(_tokenIndex).filter(function (k) {
      return _tokenIndex[k].token === k;
    }).map(function (k) { return _tokenIndex[k]; });
  }

  global.IfluxDsPrimitiveCatalog = {
    esc: esc,
    PAGE: PAGE,
    propKey: propKey,
    pageCounts: pageCounts,
    getTokensByProperty: getTokensByProperty,
    getAllTokens: getAllTokens,
    resolveToken: resolveToken,
    resolveLiteralValue: resolveLiteralValue,
    setPrimitiveOverrides: setPrimitiveOverrides,
    tokenToCssVar: tokenToCssVar,
    rebuildIndex: rebuildIndex
  };
  rebuildIndex();
})(window);
