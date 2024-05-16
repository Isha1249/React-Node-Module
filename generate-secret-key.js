const fs = require('fs');
const crypto = require('crypto');
 
// Generate a random secret key
const generateSecretKey = () => crypto.randomBytes(32).toString('hex');
const jwtsecretkey = generateSecretKey();
const refreshTokenSecretKey = generateSecretKey();
// Write the secret key to the .env file


fs.writeFileSync('.env', `JWT_SECRET=${jwtsecretkey}\nREFRESH_TOKEN_SECRET=${refreshTokenSecretKey}\n`, { flag: 'a' });
 
console.log(`Secret key has been saved to .env: JWT_SECRET=${jwtsecretkey},REFRESH_TOKEN_SECRET=${refreshTokenSecretKey}`)