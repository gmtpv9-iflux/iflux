/* iFlux DS — Atoms (Component tokens) · Shared Admin + User · GĐ1 + GĐ2 */
(function (global) {
  'use strict';
  if (global.IfluxDsAtomsCatalog) return;

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

  function atom(id, name, logicalId, className, surface, previewType, properties, opts) {
    opts = opts || {};
    return {
      id: id,
      name: name,
      logicalId: logicalId,
      className: className,
      surface: surface || 'shared',
      previewType: previewType || 'generic',
      previewLabel: opts.previewLabel || opts.label || name,
      anatomy: opts.anatomy || '',
      file: opts.file || 'iflux-admin-ui/components.css',
      properties: properties || []
    };
  }

  function btnProps(bgSemantic, colorSemantic, extra) {
    var base = [
      sem('background', bgSemantic, '--ifx-atom-btn-bg'),
      sem('color', colorSemantic, '--ifx-atom-btn-color'),
      prim('padding-y', 'space-8', '--ifx-space-button-y', 'spacing'),
      prim('padding-x', 'space-16', '--ifx-space-button-x', 'spacing'),
      prim('radius', 'radius-md', '--ix-radius', 'radius'),
      prim('font-size', 'fs-200', '--ifx-text-btn-md-size', 'font-size')
    ];
    return extra ? base.concat(extra) : base;
  }

  function badgeProps(bgSemantic, colorSemantic) {
    return [
      sem('background', bgSemantic, '--ifx-atom-badge-bg'),
      sem('color', colorSemantic, '--ifx-atom-badge-color'),
      prim('padding-y', 'space-4', '--ifx-space-badge-y', 'spacing'),
      prim('padding-x', 'space-8', '--ifx-space-badge-x', 'spacing'),
      prim('radius', 'radius-full', '--ifx-atom-badge-radius', 'radius'),
      prim('font-size', 'fs-100', '--ifx-font-size-10', 'font-size')
    ];
  }

  function chipProps(bgSemantic, colorSemantic, outline) {
    if (outline) {
      return [
        sem('border-color', 'border.default', '--ifx-atom-chip-border'),
        sem('color', 'text.secondary', '--ifx-atom-chip-color'),
        prim('padding-y', 'space-4', '--ifx-space-chip-y', 'spacing'),
        prim('padding-x', 'space-12', '--ifx-space-chip-x', 'spacing'),
        prim('radius', 'radius-full', '--ifx-atom-chip-radius', 'radius')
      ];
    }
    return [
      sem('background', bgSemantic, '--ifx-atom-chip-bg'),
      sem('color', colorSemantic, '--ifx-atom-chip-color'),
      prim('padding-y', 'space-4', '--ifx-space-chip-y', 'spacing'),
      prim('padding-x', 'space-12', '--ifx-space-chip-x', 'spacing'),
      prim('radius', 'radius-full', '--ifx-atom-chip-radius', 'radius')
    ];
  }

  function inputProps() {
    return [
      sem('background', 'surface.input', '--ifx-atom-input-bg'),
      sem('color', 'text.primary', '--ifx-atom-input-color'),
      sem('border-color', 'border.default', '--ifx-atom-input-border'),
      prim('padding-y', 'space-12', '--ifx-space-input-y', 'spacing'),
      prim('padding-x', 'space-12', '--ifx-space-input-x', 'spacing'),
      prim('radius', 'radius-md', '--ix-radius', 'radius'),
      prim('font-size', 'fs-300', '--ifx-font-size-14', 'font-size')
    ];
  }

  function buildGroups() {
    return [
      {
        title: 'Buttons',
        items: [
          atom('btn-primary', 'Primary Button', 'button.primary', 'ix-btn ix-btn-primary', 'shared', 'button', btnProps('action.primary', 'text.on.primary'), { anatomy: 'icon?, label' }),
          atom('btn-secondary', 'Secondary Button', 'button.secondary', 'ix-btn ix-btn-secondary', 'shared', 'button', btnProps('action.secondary', 'text.on.primary'), { file: 'atoms-extensions.css' }),
          atom('btn-success', 'Success Button', 'button.success', 'ix-btn ix-btn-success', 'shared', 'button', btnProps('status.success', 'text.on.success')),
          atom('btn-danger', 'Danger Button', 'button.danger', 'ix-btn ix-btn-danger', 'shared', 'button', btnProps('status.error', 'text.on.danger')),
          atom('btn-warning', 'Warning Button', 'button.warning', 'ix-btn ix-btn-warning', 'shared', 'button', btnProps('status.warning', 'text.on.warning')),
          atom('btn-outline', 'Outline Button', 'button.outline', 'ix-btn ix-btn-outline', 'shared', 'button', [
            sem('color', 'text.secondary', '--ifx-atom-btn-outline-color'),
            sem('border-color', 'border.default', '--ifx-atom-btn-outline-border'),
            prim('padding-y', 'space-8', '--ifx-space-button-y', 'spacing'),
            prim('padding-x', 'space-16', '--ifx-space-button-x', 'spacing'),
            prim('radius', 'radius-md', '--ix-radius', 'radius')
          ]),
          atom('btn-ghost', 'Ghost Button', 'button.ghost', 'ix-btn ix-btn-ghost', 'shared', 'button', [
            sem('color', 'text.secondary', '--ifx-atom-btn-ghost-color'),
            prim('padding-y', 'space-8', '--ifx-space-button-y', 'spacing'),
            prim('padding-x', 'space-16', '--ifx-space-button-x', 'spacing')
          ]),
          atom('btn-text', 'Text Button', 'button.text', 'ix-btn ix-btn-text', 'shared', 'button', [
            sem('color', 'text.link', '--ifx-atom-btn-text-color'),
            prim('font-size', 'fs-200', '--ifx-text-btn-md-size', 'font-size')
          ], { file: 'atoms-extensions.css' }),
          atom('btn-icon', 'Icon Button', 'button.icon', 'ix-btn ix-btn-icon', 'shared', 'button-icon', [
            sem('color', 'text.secondary', '--ifx-atom-btn-icon-color'),
            prim('radius', 'radius-md', '--ix-radius', 'radius')
          ], { anatomy: 'icon' }),
          atom('btn-fab', 'Floating Button', 'button.floating', 'ix-btn ix-btn-fab', 'shared', 'button-icon', btnProps('action.primary', 'text.on.primary'), { file: 'atoms-extensions.css', anatomy: 'icon' }),
          atom('btn-split', 'Split Button', 'button.split', 'ix-btn ix-btn-split', 'shared', 'button', btnProps('action.primary', 'text.on.primary'), { file: 'atoms-extensions.css', anatomy: 'label, chevron' }),
          atom('btn-toggle', 'Toggle Button', 'button.toggle', 'ix-btn ix-btn-toggle', 'shared', 'button', btnProps('surface.active', 'action.primary'), { file: 'atoms-extensions.css', anatomy: 'label' })
        ]
      },
      {
        title: 'Inputs',
        items: [
          atom('input-text', 'Text Input', 'input.text', 'ix-input', 'shared', 'input', inputProps(), { previewLabel: 'Nhập text…' }),
          atom('input-number', 'Number Input', 'input.number', 'ix-input ix-input-number', 'shared', 'input', inputProps(), { file: 'atoms-extensions.css', previewLabel: '0' }),
          atom('input-password', 'Password Input', 'input.password', 'ix-input ix-input-password', 'shared', 'input', inputProps(), { previewLabel: '••••••' }),
          atom('input-search', 'Search Input', 'input.search', 'ix-input ix-input-search', 'shared', 'input', inputProps(), { file: 'atoms-extensions.css', previewLabel: 'Tìm kiếm…' }),
          atom('input-textarea', 'Textarea', 'input.textarea', 'ix-textarea', 'shared', 'textarea', inputProps(), { previewLabel: 'Nội dung…' }),
          atom('input-currency', 'Currency Input', 'input.currency', 'ix-input ix-input-currency', 'shared', 'input', inputProps(), { file: 'atoms-extensions.css', previewLabel: '1,000,000 ₫' }),
          atom('input-percent', 'Percentage Input', 'input.percent', 'ix-input ix-input-percent', 'shared', 'input', inputProps(), { file: 'atoms-extensions.css', previewLabel: '12.5%' })
        ]
      },
      {
        title: 'Selection',
        items: [
          atom('checkbox', 'Checkbox', 'selection.checkbox', 'ix-checkbox', 'shared', 'checkbox', [
            sem('border-color', 'border.default', '--ifx-atom-checkbox-border'),
            sem('background', 'action.primary', '--ifx-atom-checkbox-checked-bg')
          ], { anatomy: 'box, label?' }),
          atom('radio', 'Radio', 'selection.radio', 'ix-radio', 'shared', 'radio', [
            sem('border-color', 'border.default', '--ifx-atom-radio-border'),
            sem('background', 'action.primary', '--ifx-atom-radio-checked-bg')
          ], { file: 'atoms-extensions.css' }),
          atom('switch', 'Switch', 'selection.switch', 'ix-switch', 'shared', 'switch', [
            sem('background', 'border.default', '--ifx-atom-switch-track'),
            sem('color', 'action.primary', '--ifx-atom-switch-active')
          ]),
          atom('segmented', 'Segmented Control', 'selection.segmented', 'ix-segmented', 'shared', 'segmented', [
            sem('background', 'surface.subtle', '--ifx-atom-segmented-bg'),
            sem('color', 'text.secondary', '--ifx-atom-segmented-color'),
            prim('radius', 'radius-md', '--ix-radius', 'radius')
          ], { file: 'atoms-extensions.css', previewLabel: 'Tab A | Tab B' })
        ]
      },
      {
        title: 'Dropdown',
        items: [
          atom('select', 'Select', 'dropdown.select', 'ix-select', 'shared', 'select', inputProps()),
          atom('multiselect', 'Multi Select', 'dropdown.multiselect', 'ix-multiselect', 'shared', 'select', inputProps(), { file: 'atoms-extensions.css' }),
          atom('combobox', 'Combobox', 'dropdown.combobox', 'ix-combobox', 'shared', 'select', inputProps(), { file: 'atoms-extensions.css' })
        ]
      },
      {
        title: 'Date & Time',
        items: [
          atom('datepicker', 'Date Picker', 'datetime.date', 'ix-datepicker', 'shared', 'input', inputProps(), { file: 'atoms-extensions.css', previewLabel: 'dd/mm/yyyy' }),
          atom('timepicker', 'Time Picker', 'datetime.time', 'ix-timepicker', 'shared', 'input', inputProps(), { file: 'atoms-extensions.css', previewLabel: '14:30' }),
          atom('datetimepicker', 'DateTime Picker', 'datetime.datetime', 'ix-datetimepicker', 'shared', 'input', inputProps(), { file: 'atoms-extensions.css', previewLabel: 'dd/mm/yyyy 14:30' })
        ]
      },
      {
        title: 'Labels',
        items: [
          atom('label', 'Label', 'label.default', 'ix-label', 'shared', 'label', [
            sem('color', 'text.secondary', '--ifx-atom-label-color'),
            prim('font-size', 'fs-300', '--ifx-font-size-14', 'font-size'),
            prim('font-weight', 'font-weight-medium', '--ifx-font-weight-medium', 'font-weight')
          ]),
          atom('caption', 'Caption', 'label.caption', 'ix-caption', 'shared', 'label', [
            sem('color', 'text.muted', '--ifx-atom-caption-color'),
            prim('font-size', 'fs-200', '--ifx-font-size-12', 'font-size')
          ], { file: 'atoms-extensions.css' }),
          atom('helper', 'Helper Text', 'label.helper', 'ix-helper-text', 'shared', 'label', [
            sem('color', 'text.muted', '--ifx-atom-helper-color'),
            prim('font-size', 'fs-200', '--ifx-font-size-12', 'font-size')
          ], { file: 'atoms-extensions.css' }),
          atom('field-title', 'Field Title', 'label.field-title', 'ix-field-title', 'shared', 'label', [
            sem('color', 'text.primary', '--ifx-atom-field-title-color'),
            prim('font-size', 'fs-300', '--ifx-font-size-14', 'font-size'),
            prim('font-weight', 'font-weight-semibold', '--ifx-font-weight-semibold', 'font-weight')
          ], { file: 'atoms-extensions.css' })
        ]
      },
      {
        title: 'Badge',
        items: [
          atom('badge-primary', 'Primary Badge', 'badge.primary', 'ix-badge ix-badge-primary', 'shared', 'badge', badgeProps('action.primary', 'text.on.primary')),
          atom('badge-success', 'Success Badge', 'badge.success', 'ix-badge ix-badge-success', 'shared', 'badge', badgeProps('status.success', 'text.on.success')),
          atom('badge-danger', 'Danger Badge', 'badge.danger', 'ix-badge ix-badge-danger', 'shared', 'badge', badgeProps('status.error', 'text.on.danger')),
          atom('badge-warning', 'Warning Badge', 'badge.warning', 'ix-badge ix-badge-warning', 'shared', 'badge', badgeProps('status.warning', 'text.on.warning')),
          atom('badge-info', 'Info Badge', 'badge.info', 'ix-badge ix-badge-info', 'shared', 'badge', badgeProps('status.info', 'text.on.info')),
          atom('badge-dot', 'Dot Badge', 'badge.dot', 'ix-badge-dot', 'shared', 'badge-dot', [
            sem('background', 'status.error', '--ifx-atom-badge-dot-bg')
          ], { file: 'atoms-extensions.css', anatomy: 'dot' }),
          atom('badge-count', 'Count Badge', 'badge.count', 'ix-badge-count', 'shared', 'badge', badgeProps('status.error', 'text.on.danger'), { file: 'atoms-extensions.css', previewLabel: '9+' }),
          atom('badge-status', 'Status Badge', 'badge.status', 'ix-badge-status', 'shared', 'badge', badgeProps('status.success', 'text.on.success'), { file: 'atoms-extensions.css', previewLabel: 'Live' })
        ]
      },
      {
        title: 'Avatar',
        items: [
          atom('avatar-sm', 'Avatar SM', 'avatar.sm', 'ix-avatar ix-avatar-sm', 'shared', 'avatar', [
            sem('background', 'action.primary.soft', '--ifx-atom-avatar-bg'),
            sem('color', 'action.primary', '--ifx-atom-avatar-color'),
            prim('font-size', 'fs-100', '--ifx-font-size-10', 'font-size')
          ], { previewLabel: 'NV' }),
          atom('avatar-md', 'Avatar MD', 'avatar.md', 'ix-avatar ix-avatar-md', 'shared', 'avatar', [
            sem('background', 'action.primary.soft', '--ifx-atom-avatar-bg'),
            sem('color', 'action.primary', '--ifx-atom-avatar-color')
          ], { previewLabel: 'NV' }),
          atom('avatar-lg', 'Avatar LG', 'avatar.lg', 'ix-avatar ix-avatar-lg', 'shared', 'avatar', [
            sem('background', 'action.primary.soft', '--ifx-atom-avatar-bg'),
            sem('color', 'action.primary', '--ifx-atom-avatar-color')
          ], { previewLabel: 'NV' }),
          atom('avatar-group', 'Avatar Group', 'avatar.group', 'ix-avatar-group', 'shared', 'avatar-group', [], { anatomy: 'avatar×n, +count' })
        ]
      },
      {
        title: 'Progress',
        items: [
          atom('progress', 'Progress Bar', 'progress.bar', 'ix-progress', 'shared', 'progress', [
            sem('background', 'surface.input', '--ifx-atom-progress-track'),
            sem('color', 'action.primary', '--ifx-atom-progress-fill'),
            prim('radius', 'radius-sm', '--ifx-radius-sm', 'radius')
          ]),
          atom('progress-circle', 'Circular Progress', 'progress.circle', 'ix-progress-circle', 'shared', 'progress-circle', [
            sem('color', 'action.primary', '--ifx-atom-progress-circle')
          ], { file: 'atoms-extensions.css' }),
          atom('skeleton', 'Skeleton', 'progress.skeleton', 'ix-skeleton', 'shared', 'skeleton', [
            sem('background', 'surface.elevated', '--ifx-atom-skeleton-bg'),
            prim('radius', 'radius-md', '--ix-radius', 'radius')
          ], { file: 'atoms-extensions.css' })
        ]
      },
      {
        title: 'Indicator',
        items: [
          atom('spinner', 'Spinner', 'indicator.spinner', 'ix-spinner', 'shared', 'spinner', [
            sem('color', 'action.primary', '--ifx-atom-spinner-color')
          ], { file: 'atoms-extensions.css' }),
          atom('loader', 'Loader', 'indicator.loader', 'ix-loader', 'shared', 'spinner', [
            sem('color', 'text.muted', '--ifx-atom-loader-color')
          ], { file: 'atoms-extensions.css' }),
          atom('pulse', 'Pulse', 'indicator.pulse', 'ix-pulse', 'shared', 'pulse', [
            sem('background', 'action.primary', '--ifx-atom-pulse-color')
          ], { file: 'atoms-extensions.css' }),
          atom('nav-dot', 'Status Dot', 'indicator.dot', 'ix-nav-dot', 'shared', 'dot', [
            sem('background', 'status.success', '--ifx-atom-dot-bg')
          ])
        ]
      },
      {
        title: 'Divider',
        items: [
          atom('divider-h', 'Horizontal Divider', 'divider.horizontal', 'ix-divider', 'shared', 'divider', [
            sem('border-color', 'border.default', '--ifx-atom-divider-color')
          ]),
          atom('divider-v', 'Vertical Divider', 'divider.vertical', 'ix-divider ix-divider-vertical', 'shared', 'divider', [
            sem('border-color', 'border.default', '--ifx-atom-divider-color')
          ], { file: 'atoms-extensions.css' })
        ]
      },
      {
        title: 'Chip',
        items: [
          atom('chip-primary', 'Primary Chip', 'chip.primary', 'ix-chip ix-chip-primary', 'shared', 'chip', chipProps('action.primary.soft', 'action.primary')),
          atom('chip-success', 'Success Chip', 'chip.success', 'ix-chip ix-chip-success', 'shared', 'chip', chipProps('status.success.soft', 'status.success')),
          atom('chip-warning', 'Warning Chip', 'chip.warning', 'ix-chip ix-chip-warning', 'shared', 'chip', chipProps('status.warning.soft', 'status.warning')),
          atom('chip-danger', 'Danger Chip', 'chip.danger', 'ix-chip ix-chip-danger', 'shared', 'chip', chipProps('status.error.soft', 'status.error')),
          atom('chip-outline', 'Outline Chip', 'chip.outline', 'ix-chip ix-chip-outline', 'shared', 'chip', chipProps(null, null, true)),
          atom('chip-filter', 'Filter Chip', 'chip.filter', 'ix-chip ix-chip-filter', 'shared', 'chip', chipProps('surface.active', 'action.primary'), { file: 'atoms-extensions.css' }),
          atom('chip-tag', 'Tag Chip', 'chip.tag', 'ix-chip ix-chip-tag', 'shared', 'chip', chipProps('surface.subtle', 'text.secondary'), { file: 'atoms-extensions.css' })
        ]
      },
      {
        title: 'Pill',
        items: [
          atom('pill', 'Pill', 'pill.default', 'ix-pill', 'shared', 'pill', chipProps('surface.subtle', 'text.primary'), { file: 'atoms-extensions.css' }),
          atom('pill-status', 'Status Pill', 'pill.status', 'ix-pill ix-pill-status', 'shared', 'pill', chipProps('status.success.soft', 'status.success'), { file: 'atoms-extensions.css', previewLabel: 'Active' })
        ]
      },
      {
        title: 'Tooltip & Link',
        items: [
          atom('tooltip', 'Tooltip', 'tooltip.default', 'ix-tooltip', 'shared', 'tooltip', [
            sem('background', 'surface.elevated', '--ifx-atom-tooltip-bg'),
            sem('color', 'text.primary', '--ifx-atom-tooltip-color'),
            prim('font-size', 'fs-200', '--ifx-font-size-12', 'font-size'),
            prim('radius', 'radius-md', '--ix-radius', 'radius')
          ], { file: 'atoms-extensions.css', previewLabel: 'Tooltip' }),
          atom('link', 'Link', 'link.default', 'ix-link', 'shared', 'link', [
            sem('color', 'text.link', '--ifx-atom-link-color'),
            prim('font-size', 'fs-300', '--ifx-font-size-14', 'font-size')
          ], { file: 'atoms-extensions.css', previewLabel: 'Xem thêm' }),
          atom('link-external', 'External Link', 'link.external', 'ix-link ix-link-external', 'shared', 'link', [
            sem('color', 'text.link', '--ifx-atom-link-color')
          ], { file: 'atoms-extensions.css', previewLabel: 'Mở tab mới' })
        ]
      },
      {
        title: 'Media',
        items: [
          atom('image', 'Image', 'media.image', 'ix-image', 'shared', 'image', [
            prim('radius', 'radius-md', '--ix-radius', 'radius'),
            sem('background', 'surface.subtle', '--ifx-atom-image-bg')
          ], { file: 'atoms-extensions.css' })
        ]
      },
      {
        title: 'Financial Display',
        note: 'Shared Admin + User · typography + market semantic',
        items: [
          atom('price-m', 'Price M', 'financial.price.m', 'ifx-typo-price-m', 'shared', 'price', [
            prim('font-size', 'fs-700', '--ifx-text-price-m-size', 'font-size'),
            prim('font-weight', 'font-weight-bold', '--ifx-text-price-m-weight', 'font-weight'),
            sem('color', 'text.primary', '--ifx-atom-price-color')
          ], { file: 'typography.css', previewLabel: '24,500' }),
          atom('price-s', 'Price S', 'financial.price.s', 'ifx-typo-price-s', 'shared', 'price', [
            prim('font-size', 'fs-400', '--ifx-text-price-s-size', 'font-size'),
            sem('color', 'text.primary', '--ifx-atom-price-color')
          ], { file: 'typography.css', previewLabel: '24.5' }),
          atom('percent-up', 'Percent Up', 'financial.percent.up', 'ifx-typo-percentage is-up', 'shared', 'percent-up', [
            prim('font-size', 'fs-400', '--ifx-text-percentage-size', 'font-size'),
            sem('color', 'market.price.up', '--ifx-atom-percent-up')
          ], { file: 'typography.css', previewLabel: '+2.35%' }),
          atom('percent-down', 'Percent Down', 'financial.percent.down', 'ifx-typo-percentage is-down', 'shared', 'percent-down', [
            prim('font-size', 'fs-400', '--ifx-text-percentage-size', 'font-size'),
            sem('color', 'market.price.down', '--ifx-atom-percent-down')
          ], { file: 'typography.css', previewLabel: '-1.12%' }),
          atom('volume', 'Volume', 'financial.volume', 'ifx-typo-volume', 'shared', 'volume', [
            prim('font-size', 'fs-300', '--ifx-text-volume-size', 'font-size'),
            sem('color', 'text.muted', '--ifx-atom-volume-color')
          ], { file: 'typography.css', previewLabel: '1.2M' }),
          atom('money', 'Money', 'financial.money', 'ifx-typo-money', 'shared', 'money', [
            prim('font-size', 'fs-400', '--ifx-text-money-size', 'font-size'),
            sem('color', 'text.primary', '--ifx-atom-money-color')
          ], { file: 'typography.css', previewLabel: '₫1.5B' }),
          atom('tier-free', 'Tier Free Chip', 'financial.tier.free', 'ix-chip ix-chip-tier-free', 'shared', 'chip', chipProps('surface.subtle', 'text.muted'), { file: 'atoms-extensions.css', previewLabel: 'Free' }),
          atom('tier-premium', 'Tier Premium Chip', 'financial.tier.premium', 'ix-chip ix-chip-tier-premium', 'shared', 'chip', chipProps('action.primary.soft', 'membership.premium'), { file: 'atoms-extensions.css', previewLabel: 'Premium' }),
          atom('tier-elite', 'Tier Elite Chip', 'financial.tier.elite', 'ix-chip ix-chip-tier-elite', 'shared', 'chip', chipProps('status.warning.soft', 'membership.elite'), { file: 'atoms-extensions.css', previewLabel: 'Elite' })
        ]
      },
      {
        title: 'User Web',
        note: 'User-specific affordances · vẫn dùng ix-* base',
        items: [
          atom('ifx-block-btn', 'Block User Button', 'user.block-button', 'ix-btn ix-btn-outline ifx-btn-block', 'user', 'button', [
            sem('border-color', 'border.default', '--ifx-atom-block-btn-border'),
            sem('color', 'text.secondary', '--ifx-atom-block-btn-color')
          ], { file: 'profile.css', previewLabel: 'Chặn' }),
          atom('ifx-paywall-lock', 'Paywall Lock', 'user.paywall-lock', 'ifx-lock-badge', 'user', 'badge', [
            sem('background', 'surface.elevated', '--ifx-atom-lock-bg'),
            sem('color', 'membership.premium', '--ifx-atom-lock-color')
          ], { file: 'atoms-extensions.css', previewLabel: 'Premium' })
        ]
      }
    ];
  }

  var PAGE = {
    id: 'atoms',
    file: 'Atoms',
    subtitle: 'Component Tokens',
    layer: 'atoms',
    editMode: 'componentRef',
    groups: buildGroups()
  };

  function propKey(groupTitle, bundle, property) {
    return 'atoms::' + groupTitle + '::' + bundle.id + '::' + property.key;
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

  global.IfluxDsAtomsCatalog = {
    esc: esc,
    PAGE: PAGE,
    propKey: propKey,
    pageCounts: pageCounts
  };
})(window);
