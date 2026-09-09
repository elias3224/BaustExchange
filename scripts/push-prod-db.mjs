import fs from 'fs';
import { execSync } from 'child_process';

const envContent = fs.readFileSync('.env.prod', 'utf8');
const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);

if (!match || match[1] === '[SENSITIVE]') {
  console.error('DATABASE_URL is placeholder or missing in .env.prod');
  process.exit(1);
}

const dbUrl = match[1];
console.log('Pushing schema to production database...');
execSync('npx prisma db push', {
  env: { ...process.env, DATABASE_URL: dbUrl },
  stdio: 'inherit',
});

