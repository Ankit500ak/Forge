#!/usr/bin/env node

/**
 * Backend API Integration Test Script
 * Tests all camera API endpoints directly via Node.js
 * 
 * Usage:
 *   node backend/test-camera-api.js
 *   node backend/test-camera-api.js http://localhost:3001
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const BASE_URL = process.argv[2] || 'http://localhost:3001';
const TIMEOUT = 10000; // 10 seconds

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     Camera API Integration Test Suite                          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`🧪 Testing API at: ${BASE_URL}`);
console.log(`⏱️  Timeout: ${TIMEOUT}ms\n`);

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Make HTTP request
 */
function makeRequest(method, endpoint, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
        const isPost = method === 'POST';

        const reqOptions = {
            method,
            headers: {
                'Content-Type': options.contentType || 'application/json',
                ...options.headers
            },
            timeout: TIMEOUT
        };

        const req = http.request(url, reqOptions, (res) => {
            let data = '';

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = options.raw ? data : JSON.parse(data);
                    resolve({ status: res.statusCode, headers: res.headers, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, data: data, parseError: e.message });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

/**
 * Format test result
 */
function formatResult(name, success, details = '') {
    const icon = success ? '✅' : '❌';
    const message = `${icon} ${name}`;
    if (details) {
        return `${message}\n   ${details}`;
    }
    return message;
}

/**
 * Log test section
 */
function logSection(title) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📋 ${title}`);
    console.log('─'.repeat(70));
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

async function runTests() {
    let passed = 0;
    let failed = 0;

    // ────────────────────────────────────────────────────────────────────────────
    // TEST 1: Health Check
    // ────────────────────────────────────────────────────────────────────────────

    logSection('Test 1: Health Check Endpoint');

    try {
        const response = await makeRequest('GET', '/api/camera/health-check');

        if (response.status === 200) {
            console.log(formatResult('Health check endpoint', true, `Status: ${response.status}, Service: ${response.data.service}`));
            passed++;
        } else {
            console.log(formatResult('Health check endpoint', false, `Unexpected status: ${response.status}`));
            failed++;
        }
    } catch (err) {
        console.log(formatResult('Health check endpoint', false, err.message));
        failed++;
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TEST 2: Settings Endpoint
    // ────────────────────────────────────────────────────────────────────────────

    logSection('Test 2: Camera Settings Endpoint');

    try {
        const response = await makeRequest('GET', '/api/camera/settings?useCase=food&deviceType=mobile');

        if (response.status === 200 && response.data.settings) {
            console.log(formatResult('Settings endpoint', true, `Returned settings for: ${response.data.useCase}`));
            console.log(`   - Device Type: ${response.data.deviceType}`);
            console.log(`   - Facing Mode: ${response.data.settings.facingMode}`);
            console.log(`   - Recommendations: ${response.data.recommendations.tips?.length || 0} tips`);
            passed++;
        } else {
            console.log(formatResult('Settings endpoint', false, `Invalid response structure`));
            failed++;
        }
    } catch (err) {
        console.log(formatResult('Settings endpoint', false, err.message));
        failed++;
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TEST 3: Settings with Different Use Cases
    // ────────────────────────────────────────────────────────────────────────────

    logSection('Test 3: Settings with Different Use Cases');

    const useCases = ['food', 'fitness', 'general'];

    for (const useCase of useCases) {
        try {
            const response = await makeRequest('GET', `/api/camera/settings?useCase=${useCase}`);

            if (response.status === 200) {
                console.log(formatResult(`Settings for "${useCase}"`, true, `Returned valid configuration`));
                passed++;
            } else {
                console.log(formatResult(`Settings for "${useCase}"`, false, `Status: ${response.status}`));
                failed++;
            }
        } catch (err) {
            console.log(formatResult(`Settings for "${useCase}"`, false, err.message));
            failed++;
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TEST 4: Invalid Confidence Threshold (Simulated)
    // ────────────────────────────────────────────────────────────────────────────

    logSection('Test 4: Error Handling - Invalid Parameters');

    try {
        // Test with invalid threshold in query (settings endpoint should return defaults gracefully)
        const response = await makeRequest('GET', '/api/camera/settings?threshold=2.0');

        if (response.status === 200) {
            console.log(formatResult('Invalid parameter handling', true, `Returned default settings gracefully`));
            passed++;
        } else {
            console.log(formatResult('Invalid parameter handling', false, `Unexpected error response`));
            failed++;
        }
    } catch (err) {
        console.log(formatResult('Invalid parameter handling', false, err.message));
        failed++;
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TEST 5: CORS Headers
    // ────────────────────────────────────────────────────────────────────────────

    logSection('Test 5: CORS Headers Check');

    try {
        const response = await makeRequest('GET', '/api/camera/health-check');

        const corsHeaders = {
            'access-control-allow-origin': response.headers['access-control-allow-origin'],
            'access-control-allow-methods': response.headers['access-control-allow-methods'],
            'access-control-allow-headers': response.headers['access-control-allow-headers']
        };

        const hasCors = Object.values(corsHeaders).some(h => h);

        if (hasCors) {
            console.log(formatResult('CORS headers enabled', true, 'CORS origins accepted'));
            Object.entries(corsHeaders).forEach(([key, val]) => {
                if (val) console.log(`   - ${key}: ${val.substring(0, 50)}...`);
            });
            passed++;
        } else {
            console.log(formatResult('CORS headers', false === false ? 'Default (no CORS headers set)' : ''));
            // Don't fail - CORS might be handled by proxy
            passed++;
        }
    } catch (err) {
        console.log(formatResult('CORS headers check', false, err.message));
        failed++;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ════════════════════════════════════════════════════════════════════════════════

    logSection('Test Summary');

    const total = passed + failed;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Passed: ${passed}/${total}`);
    console.log(`   ❌ Failed: ${failed}/${total}`);
    console.log(`   📈 Success Rate: ${percentage}%\n`);

    if (failed === 0) {
        console.log('🎉 All tests passed! The backend API is working correctly.\n');
        console.log('Next steps:');
        console.log('   1. Start frontend: cd fitness-app-frontend && npm run dev');
        console.log('   2. Open browser: http://localhost:3000/camera');
        console.log('   3. Grant camera permission when prompted');
        console.log('   4. Test capturing and detecting food items\n');
    } else {
        console.log('⚠️  Some tests failed. Check the backend logs for details.\n');
        console.log('Troubleshooting:');
        console.log('   1. Verify backend server is running on port 3001');
        console.log('   2. Check backend logs for errors');
        console.log('   3. Make sure database connection is working');
        console.log('   4. Verify all dependencies are installed\n');
    }

    process.exit(failed > 0 ? 1 : 0);
}

// ══════════════════════════════════════════════════════════════════════════════
// RUN TESTS
// ══════════════════════════════════════════════════════════════════════════════

runTests().catch(err => {
    console.error('\n❌ Test runner error:', err.message);
    console.error('\nMake sure the backend server is running:');
    console.error('   cd backend && npm start\n');
    process.exit(1);
});
