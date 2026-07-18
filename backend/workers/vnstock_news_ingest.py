#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RAW-CONTENT-VNSTOCK connector — SoT platform-layers.
Kéo tin qua vnstock_news (Crawler RSS) → POST /api/content/ingest/batch.
Không gọi từ FE. Chạy bằng cron/PM2/scheduler Node.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

SITES_DEFAULT = ["cafef", "vietstock"]


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def row_to_article(row: Dict[str, Any], site: str) -> Optional[Dict[str, Any]]:
    url = str(row.get("url") or row.get("link") or "").strip()
    title = str(row.get("title") or "").strip()
    if not url or not title:
        return None
    content = row.get("content") or row.get("content_html") or row.get("body") or ""
    short_description = (
        row.get("short_description")
        or row.get("description")
        or row.get("summary")
        or ""
    )
    publish_time = row.get("publish_time") or row.get("pubDate") or row.get("published")
    if publish_time is not None and not isinstance(publish_time, str):
        try:
            publish_time = publish_time.isoformat()
        except Exception:
            publish_time = str(publish_time)
    tags = row.get("tags") or ""
    if isinstance(tags, (list, tuple)):
        tags = ",".join(str(t) for t in tags if t)
    return {
        "url": url,
        "title": title,
        "short_description": str(short_description or "")[:2000],
        "content": str(content or ""),
        "publish_time": publish_time,
        "author": str(row.get("author") or ""),
        "category": str(row.get("category") or ""),
        "tags": str(tags or ""),
        "image_url": str(row.get("image_url") or row.get("image") or ""),
        "source": site,
        "view_counts": row.get("view_counts"),
    }


def fetch_vnstock(site: str, limit: int) -> List[Dict[str, Any]]:
    Crawler = None
    err_import = None
    try:
        from vnstock_news import Crawler as _C  # type: ignore

        Crawler = _C
    except Exception as exc1:
        err_import = exc1
        try:
            from vnewsapi import Crawler as _C  # type: ignore

            Crawler = _C
        except Exception as exc2:
            raise RuntimeError(
                "Không import được vnstock_news/vnewsapi: %s | %s" % (err_import, exc2)
            ) from exc2

    # Hỗ trợ cả Crawler(site_name=...) và Crawler(site)
    try:
        crawler = Crawler(site_name=site)
    except TypeError:
        crawler = Crawler(site)

    articles: Any = None
    if hasattr(crawler, "get_articles_from_feed"):
        try:
            articles = crawler.get_articles_from_feed(limit_per_feed=limit)
        except TypeError:
            articles = crawler.get_articles_from_feed(limit)
    elif hasattr(crawler, "get_articles"):
        try:
            articles = crawler.get_articles(limit=limit)
        except TypeError:
            articles = crawler.get_articles(limit)
    else:
        raise RuntimeError("Crawler không có get_articles(_from_feed)")

    out: List[Dict[str, Any]] = []
    if articles is None:
        return out
    if hasattr(articles, "to_dict"):
        records = articles.to_dict(orient="records")
        for rec in records[:limit]:
            mapped = row_to_article(rec, site)
            if mapped:
                out.append(mapped)
        return out
    if isinstance(articles, list):
        for rec in articles[:limit]:
            if isinstance(rec, dict):
                mapped = row_to_article(rec, site)
                if mapped:
                    out.append(mapped)
    return out


