#!/usr/bin/env python3
"""Serve iFLUX_P1 + clean URL rewrite (no .html) + plan entitlements API."""
import json
import os
import re
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import unquote, urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLANS_FILE = os.path.join(ROOT, 'User_Web', 'data', 'iflux-plans-v1.json')

# (regex on path, file under ROOT, optional query inject fn(match) -> dict)
# Path is without query string.
CLEAN_ROUTES = [
    # Community entity pages
    (re.compile(r'^/User_Web/community/stories/([^/]+)/?$'), 'User_Web/community/story.html',
     lambda m: {'slug': unquote(m.group(1))}),
    (re.compile(r'^/User_Web/community/stocks/([^/]+)/?$'), 'User_Web/stock/index.html',
     lambda m: {'ticker': unquote(m.group(1)).upper()}),
    (re.compile(r'^/User_Web/community/sectors/([^/]+)/?$'), 'User_Web/sector/index.html',
     lambda m: {'id': unquote(m.group(1))}),
    (re.compile(r'^/User_Web/community/ecosystems/([^/]+)/?$'), 'User_Web/family/index.html',
     lambda m: {'id': unquote(m.group(1))}),
    (re.compile(r'^/User_Web/community/topics/([^/]+)/?$'), 'User_Web/story/index.html',
     lambda m: {'id': unquote(m.group(1))}),
    (re.compile(r'^/User_Web/community/tag/([^/]+)/?$'), 'User_Web/community/tag.html',
     lambda m: {'tag': unquote(m.group(1))}),
    # Legacy cong-dong → stories
    (re.compile(r'^/User_Web/community/cong-dong/[^/]+/([^/]+)/?$'), 'User_Web/community/story.html',
     lambda m: {'slug': unquote(m.group(1))}),
    # App sections without index.html
    (re.compile(r'^/User_Web/community/?$'), 'User_Web/community/index.html', None),
    (re.compile(r'^/User_Web/market/?$'), 'User_Web/market/index.html', None),
    (re.compile(r'^/User_Web/flow/?$'), 'User_Web/flow/index.html', None),
    (re.compile(r'^/User_Web/home/?$'), 'User_Web/home/index.html', None),
    (re.compile(r'^/User_Web/pricing/?$'), 'User_Web/pricing/index.html', None),
    (re.compile(r'^/User_Web/loyalty/?$'), 'User_Web/loyalty/index.html', None),
    (re.compile(r'^/User_Web/faq/?$'), 'User_Web/faq/index.html', None),
    (re.compile(r'^/User_Web/watchlist/?$'), 'User_Web/watchlist/index.html', None),
    (re.compile(r'^/User_Web/search/?$'), 'User_Web/search/index.html', None),
    (re.compile(r'^/User_Web/guest/?$'), 'User_Web/guest/index.html', None),
    (re.compile(r'^/User_Web/alerts/?$'), 'User_Web/alerts/index.html', None),
    (re.compile(r'^/User_Web/share/?$'), 'User_Web/share/index.html', None),
]


class IfluxDevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def _plans_payload(self):
        if os.path.isfile(PLANS_FILE):
            with open(PLANS_FILE, 'r', encoding='utf-8') as f:
                return f.read()
        return json.dumps({'version': 1, 'updatedAt': 0, 'overrides': {}, 'custom': []})

    def _rewrite_path(self, path):
        """Return (filesystem path relative to ROOT, extra query dict) or None."""
        for rx, file_path, inject in CLEAN_ROUTES:
            m = rx.match(path)
            if not m:
                continue
            full = os.path.join(ROOT, file_path)
            if not os.path.isfile(full):
                continue
            extra = inject(m) if inject else None
            return file_path, extra
        return None

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ('/api/plans/runtime', '/api/plans/runtime/'):
            body = self._plans_payload()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(body.encode('utf-8'))
            return

        rewritten = self._rewrite_path(path)
        if rewritten:
            file_path, extra = rewritten
            # Serve file but keep browser URL; inject query for legacy parsers
            if extra:
                from urllib.parse import urlencode, parse_qs
                qs = parse_qs(parsed.query, keep_blank_values=True)
                for k, v in extra.items():
                    qs[k] = [v]
                # flatten
                flat = []
                for k, vals in qs.items():
                    for v in vals:
                        flat.append((k, v))
                new_q = urlencode(flat)
                self.path = '/' + file_path.replace('\\', '/') + ('?' + new_q if new_q else '')
            else:
                self.path = '/' + file_path.replace('\\', '/')
            return SimpleHTTPRequestHandler.do_GET(self)

        super().do_GET()

    def do_PUT(self):
        path = self.path.split('?', 1)[0]
        if path not in ('/api/plans/runtime', '/api/plans/runtime/'):
            self.send_error(404)
            return
        length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(length).decode('utf-8')
        data = json.loads(raw)
        data['updatedAt'] = data.get('updatedAt') or int(__import__('time').time() * 1000)
        os.makedirs(os.path.dirname(PLANS_FILE), exist_ok=True)
        with open(PLANS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"ok":true}')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8777'))
    print(f'iFlux dev server → http://127.0.0.1:{port}/')
    print(f'Plans file     → {PLANS_FILE}')
    print('Clean URLs    → /User_Web/community/stories/{slug} · stocks · sectors · ecosystems · topics · tag')
    HTTPServer(('0.0.0.0', port), IfluxDevHandler).serve_forever()
