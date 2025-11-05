#!/usr/bin/env node

/**
 * Integration Test Script for SOMI Sentinel
 * Tests all service connections and integrations
 */

const http = require('http');
const https = require('https');

const SERVICES = {
  frontend: { port: 5173, path: '/', name: 'Frontend (Vite)' },
  backend: { port: 3000, path: '/health', name: 'Backend API' },
  agent: { port: 3002, path: '/health', name: 'Agent Service' },
  relayer: { port: 3001, path: '/health', name: 'Relayer Service' }
};

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function makeRequest(host, port, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testService(serviceName, config) {
  try {
    log(`Testing ${config.name}...`, 'blue');
    const result = await makeRequest('localhost', config.port, config.path);
    
    if (result.status === 200) {
      log(`✅ ${config.name} is running (Status: ${result.status})`, 'green');
      return { service: serviceName, status: 'ok', details: result.data };
    } else {
      log(`⚠️  ${config.name} responded with status ${result.status}`, 'yellow');
      return { service: serviceName, status: 'warning', details: result.data };
    }
  } catch (error) {
    log(`❌ ${config.name} is not accessible: ${error.message}`, 'red');
    return { service: serviceName, status: 'error', error: error.message };
  }
}

async function testIntegration() {
  log('🚀 Starting SOMI Sentinel Integration Tests', 'bold');
  log('==========================================', 'bold');
  
  const results = [];
  
  // Test each service
  for (const [serviceName, config] of Object.entries(SERVICES)) {
    const result = await testService(serviceName, config);
    results.push(result);
    console.log(''); // Add spacing
  }
  
  // Summary
  log('📊 Integration Test Summary', 'bold');
  log('============================', 'bold');
  
  const okServices = results.filter(r => r.status === 'ok').length;
  const warningServices = results.filter(r => r.status === 'warning').length;
  const errorServices = results.filter(r => r.status === 'error').length;
  
  log(`✅ Working: ${okServices} services`, 'green');
  log(`⚠️  Warnings: ${warningServices} services`, 'yellow');
  log(`❌ Errors: ${errorServices} services`, 'red');
  
  console.log('');
  
  // Detailed results
  results.forEach(result => {
    const statusIcon = result.status === 'ok' ? '✅' : 
                      result.status === 'warning' ? '⚠️' : '❌';
    log(`${statusIcon} ${result.service}: ${result.status}`, 
        result.status === 'ok' ? 'green' : 
        result.status === 'warning' ? 'yellow' : 'red');
    
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('');
  
  // Recommendations
  if (errorServices > 0) {
    log('🔧 Recommendations:', 'bold');
    log('==================', 'bold');
    
    results.filter(r => r.status === 'error').forEach(result => {
      switch (result.service) {
        case 'frontend':
          log('• Start frontend: npm run dev:frontend', 'yellow');
          break;
        case 'backend':
          log('• Start backend: npm run dev:backend', 'yellow');
          break;
        case 'agent':
          log('• Start agent: npm run dev:agent', 'yellow');
          break;
        case 'relayer':
          log('• Start relayer: npm run dev:relayer', 'yellow');
          break;
      }
    });
    
    log('• Or start all services: npm run dev:all', 'yellow');
  } else {
    log('🎉 All services are running! The integration is working correctly.', 'green');
  }
  
  // Exit with appropriate code
  process.exit(errorServices > 0 ? 1 : 0);
}

// Run the test
testIntegration().catch(error => {
  log(`❌ Integration test failed: ${error.message}`, 'red');
  process.exit(1);
});


