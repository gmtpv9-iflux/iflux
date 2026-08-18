'use strict';

class SitemapRegistry {
  constructor() {
    this.providers = new Map();
  }

  register(name, provider) {
    this.providers.set(name, provider);
  }

  get(name) {
    return this.providers.get(name);
  }

  list() {
    return Array.from(this.providers.keys());
  }
}

const registry = new SitemapRegistry();

// Bootstrap registration
registry.register('static', require('./providers/static'));
registry.register('posts', require('./providers/posts'));
registry.register('stocks', require('./providers/stocks'));
registry.register('sectors', require('./providers/sectors'));
registry.register('ecosystems', require('./providers/ecosystems'));
registry.register('stories', require('./providers/stories'));

module.exports = registry;
