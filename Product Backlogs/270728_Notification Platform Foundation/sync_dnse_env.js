/**
 * Đồng bộ DNSE_USERNAME và DNSE_PASSWORD từ api/.env (local) lên server /var/www/iflux-api/.env.
 * Chạy: node sync_dnse_env.js
 * Không ghi đè các biến khác trên server, chỉ thêm/cập nhật 2 biến DNSE.
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '103.154.177.157';
const PORT = 7878;
const USER = 'root';
const PASSWORD = 'VvZsYxOBlNdz';
const REMOTE_DIR = '/var/www/iflux-api';
const LOCAL_ENV = path.join(__dirname, '..', 'api', '.env');

function parseEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

const local = parseEnv(LOCAL_ENV);
const dnseUser = local.DNSE_USERNAME;
const dnsePass = local.DNSE_PASSWORD;

if (!dnseUser || !dnsePass) {
  console.error('Trong api/.env (local) cần có DNSE_USERNAME và DNSE_PASSWORD.');
  process.exit(1);
}

const twoLines = `DNSE_USERNAME=${dnseUser}\nDNSE_PASSWORD=${dnsePass}\n`;
const tmpFile = path.join(__dirname, '.dnse_env_tmp');
fs.writeFileSync(tmpFile, twoLines, 'utf8');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) {
      try { fs.unlinkSync(tmpFile); } catch (_) {}
      return console.error('SFTP:', err), conn.end();
    }
    sftp.fastPut(tmpFile, '/tmp/dnse_env_merge', (writeErr) => {
      try { fs.unlinkSync(tmpFile); } catch (_) {}
      if (writeErr) return console.error('Upload /tmp/dnse_env_merge:', writeErr), conn.end();
      const mergeScript = `const fs=require('fs');
const p='/var/www/iflux-api/.env';
const add=fs.readFileSync('/tmp/dnse_env_merge','utf8').trim().split(/\\r?\\n/);
let s=fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
s=s.split(/\\r?\\n/).filter(l=>!l.startsWith('DNSE_USERNAME=')&&!l.startsWith('DNSE_PASSWORD=')).join('\\n').replace(/\\n+$/,'');
fs.writeFileSync(p,(s+(s?'\\n':'')+add.join('\\n')+'\\n'));
fs.unlinkSync('/tmp/dnse_env_merge');
console.log('Updated .env with DNSE_*');
`;
      const scriptPath = path.join(__dirname, '.merge_env_tmp.js');
      fs.writeFileSync(scriptPath, mergeScript, 'utf8');
      sftp.fastPut(scriptPath, '/tmp/merge_dnse_env.js', (putErr) => {
        try { fs.unlinkSync(scriptPath); } catch (_) {}
        if (putErr) return console.error('Upload merge script:', putErr), conn.end();
        conn.exec(`cd ${REMOTE_DIR} && node /tmp/merge_dnse_env.js && rm -f /tmp/merge_dnse_env.js && pm2 restart iflux-api && sleep 2 && pm2 list`, (execErr, stream) => {
        if (execErr) return console.error(execErr), conn.end();
        stream.on('close', (code) => {
          conn.end();
          if (code === 0) console.log('Done. DNSE đã được cấu hình trên server.');
        }).on('data', d => process.stdout.write(d.toString())).stderr.on('data', d => process.stderr.write(d.toString()));
        });
      });
    });
  });
}).on('error', e => {
  try { fs.unlinkSync(tmpFile); } catch (_) {}
  console.error(e);
}).connect({ host: HOST, port: PORT, username: USER, password: PASSWORD, readyTimeout: 15000 });
