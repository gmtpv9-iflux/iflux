# Baseline Fingerprints (SHA-256)

**Captured:** 2026-07-28T12:19:10Z  

## Git commits (full 40-char)

```text
git rev-parse AFFILIATE_GOLDEN^{}
b539a959350bceeedb75f1c831a2c20227e042db

git rev-parse HEAD
b539a959350bceeedb75f1c831a2c20227e042db

git rev-parse AFFILIATE_GOLDEN
b51940cbbf3f39ed1333b48f90eacefee26ca3f2
```

Note: `AFFILIATE_GOLDEN` là **annotated tag** (object `b51940c…`). Commit freeze = peel `AFFILIATE_GOLDEN^{}` = **`b539a959350bceeedb75f1c831a2c20227e042db`**. HEAD trùng peel tại thời điểm capture.

## File SHA-256 (working tree = golden blob)

| File | SHA-256 | Lines |
|------|---------|------:|
| `User_Web/iflux-web-ui/auth-social.js` | `ef6e9469f98ad7c345449e41590f15ee485b6ce11389a2f4132a048a12bf5015` | 322 |
| `User_Web/iflux-web-ui/google-onetap.js` | `26df13c3633e1232b9a1cee6c182b49e4aaf5597d1f5f4bce31d346943160509` | 147 |
| `User_Web/iflux-web-ui/auth.js` | `3f20abd3f093b2fd02ddf8e1262027b55381baf1d81fd4d8d21d731cf022ca91` | 1662 |
| `backend/src/modules/legacy-auth/social-auth.service.js` | `ec8a04416879f1fde12000bdea83fe117edf6900981d8990dc3fd4ccf826b731` | 217 |

Raw: [`sha256-baseline-b539a95.txt`](sha256-baseline-b539a95.txt) · [`sha256-at-AFFILIATE_GOLDEN.txt`](sha256-at-AFFILIATE_GOLDEN.txt)

**Match:** working tree hashes **==** `git show AFFILIATE_GOLDEN^{}:<file>` hashes (byte-identical baseline).

## RV-1 verify protocol

```bash
git rev-parse AFFILIATE_GOLDEN^{}   # must be b539a959350bceeedb75f1c831a2c20227e042db
shasum -a 256 User_Web/iflux-web-ui/auth-social.js
# must equal ef6e9469f98ad7c345449e41590f15ee485b6ce11389a2f4132a048a12bf5015
```

Rollback PASS chỉ khi full SHA commit + file SHA-256 khớp bảng trên.
