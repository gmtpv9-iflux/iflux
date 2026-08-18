/**
 * Social Auth — IdentityProof (immutable).
 * OD-SOL-10: created once · never mutate · forward only.
 */
(function (global) {
  'use strict';

  /**
   * @param {string} provider
   * @param {string} kind  id_token | access_token | authorization_code | identity_token
   * @param {string} value
   * @param {object} [meta]
   * @returns {Readonly<{provider:string,kind:string,value:string,meta?:object}>}
   */
  function createIdentityProof(provider, kind, value, meta) {
    var p = String(provider || '').toLowerCase();
    var k = String(kind || '');
    var v = String(value || '');
    if (!p || !k || !v) {
      throw new Error('IdentityProof thiếu provider/kind/value.');
    }
    var obj = {
      provider: p,
      kind: k,
      value: v
    };
    if (meta && typeof meta === 'object') {
      obj.meta = Object.freeze(Object.assign({}, meta));
    }
    return Object.freeze(obj);
  }

  global.IfluxIdentityProof = {
    create: createIdentityProof
  };
})(window);
