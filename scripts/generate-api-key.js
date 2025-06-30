/**
 * Generate API Secret Key
 * 
 * Run this script with: node scripts/generate-api-key.js
 * 
 * This script will generate a secure random key for API_SECRET_KEY
 */

const crypto = require('crypto');

// Generate a random 32-byte hex string
const apiKey = crypto.randomBytes(32).toString('hex');

console.log('Add this to your .env.local file:');
console.log(`API_SECRET_KEY=${apiKey}`);
