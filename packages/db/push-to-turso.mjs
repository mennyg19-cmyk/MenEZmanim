import { readFileSync } from 'fs';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN');
  process.exit(1);
}

const httpUrl = url.replace('libsql://', 'https://');

const sql = readFileSync(new URL('./turso-init.sql', import.meta.url), 'utf8');

const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`Pushing ${statements.length} statements to ${httpUrl} ...`);

for (const stmt of statements) {
  const preview = stmt.slice(0, 70).replace(/\n/g, ' ');
  try {
    const res = await fetch(`${httpUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql: stmt } },
          { type: 'close' },
        ],
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      console.error(`  FAIL (${res.status}): ${preview}...`);
      console.error(`        ${JSON.stringify(body)}`);
    } else if (body.results?.[0]?.type === 'error') {
      console.error(`  FAIL: ${preview}...`);
      console.error(`        ${body.results[0].error.message}`);
    } else {
      console.log(`  OK: ${preview}...`);
    }
  } catch (err) {
    console.error(`  ERR: ${preview}...`);
    console.error(`       ${err.message}`);
  }
}

console.log('Done!');
