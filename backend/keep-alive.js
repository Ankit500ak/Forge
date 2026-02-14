/**
 * Keep Alive Bot
 * Pings the server periodically to prevent Render free tier from spinning down
 * 
 * Usage:
 *   node keep-alive.js                    (uses default URL)
 *   node keep-alive.js http://localhost:5000  (custom URL)
 *   npm run keep-alive                    (from backend directory)
 */

const http = require('http');
const https = require('https');

// Get server URL from command line or use default
const SERVER_URL = process.argv[2] || 'https://forge-1-b9ib.onrender.com';
const ENDPOINT = `${SERVER_URL}/api/health`;
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

console.log('🤖 Keep Alive Bot Started');
console.log(`📍 Target: ${ENDPOINT}`);
console.log(`⏱️  Interval: ${INTERVAL_MS / 1000 / 60} minutes`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let requestCount = 0;

function ping() {
    requestCount++;
    const timestamp = new Date().toLocaleString();
    const protocol = ENDPOINT.startsWith('https') ? https : http;

    protocol
        .get(ENDPOINT, (res) => {
            const status = res.statusCode;
            const statusEmoji = status === 200 ? '✅' : '⚠️';
            console.log(`[${timestamp}] ${statusEmoji} Ping #${requestCount} - Status: ${status}`);
        })
        .on('error', (err) => {
            console.error(`[${timestamp}] ❌ Ping #${requestCount} - Error: ${err.message}`);
        });
}

// Send first ping immediately
ping();

// Then send periodic pings
setInterval(ping, INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👋 Keep Alive Bot Stopped (${requestCount} total pings sent)`);
    process.exit(0);
});
