/**
 * Page Manifest — Bài viết cộng đồng (/cong-dong/bai-viet)
 */
export default {
  pageKey: 'article',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--community-post',
  css: ['/User_Web/iflux-web-ui/news.css?v=r20261002l', '/User_Web/iflux-web-ui/block-templates.css?v=r20260928n'],
  path: '/tin-tuc/bai-viet',
  title: 'Bài viết cộng đồng',
  documentTitle: '',
  composite: true,
  sections: [{ key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }],
  widgets: [{
    id: 'WGT-NEWS-POST-PAGE',
    title: 'Bài viết cộng đồng',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    lazyModule: '/User_Web/iflux-web-ui/widgets/news-post-page/index.js?v=r20261002a',
    css: [
      '/User_Web/iflux-web-ui/news.css?v=r20261002l',
      '/User_Web/iflux-web-ui/block-templates.css?v=r20260928n'
    ]
  }]
};
