/* Kho khách hàng app — đồng bộ User Web ↔ Admin (localStorage, sandbox GĐ1) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_customers_v1';
  var SESSION_KEY = 'iflux_user_session';

  function readRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeRaw(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function addDays(n) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function initialsFromName(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return String(name || 'U').trim().slice(0, 2).toUpperCase();
  }

  function avatarClassFromName(name) {
    var classes = ['ix-avatar-accent', 'ix-avatar-success', 'ix-avatar-warning', 'ix-avatar-danger', 'ix-avatar-info'];
    var sum = 0;
    var i;
    for (i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return classes[sum % classes.length];
  }

  function tierToPackage(tier) {
    if (tier === 'premium') return 'Premium';
    if (tier === 'elite') return 'Elite';
    return 'Free';
  }

  function resolveEmail(user) {
    var email = (user.email || '').trim().toLowerCase();
    if (email) return email;
    var phone = String(user.phone || '').replace(/\D/g, '');
    if (phone) return 'phone_' + phone + '@iflux.local';
    return 'user_' + (user.id || Date.now()) + '@iflux.local';
  }

  function appUserToCustomer(user) {
    if (!user) return null;
    var pkg = tierToPackage(user.tier);
    var name = user.display_name || 'Thành viên';
    return {
      id: user.id || ('usr_' + Date.now()),
      name: name,
      email: resolveEmail(user),
      phone: user.phone || '',
      affiliate: user.referral_code || '',
      initials: initialsFromName(name),
      avatarCls: avatarClassFromName(name),
      package: pkg,
      planType: pkg === 'Free' ? 'freemium' : 'monthly',
      role: user.app_role || 'Standard',
      expiresAt: pkg === 'Free' ? null : addDays(user.plan && user.plan.days_left ? user.plan.days_left : 28),
      billing: pkg === 'Free' ? '—' : 'Web',
      accountStatus: user.status === 'suspended' ? 'suspended' : 'active',
      source: 'app'
    };
  }

  function upsertCustomer(record) {
    var list = readRaw();
    var email = (record.email || '').toLowerCase();
    var idx = -1;
    var i;
    for (i = 0; i < list.length; i++) {
      if ((list[i].email || '').toLowerCase() === email) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      list[idx] = Object.assign({}, list[idx], record, { email: email });
    } else {
      list.unshift(record);
    }
    writeRaw(list);
    return record;
  }

  function upsertFromAppUser(user) {
    var c = appUserToCustomer(user);
    if (!c) return null;
    return upsertCustomer(c);
  }

  function syncFromSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && s.user) upsertFromAppUser(s.user);
    } catch (e) { /* ignore */ }
  }

  function listCustomers() {
    syncFromSession();
    return readRaw();
  }

  function getCustomerByEmail(email) {
    var key = String(email || '').trim().toLowerCase();
    if (!key) return null;
    return listCustomers().find(function (c) {
      return (c.email || '').toLowerCase() === key;
    }) || null;
  }

  function getCustomerById(id) {
    if (!id) return null;
    return listCustomers().find(function (c) { return c.id === id; }) || null;
  }

  function updateCustomer(email, patch) {
    var key = String(email || '').trim().toLowerCase();
    if (!key) return null;
    var list = readRaw();
    var idx = -1;
    var i;
    for (i = 0; i < list.length; i++) {
      if ((list[i].email || '').toLowerCase() === key) { idx = i; break; }
    }
    if (idx < 0) return null;
    list[idx] = Object.assign({}, list[idx], patch, { email: list[idx].email });
    writeRaw(list);
    return list[idx];
  }

  global.IfluxCustomersStore = {
    listCustomers: listCustomers,
    getCustomerByEmail: getCustomerByEmail,
    getCustomerById: getCustomerById,
    updateCustomer: updateCustomer,
    upsertFromAppUser: upsertFromAppUser,
    upsertCustomer: upsertCustomer,
    syncFromSession: syncFromSession
  };
})(window);
