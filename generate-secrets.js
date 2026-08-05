// generate-secrets.js
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

const jwtAccessSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

let envContent = fs.readFileSync(envPath, 'utf8');

envContent = envContent.replace(/JWT_ACCESS_SECRET=.*/, `JWT_ACCESS_SECRET=${jwtAccessSecret}` );

envContent = envContent.replace(/JWT_REFRESH_SECRET=.*/, `JWT_REFRESH_SECRET=${jwtRefreshSecret}` );

fs.writeFileSync(envPath, envContent);

console.log('✓ Secrets mis à jour dans .env');
console.log('JWT_ACCESS_SECRET=' + jwtAccessSecret);
console.log('JWT_REFRESH_SECRET=' + jwtRefreshSecret);
