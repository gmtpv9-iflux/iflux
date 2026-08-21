/* Panel tin tức entity — Tin tức + Bài viết chuyên gia (2 danh sách, giống trang CP) */
(function (global) {
  'use strict';

  var TAB_NEWS = 'news';
  var TAB_EXPERT = 'expert';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function store() { return global.IfluxNewsStore; }
  function ui() { return global.IfluxNewsUI; }

  function listHtml(posts, opts) {
    opts = opts || {};
    if (!posts.length) {
      var emptyMsg = opts.tab === TAB_EXPERT
        ? 'Chưa có bài viết chuyên gia cho <strong>' + esc(opts.entityName) + '</strong>.'
        : 'Chưa có tin tức liên quan đến <strong>' + esc(opts.entityName) + '</strong>.';
      return '<div class="ifx-stock-empty">' + emptyMsg + '</div>';
    }
    if (!ui() || !ui().compactPostHtml) {
      return '<div class="ifx-stock-empty">' + posts.length + ' bài viết</div>';
    }
    return '<div class="ifx-stock-news-list">' +
      posts.map(function (p) {
        return ui().compactPostHtml(p, { storyBase: opts.storyBase || '../news/' });
      }).join('') +
    '</div>';
  }

  function subtitleText(newsCount, expertCount) {
    return newsCount + ' tin tức · ' + expertCount + ' bài chuyên gia';
  }

  function getPostsByType(state, type) {
    if (!store()) return [];
    return store().getPosts(Object.assign({}, (state || {}).postsFilter, { contentType: type }));
  }

  /* Danh sách tin tức (contentType = news) — dùng cho tab Tin tức */
  function newsListHtml(state) {
    state = state || {};
    return listHtml(getPostsByType(state, TAB_NEWS), {
      tab: TAB_NEWS, entityName: state.entityName, storyBase: state.storyBase
    });
  }

  /* Danh sách bài viết chuyên gia (contentType = expert) — dùng cho tab Bài viết */
  function articlesListHtml(state) {
    state = state || {};
    return listHtml(getPostsByType(state, TAB_EXPERT), {
      tab: TAB_EXPERT, entityName: state.entityName, storyBase: state.storyBase
    });
  }

  function newsCount(state) { return getPostsByType(state, TAB_NEWS).length; }
  function articlesCount(state) { return getPostsByType(state, TAB_EXPERT).length; }

  function sectionHtml(title, posts, opts) {
    return (
      '<section class="ifx-stock-news-section">' +
        '<h2 class="ifx-stock-news-section__title">' + esc(title) + '</h2>' +
        listHtml(posts, opts) +
      '</section>'
    );
  }

  function feedBodyHtml(opts) {
    opts = opts || {};
    if (!store()) return '';
    var newsPosts = store().getPosts(Object.assign({}, opts.postsFilter, { contentType: TAB_NEWS }));
    var expertPosts = store().getPosts(Object.assign({}, opts.postsFilter, { contentType: TAB_EXPERT }));
    var listOpts = {
      entityName: opts.entityName,
      storyBase: opts.storyBase
    };
    return (
      sectionHtml('Tin tức', newsPosts, Object.assign({ tab: TAB_NEWS }, listOpts)) +
      sectionHtml('Bài viết của chuyên gia', expertPosts, Object.assign({ tab: TAB_EXPERT }, listOpts))
    );
  }

  function refreshBody(root, state) {
    if (!root || !state || !store()) return;

    /* Tab Tin tức */
    var newsPanel = root.querySelector('[data-ifx-stock-news]');
    if (newsPanel) {
      var newsBody = newsPanel.querySelector('[data-ifx-stock-news-body]');
      if (newsBody) newsBody.innerHTML = newsListHtml(state);
      var newsSub = newsPanel.querySelector('[data-ifx-stock-news-sub]');
      if (newsSub) newsSub.textContent = newsCount(state) + ' tin tức';
    }

    /* Tab Bài viết */
    var artPanel = root.querySelector('[data-ifx-stock-articles]');
    if (artPanel) {
      var artBody = artPanel.querySelector('[data-ifx-stock-articles-body]');
      if (artBody) artBody.innerHTML = articlesListHtml(state);
      var artSub = artPanel.querySelector('[data-ifx-stock-articles-sub]');
      if (artSub) artSub.textContent = articlesCount(state) + ' bài viết chuyên gia';
    }
  }

  function bind(root, state) {
    if (!root) return;
    var host = root.querySelector('[data-ifx-stock-news]') || root.querySelector('[data-ifx-stock-articles]');
    if (!host) return;
    root._newsFeedState = state;

    document.addEventListener('iflux-news-change', function onChange() {
      if (root.querySelector('[data-ifx-stock-news]') || root.querySelector('[data-ifx-stock-articles]')) {
        refreshBody(root, root._newsFeedState);
      }
    });
  }

  global.IfluxEntityTimelineFeed = {
    TAB_NEWS: TAB_NEWS,
    TAB_EXPERT: TAB_EXPERT,
    subtitleText: subtitleText,
    feedBodyHtml: feedBodyHtml,
    newsListHtml: newsListHtml,
    articlesListHtml: articlesListHtml,
    newsCount: newsCount,
    articlesCount: articlesCount,
    bind: bind,
    refreshBody: refreshBody
  };
})(window);
