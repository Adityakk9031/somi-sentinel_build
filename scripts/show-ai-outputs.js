#!/usr/bin/env node

/**
 * Script to view AI Agent outputs and activity
 * Usage: node scripts/show-ai-outputs.js
 */

const http = require('http');

const API_URL = 'http://localhost:3002';
const POLL_INTERVAL = 3000; // 3 seconds

function fetchActivity() {
  return new Promise((resolve, reject) => {
    http.get(`${API_URL}/activity`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function displayActivity(activity) {
  console.clear();
  console.log('🤖 SOMI Sentinel AI Agent - Live Activity Monitor');
  console.log('==================================================\n');
  
  if (!activity.activity || activity.activity.length === 0) {
    console.log('⏳ Waiting for AI activity...');
    console.log('The agent is collecting signals and analyzing the market.');
    console.log('\nCheck logs for details: tail -f logs/combined.log');
    return;
  }
  
  console.log(`📊 Total Entries: ${activity.totalEntries}`);
  console.log(`📝 Showing Last: ${activity.activity.length} entries\n`);
  
  activity.activity.slice(-10).reverse().forEach((entry, index) => {
    console.log(`\n[${index + 1}] ${entry.timestamp}`);
    console.log(`   Type: ${entry.type}`);
    
    if (entry.type === 'signals_collected') {
      console.log(`   Signals Collected: ${entry.data.count}`);
      if (entry.data.signals && entry.data.signals.length > 0) {
        entry.data.signals.slice(0, 3).forEach(signal => {
          console.log(`     - ${signal.type} (${signal.severity}): ${signal.value}`);
        });
      }
    } else if (entry.type === 'actions_determined') {
      console.log(`   Actions Determined: ${entry.data.count}`);
    } else if (entry.type === 'ai_rationale_generated') {
      console.log(`   ✨ AI Output:`);
      console.log(`     Action: ${entry.data.actionType}`);
      console.log(`     Vault: ${entry.data.vault}`);
      console.log(`     Summary: ${entry.data.rationale.summary}`);
      console.log(`     Confidence: ${entry.data.rationale.confidence * 100}%`);
      if (entry.data.rationale.riskFactors) {
        console.log(`     Risk Factors: ${entry.data.rationale.riskFactors.join(', ')}`);
      }
      if (entry.data.rationale.recommendations) {
        console.log(`     Recommendations: ${entry.data.rationale.recommendations.join(', ')}`);
      }
    } else {
      console.log(`   Data: ${JSON.stringify(entry.data, null, 2)}`);
    }
  });
  
  console.log('\n' + '─'.repeat(50));
  console.log('Press Ctrl+C to exit');
  console.log('Full JSON: curl http://localhost:3002/activity');
}

async function startMonitoring() {
  try {
    console.log('🚀 Starting AI Activity Monitor...');
    console.log('Checking if agent is running...');
    
    const activity = await fetchActivity();
    displayActivity(activity);
    
    setInterval(async () => {
      try {
        const activity = await fetchActivity();
        displayActivity(activity);
      } catch (error) {
        console.error('Error fetching activity:', error.message);
      }
    }, POLL_INTERVAL);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ AI Agent is not running on port 3002');
      console.error('Start it with: npm run dev:agent');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

startMonitoring();

