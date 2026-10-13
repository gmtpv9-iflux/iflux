'use strict';

// Chạy từ backend; không gọi model, không in môi trường hoặc nội dung secret.
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { initPool,query,closePool } = require('../src/core/database/connection');

async function main() {
  const document = fs.readFileSync(path.resolve(__dirname,'../../docs/AI-News-Programmatic-Prompt.md'),'utf8');
  const body = document.split('<!-- PROMPT_START -->')[1]?.split('<!-- PROMPT_END -->')[0]?.trim();
  if (!body) throw new Error('Prompt markers missing');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing');
  initPool({ DATABASE_URL:process.env.DATABASE_URL,APP_ENV:process.env.APP_ENV || 'local' });
  try {
    const result = await query(`INSERT INTO ai_prompts(code,name,body,status) VALUES('news-editorial-v1','iFlux — extract/compose bài nguồn',$1,'active')
      ON CONFLICT(code) DO NOTHING RETURNING id`,[body]);
    process.stdout.write(result.rows.length ? 'Đã đăng ký prompt news-editorial-v1.\n' : 'Prompt đã tồn tại; giữ nguyên bản Admin đang quản lý.\n');
  } finally { await closePool(); }
}
main().catch(()=>{ process.stderr.write('Không đăng ký được prompt; kiểm tra file tài liệu, migration và kết nối DB.\n');process.exitCode=1; });
