/* iFlux DS Studio — danh sách TRANG (không chia MODULE) */
(function (global) {
  'use strict';
  if (global.IfluxDsRoadmap) return;

  var PAGES = [
    { id: 'primitive-tokens', num: '01', title: 'Primitive Tokens', status: 'active' },
    { id: 'foundations', num: '02', title: 'Foundations', status: 'active' },
    { id: 'design-tokens', num: '03', title: 'Design Tokens', status: 'active' },
    { id: 'icons', num: '04', title: 'Icons', status: 'active' },
    { id: 'charts', num: '05', title: 'Charts', status: 'active' },
    { id: 'atoms', num: '06', title: 'Atoms', status: 'active' },
    { id: 'items', num: '07', title: 'Items', status: 'active' },
    { id: 'blocks', num: '08', title: 'Blocks', status: 'active' },
    { id: 'cards', num: '09', title: 'Cards', status: 'active' },
    { id: 'organisms', num: '10', title: 'Organisms', status: 'planned' },
    { id: 'sections', num: '11', title: 'Sections', status: 'planned' },
    { id: 'business-objects', num: '12', title: 'Business Objects', status: 'planned' },
    { id: 'user-flows', num: '13', title: 'User Flows', status: 'planned' }
  ];

  /** Product Architecture — không thuộc DS Studio (quản lý ở Admin) */
  var PRODUCT_LINKS = [
    {
      id: 'platform-layers-l4',
      title: 'Core 4 tầng · Tầng 4 (Widget)',
      href: 'app/system/platform-layers.html#layer-4',
      note: 'SoT duy nhất WGT-* · template · entitlement · deploy · output contract'
    },
    {
      id: 'page-settings',
      title: 'Cài đặt Trang',
      href: 'app/system/page-settings.html',
      note: 'Sitemap · App Shell / Section · widget đặc thù & dùng chung theo Page'
    }
  ];

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  global.IfluxDsRoadmap = {
    PAGES: PAGES,
    PRODUCT_LINKS: PRODUCT_LINKS,
    esc: esc
  };
})(window);
