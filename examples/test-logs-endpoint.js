/**
 * Test script for the Logs API endpoint
 * 
 * Usage:
 *   1. Start your server: npm run dev
 *   2. Run this script: node examples/test-logs-endpoint.js
 */

const BASE_URL = 'http://localhost:3000/api/v1/public';

async function testLogsEndpoint() {
  console.log('🧪 Testing Logs API Endpoint\n');

  try {
    // Test 1: Get all logs (default)
    console.log('📋 Test 1: Get all logs (default 100)');
    const allLogs = await fetch(`${BASE_URL}/logs`);
    const allLogsData = await allLogs.json();
    console.log(`✅ Retrieved ${allLogsData.data.logs.length} logs`);
    console.log(`📊 Stats:`, allLogsData.data.stats);
    console.log('');

    // Test 2: Get only 10 logs
    console.log('📋 Test 2: Get last 10 logs');
    const limitedLogs = await fetch(`${BASE_URL}/logs?limit=10`);
    const limitedLogsData = await limitedLogs.json();
    console.log(`✅ Retrieved ${limitedLogsData.data.logs.length} logs`);
    console.log('');

    // Test 3: Get only error logs
    console.log('📋 Test 3: Get error logs only');
    const errorLogs = await fetch(`${BASE_URL}/logs?level=error`);
    const errorLogsData = await errorLogs.json();
    console.log(`✅ Retrieved ${errorLogsData.data.logs.length} error logs`);
    if (errorLogsData.data.logs.length > 0) {
      console.log('Sample error log:', errorLogsData.data.logs[0]);
    }
    console.log('');

    // Test 4: Get logs since a specific time
    console.log('📋 Test 4: Get logs since 1 minute ago');
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const recentLogs = await fetch(`${BASE_URL}/logs?since=${oneMinuteAgo}`);
    const recentLogsData = await recentLogs.json();
    console.log(`✅ Retrieved ${recentLogsData.data.logs.length} logs from the last minute`);
    console.log('');

    // Test 5: Combined filters
    console.log('📋 Test 5: Get last 5 info logs');
    const combinedLogs = await fetch(`${BASE_URL}/logs?limit=5&level=info`);
    const combinedLogsData = await combinedLogs.json();
    console.log(`✅ Retrieved ${combinedLogsData.data.logs.length} info logs`);
    if (combinedLogsData.data.logs.length > 0) {
      console.log('Sample log:', {
        level: combinedLogsData.data.logs[0].level,
        time: combinedLogsData.data.logs[0].time,
        msg: combinedLogsData.data.logs[0].msg,
        function: combinedLogsData.data.logs[0].function,
      });
    }
    console.log('');

    // Display stats
    console.log('📊 Final Buffer Stats:');
    console.log(`   Total logs in buffer: ${allLogsData.data.stats.totalLogs}/${allLogsData.data.stats.maxCapacity}`);
    console.log(`   Log levels:`, allLogsData.data.stats.levels);
    console.log(`   Oldest log: ${allLogsData.data.stats.oldestLog || 'N/A'}`);
    console.log(`   Newest log: ${allLogsData.data.stats.newestLog || 'N/A'}`);
    console.log('');

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error testing logs endpoint:', error.message);
    console.error('   Make sure the server is running on http://localhost:3000');
  }
}

// Run tests
testLogsEndpoint();

