/**
 * Page Manifest — Bài viết cộng đồng (/cong-dong/bai-viet)
 */
export default {
  pageKey: 'article',
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
    lazyModule: '/User_Web/iflux-web-ui/widgets/news-post-page/index.js?v=scrollWave4early_20260811',
    css: [
      '/User_Web/iflux-web-ui/news.css?v=stickyRefactor20260811',
      '/User_Web/iflux-web-ui/block-templates.css'
    ]
  }]
};
