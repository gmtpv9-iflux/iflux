# Admin canonical PUBLIC→shell — P1: 0 rule sống.
# Không include vào iflux-staging-app.conf cho đến P3.
# P3: location exact canary fragment (serve file, không 301 PUBLIC)
#     + Express ALLOWLIST (canonical-route-allowlist.json) mới gửi shell.
# Auth /admin/login giữ nguyên — không vào block này.
