/**
 * iFlux Viewport Registry — Source of Truth cho môi trường Preview/QA.
 *
 * Viewport mô phỏng không phải CSS breakpoint. Registry này phục vụ Authoring
 * Preview, Screenshot QA, Visual Regression và các consumer kiểm thử giao diện.
 */
(function (global) {
  'use strict';

  var DEFAULT_ID = 'mobile';
  var VIEWPORTS = [
    {
      id: 'mobile',
      name: 'Di động',
      width: 375,
      icon: 'device-mobile',
      description: 'Khung xem trước tiêu chuẩn cho thiết bị di động.'
    },
    {
      id: 'tablet',
      name: 'Máy tính bảng',
      width: 768,
      icon: 'device-tablet',
      description: 'Khung xem trước tiêu chuẩn cho máy tính bảng.'
    },
    {
      id: 'laptop',
      name: 'Laptop',
      width: 1280,
      icon: 'device-laptop',
      description: 'Khung xem trước tiêu chuẩn cho màn hình laptop.'
    },
    {
      id: 'desktop',
      name: 'Máy tính để bàn',
      width: 1440,
      icon: 'device-desktop',
      description: 'Khung xem trước tiêu chuẩn cho màn hình máy tính để bàn.'
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function all() {
    return clone(VIEWPORTS);
  }

  function byId(id) {
    for (var i = 0; i < VIEWPORTS.length; i += 1) {
      if (VIEWPORTS[i].id === id) return clone(VIEWPORTS[i]);
    }
    return null;
  }

  function getDefault() {
    return byId(DEFAULT_ID);
  }

  global.IfluxViewportRegistry = {
    VERSION: '1.0.0',
    DEFAULT_ID: DEFAULT_ID,
    all: all,
    byId: byId,
    getDefault: getDefault
  };
})(window);
