'use strict';

/**
 * In-process Business Event bus (FN-001).
 * publish only — subscribers đăng ký độc lập.
 * Cấm business gọi notify/achievement/mail trực tiếp trong cùng hàm.
 */
const listeners = Object.create(null);

function subscribe(eventType, handler) {
  if (!eventType || typeof handler !== 'function') return function noop() {};
  if (!listeners[eventType]) listeners[eventType] = [];
  listeners[eventType].push(handler);
  return function unsubscribe() {
    listeners[eventType] = (listeners[eventType] || []).filter(function (h) {
      return h !== handler;
    });
  };
}

async function publish(eventType, payload) {
  const list = listeners[eventType] || [];
  const errors = [];
  for (let i = 0; i < list.length; i++) {
    try {
      await list[i](payload || {}, eventType);
    } catch (err) {
      errors.push(err);
      if (process.env.NODE_ENV !== 'production') {
        console.error('[EventBus]', eventType, err && err.message);
      }
    }
  }
  return { ok: true, handlers: list.length, errors: errors.length };
}

function resetForTests() {
  Object.keys(listeners).forEach(function (k) {
    delete listeners[k];
  });
}

module.exports = {
  subscribe,
  publish,
  resetForTests,
  EVENTS: {
    NEWS_POST_PUBLISHED: 'news.post.published',
    NEWS_POST_SHARED: 'news.post.shared',
    ENTITY_COMMENT_CREATED: 'entity.comment.created',
    COMMENT_LIKED: 'comment.liked'
  }
};
