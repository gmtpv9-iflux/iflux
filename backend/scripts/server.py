#!/usr/bin/env python3
"""iFlux local API — PostgreSQL auth (chạy khi chưa có Node)."""
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = Flask(__name__)
CORS(app, resources={r'/api/*': {'origins': '*'}})

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost:5432/iflux_dev')
JWT_SECRET = os.getenv('JWT_SECRET', 'iflux-local-dev')
PORT = int(os.getenv('PORT', '3001'))


def db():
    return psycopg2.connect(DATABASE_URL)


def gen_referral():
    return 'IFL' + secrets.token_hex(3).upper()[:5]


def token_for(user_id, remember=False):
    exp = datetime.now(timezone.utc) + timedelta(days=30 if remember else 7)
    return jwt.encode({'sub': str(user_id), 'exp': exp}, JWT_SECRET, algorithm='HS256')


def auth_user():
    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    try:
        payload = jwt.decode(header[7:], JWT_SECRET, algorithms=['HS256'])
        return payload.get('sub')
    except jwt.PyJWTError:
        return None


@app.get('/health')
def health():
    return jsonify(ok=True, service='iflux-api-local-python')


@app.post('/api/auth/register')
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    if not email or not password:
        return jsonify(error='Email and password required'), 422
    if len(password) < 8:
        return jsonify(error='Password must be at least 8 characters'), 422

    display_name = (data.get('display_name') or '').strip() or None
    phone = (data.get('phone') or '').strip() or None
    referral_code = (data.get('referral_code') or '').strip().upper() or None

    with db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute('SELECT id FROM users WHERE email = %s', (email,))
            if cur.fetchone():
                return jsonify(error='Email already registered'), 422

            referred_by = None
            if referral_code:
                cur.execute('SELECT id FROM users WHERE referral_code = %s', (referral_code,))
                row = cur.fetchone()
                if row:
                    referred_by = row['id']

            pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            for _ in range(5):
                ref = gen_referral()
                try:
                    cur.execute(
                        '''INSERT INTO users (email, password_hash, display_name, nickname, phone, referral_code, referred_by)
                           VALUES (%s,%s,%s,%s,%s,%s,%s)
                           RETURNING id, email, subscription_tier''',
                        (email, pw_hash, display_name, display_name, phone, ref, referred_by)
                    )
                    user = cur.fetchone()
                    conn.commit()
                    tok = token_for(user['id'])
                    return jsonify(token=tok, user={'id': str(user['id']), 'email': user['email'], 'plan': user['subscription_tier'] or 'free'})
                except psycopg2.errors.UniqueViolation as e:
                    conn.rollback()
                    if 'referral_code' in str(e):
                        continue
                    raise
    return jsonify(error='Could not create user'), 500


@app.post('/api/auth/login')
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    if not email or not password:
        return jsonify(error='Email and password required'), 422

    with db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute('SELECT * FROM users WHERE email = %s', (email,))
            user = cur.fetchone()
            if not user or not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
                return jsonify(error='Invalid credentials'), 401
            if user.get('account_status') != 'active':
                return jsonify(error='Account suspended'), 403
            tok = token_for(user['id'], data.get('remember_me') in (True, 'true'))
            return jsonify(token=tok, user={'id': str(user['id']), 'email': user['email'], 'plan': user.get('subscription_tier') or 'free'})


@app.get('/api/auth/me')
def me():
    uid = auth_user()
    if not uid:
        return jsonify(error='Unauthorized'), 401
    with db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                '''SELECT id, email, phone, display_name, nickname, referral_code,
                          subscription_tier AS plan, subscription_expires_at AS plan_expired_at,
                          account_status AS status, created_at
                   FROM users WHERE id = %s''',
                (uid,)
            )
            user = cur.fetchone()
            if not user:
                return jsonify(error='User not found'), 404
            user['id'] = str(user['id'])
            return jsonify(user)


@app.put('/api/users/profile')
def profile():
    uid = auth_user()
    if not uid:
        return jsonify(error='Unauthorized'), 401
    data = request.get_json(silent=True) or {}
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''UPDATE users SET
                   nickname = COALESCE(%s, nickname),
                   display_name = COALESCE(%s, display_name),
                   phone = COALESCE(%s, phone),
                   updated_at = NOW()
                   WHERE id = %s''',
                (data.get('nickname'), data.get('display_name'), data.get('phone'), uid)
            )
            conn.commit()
    return jsonify(ok=True)


if __name__ == '__main__':
    print(f'iFlux local API (Python) http://localhost:{PORT}')
    app.run(host='0.0.0.0', port=PORT, debug=False)