def fetch_rss_fallback(site: str, limit: int) -> List[Dict[str, Any]]:
    """Fallback tối thiểu khi chưa cài thư viện crawler."""
    import html as html_lib
    import re
    import xml.etree.ElementTree as ET

    out: List[Dict[str, Any]] = []

    def parse_rss(url: str) -> List[Dict[str, Any]]:
        req = urllib.request.Request(url, headers={"User-Agent": "iFluxContentWorker/1.0"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = resp.read()
        # loại bỏ ký tự control gây lỗi XML
        text = raw.decode("utf-8", "replace")
        text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
        try:
            root = ET.fromstring(text.encode("utf-8"))
        except ET.ParseError:
            # strip CDATA broken entities loosely
            text2 = re.sub(r"&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)", "&amp;", text)
            root = ET.fromstring(text2.encode("utf-8"))
        items = []
        for item in root.findall(".//item")[:limit]:
            title = html_lib.unescape((item.findtext("title") or "").strip())
            link = (item.findtext("link") or "").strip()
            desc = html_lib.unescape((item.findtext("description") or "").strip())
            pub = (item.findtext("pubDate") or "").strip()
            mapped = row_to_article(
                {
                    "url": link,
                    "title": title,
                    "short_description": re.sub("<[^>]+>", "", desc)[:500],
                    "content": desc,
                    "publish_time": pub,
                    "category": "Tin tức",
                    "source": site,
                },
                site,
            )
            if mapped:
                items.append(mapped)
        return items

    def parse_sitemap(url: str) -> List[Dict[str, Any]]:
        req = urllib.request.Request(url, headers={"User-Agent": "iFluxContentWorker/1.0"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = resp.read()
        root = ET.fromstring(raw)
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        urls = root.findall("sm:url", ns) or root.findall("url")
        items = []
        for u in urls[:limit]:
            loc_el = u.find("sm:loc", ns)
            loc = (loc_el.text if loc_el is not None else None) or (u.findtext("loc") or "")
            loc = loc.strip()
            if not loc:
                continue
            slug = loc.rstrip("/").split("/")[-1].replace(".chn", "").replace("-", " ")
            mapped = row_to_article(
                {
                    "url": loc,
                    "title": slug[:200] or loc,
                    "short_description": "",
                    "content": "",
                    "publish_time": datetime.now(timezone.utc).isoformat(),
                    "category": "Tin tức",
                    "source": site,
                },
                site,
            )
            if mapped:
                items.append(mapped)
        return items

    try:
        if site == "vietstock":
            for feed in (
                "https://vietstock.vn/163/chu-de/rss.ashx",
                "https://vietstock.vn/rss/tin-moi.rss",
            ):
                try:
                    out = parse_rss(feed)
                    if out:
                        return out
                except Exception as exc:
                    print(json.dumps({"warn": "rss_vietstock", "feed": feed, "error": str(exc)}), file=sys.stderr)
            out = parse_sitemap("https://vietstock.vn/sitemap.xml")
        elif site == "cafef":
            try:
                out = parse_sitemap("https://cafef.vn/latest-news-sitemap.xml")
            except Exception as exc:
                print(json.dumps({"warn": "sitemap_cafef_fail", "error": str(exc)}), file=sys.stderr)
                out = []
        elif site == "baodautu":
            out = parse_rss("https://baodautu.vn/rss/home.rss")
    except Exception as exc:
        print(json.dumps({"warn": "fallback_fail", "site": site, "error": str(exc)}), file=sys.stderr)
    return out


def crawl_site(site: str, limit: int) -> List[Dict[str, Any]]:
    """Ưu tiên fallback sitemap/RSS (nhanh, ổn định); bổ sung lib nếu có trong timeout ngắn."""
    from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout

    fallback = []
    try:
        fallback = fetch_rss_fallback(site, limit)
    except Exception as exc:
        print(json.dumps({"warn": "fallback_fail", "site": site, "error": str(exc)}), file=sys.stderr)

    force_fb = os.environ.get("VNSTOCK_FORCE_FALLBACK", "").strip() in ("1", "true", "yes")
    if force_fb and fallback:
        return fallback[:limit]

    if fallback and len(fallback) >= max(3, min(limit, 5)):
        # Đủ bài từ sitemap/RSS — không chờ crawler nặng
        return fallback[:limit]

    try:
        with ThreadPoolExecutor(max_workers=1) as pool:
            fut = pool.submit(fetch_vnstock, site, limit)
            try:
                lib_rows = fut.result(timeout=25)
                if lib_rows:
                    return lib_rows[:limit]
            except FuturesTimeout:
                print(json.dumps({"warn": "vnstock_timeout", "site": site}), file=sys.stderr)
                fut.cancel()
    except Exception as exc:
        print(json.dumps({"warn": "vnstock_fail", "site": site, "error": str(exc)}), file=sys.stderr)

    return (fallback or [])[:limit]


def post_batch(api_base: str, admin_key: str, articles: List[Dict[str, Any]]) -> Dict[str, Any]:
    url = api_base.rstrip("/") + "/content/ingest/batch"
    body = json.dumps(
        {
            "articles": articles,
            "publishToFeed": False,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Admin-Key": admin_key,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
            return payload.get("data") or payload
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", "replace")
        raise RuntimeError("HTTP %s: %s" % (e.code, err_body[:500])) from e


def main() -> int:
    parser = argparse.ArgumentParser(description="iFlux Vnstock News → Content Engine ingest")
    parser.add_argument("--sites", default=",".join(SITES_DEFAULT), help="cafef,vietstock,...")
    parser.add_argument("--limit", type=int, default=15, help="Số bài / nguồn mỗi lần chạy")
    parser.add_argument(
        "--api-base",
        default=env("IFLUX_API_BASE", "http://127.0.0.1:3001/api"),
        help="Base URL API (…/api)",
    )
    parser.add_argument("--admin-key", default=env("ADMIN_API_KEY", ""), help="X-Admin-Key")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.admin_key and not args.dry_run:
        print("ADMIN_API_KEY / --admin-key bắt buộc", file=sys.stderr)
        return 2

    sites = [s.strip() for s in args.sites.split(",") if s.strip()]
    collected: List[Dict[str, Any]] = []
    for site in sites:
        batch = crawl_site(site, args.limit)
        print(json.dumps({"site": site, "crawled": len(batch)}), flush=True)
        collected.extend(batch)

    # dedupe by url
    seen = set()
    unique: List[Dict[str, Any]] = []
    for a in collected:
        u = a["url"]
        if u in seen:
            continue
        seen.add(u)
        unique.append(a)

    result = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "sites": sites,
        "crawled": len(unique),
        "dry_run": bool(args.dry_run),
    }
    if args.dry_run:
        result["sample"] = unique[:3]
        print(json.dumps(result, ensure_ascii=False))
        return 0

    if not unique:
        result["ok_count"] = 0
        result["fail_count"] = 0
        print(json.dumps(result, ensure_ascii=False))
        return 0

    # Chunk 40
    ok = 0
    fail = 0
    details = []
    chunk_size = 40
    for i in range(0, len(unique), chunk_size):
        chunk = unique[i : i + chunk_size]
        try:
            resp = post_batch(args.api_base, args.admin_key, chunk)
            ok += int(resp.get("ok_count") or 0)
            fail += int(resp.get("fail_count") or 0)
            details.extend(resp.get("results") or [])
        except Exception as exc:
            fail += len(chunk)
            details.append({"ok": False, "error": str(exc)})
            print(json.dumps({"error": str(exc)}), file=sys.stderr)

    result["ok_count"] = ok
    result["fail_count"] = fail
    result["results_head"] = details[:5]
    print(json.dumps(result, ensure_ascii=False))
    return 0 if fail == 0 or ok > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
