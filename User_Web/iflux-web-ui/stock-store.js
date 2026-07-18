/* Bình luận — fan-out theo thẻ tag (CP / Ngành / Họ / Chủ đề) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_stock_comments_v6';

  function uid(prefix) {
    return (prefix || 'sc') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function mentions() { return global.IfluxStockMentions; }
  function tax() { return global.IfluxWatchlistTaxonomy; }

  function emptyStore() {
    return { __byId: {}, __feeds: {} };
  }

  function isTickerFeed(feedKey) {
    return String(feedKey || '').indexOf(':') < 0;
  }

  function normalizeFeedKey(feedKey) {
    feedKey = String(feedKey || '').trim();
    if (!feedKey) return '';
    if (isTickerFeed(feedKey)) return feedKey.toUpperCase();
    var i = feedKey.indexOf(':');
    return feedKey.slice(0, i) + ':' + feedKey.slice(i + 1);
  }

  function migrateStore(data) {
    if (!data || typeof data !== 'object') return emptyStore();
    if (data.__byId && data.__feeds) return data;
    var out = emptyStore();
    Object.keys(data).forEach(function (key) {
      if (key === '__byId' || key === '__feeds') return;
      var feedKey = normalizeFeedKey(key);
      (data[key] || []).forEach(function (c) {
        c = normalizeComment(c);
        publishComment(out, c, [feedKey]);
        var extra = feedKeysFromTags(c.tags);
        extra.forEach(function (k) {
          if (k !== feedKey) publishComment(out, c, [k]);
        });
      });
    });
    return out;
  }

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return migrateStore(JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return emptyStore();
  }

  function writeAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    document.dispatchEvent(new CustomEvent('iflux-stock-comments-change'));
  }

  function normalizeTagRef(ref) {
    if (!ref) return null;
    if (typeof ref === 'string') return { id: ref, name: ref };
    return { id: String(ref.id || ref.name), name: ref.name || String(ref.id) };
  }

  function normalizeTags(tags) {
    tags = tags || {};
    var tickers = (tags.tickers || []).map(function (t) {
      return String(t).toUpperCase();
    }).filter(function (t, i, arr) { return t && arr.indexOf(t) === i; }).slice(0, 3);
    return {
      tickers: tickers,
      sector: normalizeTagRef(tags.sector),
      family: normalizeTagRef(tags.family),
      story: normalizeTagRef(tags.story)
    };
  }

  function normalizeReactions(reactions) {
    reactions = reactions || {};
    return {
      positive: (reactions.positive || []).slice(),
      negative: (reactions.negative || []).slice()
    };
  }

  function normalizeReply(r) {
    return {
      id: r.id || uid('sr'),
      user_id: r.user_id || '',
      user_name: r.user_name || 'Thành viên',
      body: r.body || '',
      created_at: r.created_at || new Date().toISOString(),
      reply_to_id: r.reply_to_id || null,
      reactions: normalizeReactions(r.reactions)
    };
  }

  function normalizeComment(c) {
    return {
      id: c.id || uid('sc'),
      user_id: c.user_id || '',
      user_name: c.user_name || 'Thành viên',
      body: c.body || '',
      created_at: c.created_at || new Date().toISOString(),
      tags: normalizeTags(c.tags),
      reactions: normalizeReactions(c.reactions),
      replies: (c.replies || []).map(normalizeReply)
    };
  }

  function feedKeysFromTags(tags) {
    tags = normalizeTags(tags);
    var keys = [];
    var seen = {};
    function add(key) {
      key = normalizeFeedKey(key);
      if (!key || seen[key]) return;
      seen[key] = true;
      keys.push(key);
    }
    (tags.tickers || []).forEach(add);
    if (tags.sector) add('sector:' + tags.sector.id);
    if (tags.family) add('family:' + tags.family.id);
    if (tags.story) add('story:' + tags.story.id);
    return keys;
  }

  function primaryFeedKeyFromTags(tags) {
    var keys = feedKeysFromTags(tags);
    return keys.length ? keys[0] : '';
  }

  function pageTagsForTicker(ticker) {
    ticker = String(ticker || '').toUpperCase();
    return normalizeTags({ tickers: ticker ? [ticker] : [] });
  }

  function pageTagsForFeed(feedKey) {
    feedKey = normalizeFeedKey(feedKey);
    if (!feedKey) return normalizeTags({});
    if (isTickerFeed(feedKey)) return pageTagsForTicker(feedKey);
    var i = feedKey.indexOf(':');
    var type = feedKey.slice(0, i);
    var id = feedKey.slice(i + 1);
    var group = tax() ? tax().getGroup(type, id) : null;
    if (!group) return normalizeTags({});
    var tags = { tickers: [], sector: null, family: null, story: null };
    if (type === 'sector') tags.sector = { id: group.id, name: group.name };
    else if (type === 'family') tags.family = { id: group.id, name: group.name };
    else if (type === 'story') tags.story = { id: group.id, name: group.name };
    return normalizeTags(tags);
  }

  function resolveTags(feedKey, body, extraTags) {
    var page = pageTagsForFeed(feedKey);
    var picked = extraTags || {};
    var fromBody = mentions() ? mentions().extractMentions(body) : {};
    var merged = mentions()
      ? mentions().mergeTags(page, mentions().mergeTags(picked, fromBody))
      : page;
    return normalizeTags(merged);
  }

  function publishComment(store, comment, feedKeys) {
    comment = normalizeComment(comment);
    store.__byId[comment.id] = comment;
    (feedKeys || []).forEach(function (feedKey) {
      feedKey = normalizeFeedKey(feedKey);
      if (!feedKey) return;
      if (!store.__feeds[feedKey]) store.__feeds[feedKey] = [];
      if (store.__feeds[feedKey].indexOf(comment.id) < 0) {
        store.__feeds[feedKey].unshift(comment.id);
      }
    });
  }

  function seedReply(id, userId, name, body, agoMs, reactions) {
    return normalizeReply({
      id: id,
      user_id: userId,
      user_name: name,
      body: body,
      created_at: new Date(Date.now() - agoMs).toISOString(),
      reactions: reactions || { positive: [], negative: [] }
    });
  }

  function seedRepliesForThread(ticker, commentKey) {
    var authors = [
      { id: 'u2', name: 'Lan Hương' },
      { id: 'u3', name: 'Đức Anh' },
      { id: 'u4', name: 'Thu Hà' },
      { id: 'u5', name: 'Quốc Bảo' },
      { id: 'u6', name: 'Hoàng Nam' },
      { id: 'u7', name: 'Anh Nguyên' },
      { id: 'u8', name: 'Violet Long' },
      { id: 'u2', name: 'Lan Hương' },
      { id: 'u3', name: 'Đức Anh' },
      { id: 'u4', name: 'Thu Hà' },
      { id: 'u5', name: 'Quốc Bảo' },
      { id: 'u6', name: 'Hoàng Nam' },
      { id: 'u7', name: 'Anh Nguyên' },
      { id: 'u8', name: 'Violet Long' },
      { id: 'u2', name: 'Lan Hương' }
    ];
    var bodies = [
      'Đồng ý, volume phiên này khá ổn.',
      'Chờ xác nhận breakout.',
      'Đứng ngoài chờ rõ xu hướng.',
      'MA20 vẫn là hỗ trợ tốt.',
      'Ngoại mua ròng liên tiếp, tích cực.',
      'Chốt lời một phần, giữ core.',
      'Pullback về vùng này có thể gom thêm.',
      'RSI chưa quá mua, còn room.',
      'Theo dõi khối lượng phiên mai.',
      'Ngắn hạn sideway, dài hạn ổn.',
      'Cẩn trọng với tin vĩ mô tuần tới.',
      'Spread bid-ask hẹp, thanh khoản tốt.',
      'So sánh peer trong cùng ngành.',
      'Chưa chạm target, giữ kỷ luật.',
      'Breakout fake hay thật cần xác nhận.'
    ];
    var out = [];
    var i;
    for (i = 0; i < 15; i++) {
      out.push(seedReply(
        'seed_' + ticker + '_' + commentKey + '_r' + (i + 1),
        authors[i].id,
        authors[i].name,
        bodies[i],
        (i + 1) * 420000,
        i % 3 === 0 ? { positive: ['u1', 'u3'], negative: [] } :
          i % 5 === 0 ? { positive: [], negative: ['u4'] } :
            { positive: ['u2'], negative: [] }
      ));
    }
    return out;
  }

  function seedComments(ticker) {
    var tags1 = pageTagsForTicker(ticker);
    if (ticker === 'VHM') tags1.tickers = ['VHM', 'VIC'];
    if (ticker === 'HPG') tags1.tickers = ['HPG', 'HSG'];
    tags1.tickers = tags1.tickers.slice(0, 3);
    var ts = new Date(Date.now() - 3600000).toISOString();

    return [
      normalizeComment({
        id: 'seed_' + ticker + '_1',
        user_id: 'usr_demo_001',
        user_name: 'Nguyễn Văn Minh',
        body: 'Theo dõi vùng hỗ trợ, khối ngoại mua ròng 3 phiên. Cổ phiếu này tích lũy thêm nếu về MA20.',
        created_at: ts,
        tags: tags1,
        reactions: { positive: ['u2', 'u3', 'u4'], negative: ['u9'] },
        replies: seedRepliesForThread(ticker, '1')
      }),
      normalizeComment({
        id: 'seed_' + ticker + '_2',
        user_id: 'u6',
        user_name: 'Hoàng Nam',
        body: 'Ngắn hạn hơi nhiễu, chưa vội all-in.',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        tags: pageTagsForTicker(ticker),
        reactions: { positive: ['u1'], negative: ['u7', 'u8'] },
        replies: seedRepliesForThread(ticker, '2').slice(0, 6)
      })
    ];
  }

  function seedGroupComments(feedKey) {
    var tags = pageTagsForFeed(feedKey);
    var slug = String(feedKey || '').replace(':', '_');
    var label = (tags.story && tags.story.name) ||
      (tags.sector && tags.sector.name) ||
      (tags.family && tags.family.name) ||
      feedKey;
    return [
      normalizeComment({
        id: 'seed_' + slug + '_1',
        user_id: 'usr_demo_001',
        user_name: 'Nguyễn Văn Minh',
        body: 'Theo dõi nhóm ' + label + ' — dòng tiền và độ rộng phiên này khá tích cực.',
        created_at: new Date(Date.now() - 5400000).toISOString(),
        tags: tags,
        reactions: { positive: ['u2', 'u3'], negative: [] },
        replies: []
      }),
      normalizeComment({
        id: 'seed_' + slug + '_2',
        user_id: 'u6',
        user_name: 'Hoàng Nam',
        body: 'Quan điểm ngắn hạn: cần xác nhận volume trước khi tăng tỷ trọng.',
        created_at: new Date(Date.now() - 9000000).toISOString(),
        tags: tags,
        reactions: { positive: ['u1'], negative: ['u7'] },
        replies: []
      })
    ];
  }

  function ensureFeed(feedKey) {
    feedKey = normalizeFeedKey(feedKey);
    if (!feedKey) return feedKey;
    var store = readAll();
    var ids = store.__feeds[feedKey];
    if (ids && ids.length) return feedKey;

    if (!isTickerFeed(feedKey)) {
      seedGroupComments(feedKey).forEach(function (c) {
        var keys = feedKeysFromTags(c.tags);
        if (keys.indexOf(feedKey) < 0) keys.unshift(feedKey);
        publishComment(store, c, keys);
      });
      writeAll(store);
      return feedKey;
    }

    seedComments(feedKey).forEach(function (c) {
      var keys = feedKeysFromTags(c.tags);
      if (keys.indexOf(feedKey) < 0) keys.unshift(feedKey);
      publishComment(store, c, keys);
    });
    writeAll(store);
    return feedKey;
  }

  function commentsForFeed(store, feedKey) {
    feedKey = normalizeFeedKey(feedKey);
    return (store.__feeds[feedKey] || []).map(function (id) {
      return store.__byId[id] ? normalizeComment(store.__byId[id]) : null;
    }).filter(Boolean).sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  function findCommentById(store, commentId) {
    var c = store.__byId[commentId];
    return c ? normalizeComment(c) : null;
  }

  function findCommentInFeed(store, feedKey, commentId) {
    feedKey = normalizeFeedKey(feedKey);
    var ids = store.__feeds[feedKey] || [];
    if (ids.indexOf(commentId) < 0) return null;
    return findCommentById(store, commentId);
  }

  function findReply(comment, replyId) {
    if (!comment || !replyId) return null;
    var replies = comment.replies || [];
    var i;
    for (i = 0; i < replies.length; i++) {
      if (replies[i].id === replyId) return replies[i];
    }
    return null;
  }

  function getComments(feedKey) {
    feedKey = ensureFeed(feedKey);
    return commentsForFeed(readAll(), feedKey);
  }

  function getComment(feedKey, commentId) {
    feedKey = ensureFeed(feedKey);
    return findCommentInFeed(readAll(), feedKey, commentId);
  }

  function countActivity(feedKey) {
    var n = 0;
    getComments(feedKey).forEach(function (c) {
      n += 1 + (c.replies || []).length;
    });
    return n;
  }

  function addComment(feedKey, user, payload) {
    feedKey = normalizeFeedKey(feedKey);
    payload = payload || {};
    var rawBody = (payload.body || '').trim();
    var body = mentions() ? mentions().stripMentions(rawBody) : rawBody;
    if (!body) throw new Error('Nhập nội dung bình luận.');
    ensureFeed(feedKey);
    var store = readAll();
    var tags = payload.tags
      ? normalizeTags(payload.tags)
      : resolveTags(feedKey, rawBody, payload.extraTags);
    var comment = normalizeComment({
      id: uid('sc'),
      user_id: user && user.id ? user.id : 'usr_local',
      user_name: user && user.display_name ? user.display_name : 'Thành viên',
      body: body,
      created_at: new Date().toISOString(),
      tags: tags,
      reactions: { positive: [], negative: [] },
      replies: []
    });
    var keys = feedKeysFromTags(tags);
    if (keys.indexOf(feedKey) < 0) keys.unshift(feedKey);
    publishComment(store, comment, keys);
    writeAll(store);
    return comment;
  }

  function addReply(feedKey, commentId, user, body, opts) {
    feedKey = normalizeFeedKey(feedKey);
    body = (body || '').trim();
    if (!body) throw new Error('Nhập nội dung phản hồi.');
    opts = opts || {};
    ensureFeed(feedKey);
    var store = readAll();
    var comment = findCommentInFeed(store, feedKey, commentId);
    if (!comment) throw new Error('Không tìm thấy bình luận.');
    var replyToId = opts.replyToId || null;
    if (replyToId) {
      var parent = findReply(comment, replyToId);
      if (parent && body.indexOf('@' + parent.user_name) !== 0) {
        body = '@' + parent.user_name + ' ' + body;
      }
    }
    comment.replies = comment.replies || [];
    comment.replies.push(normalizeReply({
      id: uid('sr'),
      user_id: user && user.id ? user.id : 'usr_local',
      user_name: user && user.display_name ? user.display_name : 'Thành viên',
      body: body,
      created_at: new Date().toISOString(),
      reply_to_id: replyToId,
      reactions: { positive: [], negative: [] }
    }));
    store.__byId[comment.id] = comment;
    writeAll(store);
    return comment;
  }

  function toggleReaction(feedKey, commentId, userId, type) {
    if (!userId) return null;
    feedKey = normalizeFeedKey(feedKey);
    type = type === 'negative' ? 'negative' : 'positive';
    var other = type === 'positive' ? 'negative' : 'positive';
    ensureFeed(feedKey);
    var store = readAll();
    var comment = findCommentInFeed(store, feedKey, commentId);
    if (!comment) return null;
    comment.reactions = normalizeReactions(comment.reactions);
    var list = comment.reactions[type];
    var otherList = comment.reactions[other];
    var idx = list.indexOf(userId);
    var oidx = otherList.indexOf(userId);
    if (oidx >= 0) otherList.splice(oidx, 1);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(userId);
    store.__byId[comment.id] = comment;
    writeAll(store);
    return comment;
  }

  function toggleReplyReaction(feedKey, commentId, replyId, userId, type) {
    if (!userId || !replyId) return null;
    feedKey = normalizeFeedKey(feedKey);
    type = type === 'negative' ? 'negative' : 'positive';
    var other = type === 'positive' ? 'negative' : 'positive';
    ensureFeed(feedKey);
    var store = readAll();
    var comment = findCommentInFeed(store, feedKey, commentId);
    if (!comment) return null;
    var reply = findReply(comment, replyId);
    if (!reply) return null;
    reply.reactions = normalizeReactions(reply.reactions);
    var list = reply.reactions[type];
    var otherList = reply.reactions[other];
    var idx = list.indexOf(userId);
    var oidx = otherList.indexOf(userId);
    if (oidx >= 0) otherList.splice(oidx, 1);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(userId);
    store.__byId[comment.id] = comment;
    writeAll(store);
    return reply;
  }

  global.IfluxStockStore = {
    getComments: getComments,
    getComment: getComment,
    countActivity: countActivity,
    addComment: addComment,
    addReply: addReply,
    toggleReaction: toggleReaction,
    toggleReplyReaction: toggleReplyReaction,
    pageTagsForTicker: pageTagsForTicker,
    pageTagsForFeed: pageTagsForFeed,
    feedKeysFromTags: feedKeysFromTags,
    normalizeFeedKey: normalizeFeedKey,
    resolveTags: resolveTags,
    normalizeTags: normalizeTags,
    listTopMembersBySentiment: function (limit) {
      limit = limit || 5;
      var map = {};
      var store = readAll();
      function bump(userId, userName, reactions) {
        if (!userId) return;
        if (!map[userId]) {
          map[userId] = {
            userId: userId,
            userName: userName || 'Thành viên',
            positive: 0,
            negative: 0,
            score: 0
          };
        }
        reactions = normalizeReactions(reactions);
        map[userId].positive += reactions.positive.length;
        map[userId].negative += reactions.negative.length;
        if (userName && map[userId].userName === 'Thành viên') {
          map[userId].userName = userName;
        }
      }
      Object.keys(store.__byId || {}).forEach(function (id) {
        var c = normalizeComment(store.__byId[id]);
        bump(c.user_id, c.user_name, c.reactions);
        (c.replies || []).forEach(function (r) {
          bump(r.user_id, r.user_name, r.reactions);
        });
      });
      return Object.keys(map).map(function (k) {
        var m = map[k];
        m.score = m.positive - m.negative;
        return m;
      }).sort(function (a, b) {
        return b.score - a.score || b.positive - a.positive;
      }).slice(0, limit);
    },
    listTopCommentsByUser: function (userId) {
      if (!userId) return [];
      var out = [];
      var store = readAll();
      Object.keys(store.__byId).forEach(function (id) {
        var comment = normalizeComment(store.__byId[id]);
        if (comment.user_id === userId) {
          out.push({
            feedKey: primaryFeedKeyFromTags(comment.tags),
            ticker: primaryFeedKeyFromTags(comment.tags),
            comment: comment
          });
        }
      });
      return out.sort(function (a, b) {
        return new Date(b.comment.created_at) - new Date(a.comment.created_at);
      });
    }
  };
})(window);
