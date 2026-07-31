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

module.exports = registry;
