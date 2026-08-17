'use strict';

/**
 * Contract fixture DoD — production / boot thường không load *.fixture.js
 */

module.exports = {
  id: 'adm-15-probe',
  domain: 'admin',
  moduleLabel: 'Quản trị',
  register: [
    {
      key: 'admin.probe.view',
      feature: 'probe',
      action: 'view',
      label: 'Probe Catalog (fixture)',
      pageLabel: 'Probe',
      sort: 900
    }
  ]
};
