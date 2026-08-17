'use strict';

/**
 * Permission Contract — Phase 02 ADM-15.
 * Đúng 15 key SOT-02.11. Không gửi type (Registry derive).
 */

module.exports = {
  id: 'adm-15',
  domain: 'admin',
  moduleLabel: 'Quản trị',
  register: [
    {
      key: 'admin.accounts.view',
      feature: 'accounts',
      action: 'view',
      label: 'Xem danh sách quản trị viên',
      pageLabel: 'Tài khoản quản trị',
      sort: 10,
      navPageIdentity: 'page.administrators.list'
    },
    {
      key: 'admin.accounts.create',
      feature: 'accounts',
      action: 'create',
      label: 'Tạo tài khoản',
      pageLabel: 'Tài khoản quản trị',
      sort: 20
    },
    {
      key: 'admin.accounts.edit',
      feature: 'accounts',
      action: 'edit',
      label: 'Sửa hồ sơ tài khoản',
      pageLabel: 'Tài khoản quản trị',
      sort: 30
    },
    {
      key: 'admin.accounts.delete',
      feature: 'accounts',
      action: 'delete',
      label: 'Xóa tài khoản',
      pageLabel: 'Tài khoản quản trị',
      sort: 40
    },
    {
      key: 'admin.accounts.disable',
      feature: 'accounts',
      action: 'disable',
      label: 'Vô hiệu hóa',
      pageLabel: 'Tài khoản quản trị',
      sort: 50
    },
    {
      key: 'admin.accounts.enable',
      feature: 'accounts',
      action: 'enable',
      label: 'Kích hoạt lại',
      pageLabel: 'Tài khoản quản trị',
      sort: 60
    },
    {
      key: 'admin.accounts.reset_password',
      feature: 'accounts',
      action: 'reset_password',
      label: 'Đặt lại mật khẩu',
      pageLabel: 'Tài khoản quản trị',
      sort: 70
    },
    {
      key: 'admin.accounts.assign_role',
      feature: 'accounts',
      action: 'assign_role',
      label: 'Gán / gỡ vai trò',
      pageLabel: 'Tài khoản quản trị',
      sort: 80
    },
    {
      key: 'admin.roles.view',
      feature: 'roles',
      action: 'view',
      label: 'Xem vai trò',
      pageLabel: 'Vai trò',
      sort: 90,
      navPageIdentity: 'page.administrators.roles'
    },
    {
      key: 'admin.roles.create',
      feature: 'roles',
      action: 'create',
      label: 'Tạo vai trò',
      pageLabel: 'Vai trò',
      sort: 100
    },
    {
      key: 'admin.roles.edit',
      feature: 'roles',
      action: 'edit',
      label: 'Sửa vai trò',
      pageLabel: 'Vai trò',
      sort: 110
    },
    {
      key: 'admin.roles.delete',
      feature: 'roles',
      action: 'delete',
      label: 'Xóa vai trò',
      pageLabel: 'Vai trò',
      sort: 120
    },
    {
      key: 'admin.roles.clone',
      feature: 'roles',
      action: 'clone',
      label: 'Nhân bản vai trò',
      pageLabel: 'Vai trò',
      sort: 130
    },
    {
      key: 'admin.permissions.view',
      feature: 'permissions',
      action: 'view',
      label: 'Xem phân quyền',
      pageLabel: 'Phân quyền',
      sort: 140,
      navPageIdentity: 'page.administrators.permissions'
    },
    {
      key: 'admin.permissions.assign',
      feature: 'permissions',
      action: 'assign',
      label: 'Gán / gỡ quyền cho vai trò',
      pageLabel: 'Phân quyền',
      sort: 150
    }
  ]
};
