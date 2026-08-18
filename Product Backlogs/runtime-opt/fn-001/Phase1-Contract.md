# FN-001 — Phase 1 Contract

**Ngày:** 2026-07-24  
**SoT:** Follow & Notification Domain · Plan FN-001 §3–§4

## Follow User API

| Method | Path | Behavior |
|--------|------|----------|
| POST | `/api/follow/users/:id` | Follow |
| DELETE | `/api/follow/users/:id` | Unfollow |
| GET | `/api/follow/users/:id/exist` | `{ following: bool }` |
| GET | `/api/follow/users/me/following?cursor&limit` | Page following (max limit 50) |
| GET | `/api/follow/users/:id/counts` | `{ followers, following }` — **không** full list |

**Forbidden:** `GET …/followers` full · `GET …/following` full không cursor.

## Inbox API (App Shell)

| Method | Path | Necessity |
|--------|------|-----------|
| GET | `/api/notifications/summary` | Need Now badge `{ unreadCount }` |
| GET | `/api/notifications?cursor&limit` | Need Soon panel / Need Maybe history (max 30) |
| POST | `/api/notifications/:id/read` | Mark one |
| POST | `/api/notifications/read-all` | Mark all |

**Forbidden:** dump full history một request không cursor.

## Business Events (publish only)

| Event | Payload tối thiểu |
|-------|-------------------|
| `community.post.published` | postId, slug, title, authorId, authorName, tickers[], chuDeSlugs[], status |
| `community.post.shared` | postId, slug, title, actorId, actorName |
| `entity.comment.created` | commentId, entityType, entityId, authorId, authorName, parentId, bodyPreview |
| `comment.liked` | commentId, likerId, likerName, ownerId, bodyPreview, deepLink |

Notification subscriber **đăng ký** các event trên. Business service chỉ `bus.publish(...)`.

## Notification DTO

```text
id, templateCode, title, body, icon, href, createdAt, read
Forbidden: body_html bài, thread[], persistence dump
```

## Deep link (SoT §7)

| templateCode | href |
|--------------|------|
| USER_WL_TAGGED_POST / USER_COMM_POST / USER_FOLLOW_SHARE | `/cong-dong/bai-viet/{slug}` |
| USER_FOLLOW_ENTITY_COMMENT | entity URL + `#comment-{id}` |
| USER_IX_COMMENT_LIKED / REPLY | host bình luận + anchor |
