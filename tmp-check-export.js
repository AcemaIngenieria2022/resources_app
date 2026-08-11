import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const path = require('path');
const file = path.resolve('src/lib/security/password.js');
console.log('path:', file);
const mod = await import(`file://${file.replace(/\\/g, '/')}`);
console.log('keys:', Object.keys(mod));
console.log('hashPassword', typeof mod.hashPassword);
console.log('verifyPassword', typeof mod.verifyPassword);
