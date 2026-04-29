#!/usr/bin/env node

/**
 * End-to-End Testing Suite
 * Tests all major features
 */

const BASE_URL = 'http://localhost:3002';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function test(name, fn) {
  try {
    log(`\n📝 Testing: ${name}`, 'blue');
    await fn();
    log(`✅ PASSED: ${name}`, 'green');
    return true;
  } catch (error) {
    log(`❌ FAILED: ${name}`, 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function request(method, path, data = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Owner-Id': 'demo-user',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(`Status ${response.status}: ${JSON.stringify(json)}`);
  }

  return json;
}

async function runTests() {
  log('\n🧪 END-TO-END TEST SUITE', 'blue');
  log('='.repeat(60), 'blue');

  let passed = 0;
  let failed = 0;

  // Test 1: Homepage loads
  if (
    await test('Homepage loads (GET /)', async () => {
      const response = await fetch(`${BASE_URL}/`);
      if (response.status !== 200) throw new Error(`Status ${response.status}`);
      const html = await response.text();
      if (!html.includes('Dynamic')) throw new Error('Missing expected content');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: Config API
  if (
    await test('Config API (GET /api/config)', async () => {
      const data = await request('GET', '/api/config');
      if (!data.config) throw new Error('No config in response');
      if (!data.config.title) throw new Error('Missing config title');
      if (!Array.isArray(data.config.forms)) throw new Error('Forms not array');
      if (!Array.isArray(data.config.tables)) throw new Error('Tables not array');
      if (!Array.isArray(data.config.metrics)) throw new Error('Metrics not array');
      log('   ✓ Config structure valid', 'green');
      log(`   ✓ Found ${data.config.forms.length} forms`, 'green');
      log(`   ✓ Found ${data.config.tables.length} tables`, 'green');
      log(`   ✓ Found ${data.config.metrics.length} metrics`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: Signup
  if (
    await test('Auth: Signup (POST /api/auth/signup)', async () => {
      const data = await request('POST', '/api/auth/signup', {
        email: `test-${Date.now()}@example.com`,
        password: 'Test1234!',
      });
      if (!data.user) throw new Error('No user in response');
      log(`   ✓ User created: ${data.user.email}`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: Login
  if (
    await test('Auth: Login (POST /api/auth/login)', async () => {
      const data = await request('POST', '/api/auth/login', {
        email: 'demo@company.com',
        password: 'demo1234',
      });
      if (!data.token) throw new Error('No token in response');
      if (!data.user) throw new Error('No user in response');
      log(`   ✓ Token generated for ${data.user.email}`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 5: Request OTP
  if (
    await test('Auth: Request OTP (POST /api/auth/request-otp)', async () => {
      const data = await request('POST', '/api/auth/request-otp', {
        email: 'demo@company.com',
      });
      if (!data.otp) throw new Error('No OTP in response');
      log(`   ✓ OTP sent: ${data.otp}`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 6: Verify OTP
  if (
    await test('Auth: Login with OTP (POST /api/auth/login-otp)', async () => {
      const data = await request('POST', '/api/auth/login-otp', {
        email: 'demo@company.com',
        otp: '123456',
      });
      if (!data.token) throw new Error('No token in response');
      log(`   ✓ OTP login successful`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 7: Get Runs
  if (
    await test('Runs: List runs (GET /api/runs)', async () => {
      const data = await request('GET', '/api/runs');
      if (!Array.isArray(data.runs)) throw new Error('Runs not array');
      log(`   ✓ Found ${data.runs.length} runs`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 8: Create Run
  let runId = null;
  if (
    await test('Runs: Create run (POST /api/runs)', async () => {
      const data = await request('POST', '/api/runs', {
        title: `Test Run ${Date.now()}`,
        slug: `test-run-${Date.now()}`,
        config: {
          slug: 'test',
          title: 'Test Config',
          forms: [],
          tables: [],
          metrics: [],
          sections: [],
        },
      });
      if (!data.run) throw new Error('No run in response');
      if (!data.run.id) throw new Error('No run ID');
      runId = data.run.id;
      log(`   ✓ Run created: ${runId}`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 9: Get Single Run
  if (runId) {
    if (
      await test('Runs: Get run (GET /api/runs/:id)', async () => {
        const data = await request('GET', `/api/runs/${runId}`);
        if (!data.run) throw new Error('No run in response');
        if (data.run.id !== runId) throw new Error('ID mismatch');
        log(`   ✓ Retrieved run: ${data.run.title}`, 'green');
      })
    ) {
      passed++;
    } else {
      failed++;
    }
  } else {
    log('⏭️  Skipped: Get run (no run created)', 'yellow');
  }

  // Test 10: Update Run
  if (runId) {
    if (
      await test('Runs: Update run (PUT /api/runs/:id)', async () => {
        const data = await request('PUT', `/api/runs/${runId}`, {
          title: `Updated Run ${Date.now()}`,
        });
        if (!data.run) throw new Error('No run in response');
        log(`   ✓ Run updated: ${data.run.title}`, 'green');
      })
    ) {
      passed++;
    } else {
      failed++;
    }
  } else {
    log('⏭️  Skipped: Update run (no run created)', 'yellow');
  }

  // Test 11: Delete Run
  if (runId) {
    if (
      await test('Runs: Delete run (DELETE /api/runs/:id)', async () => {
        const data = await request('DELETE', `/api/runs/${runId}`);
        if (!data.message) throw new Error('No message in response');
        log(`   ✓ Run deleted successfully`, 'green');
      })
    ) {
      passed++;
    } else {
      failed++;
    }
  } else {
    log('⏭️  Skipped: Delete run (no run created)', 'yellow');
  }

  // Test 12: Notifications
  if (
    await test('Notifications: Get events (GET /api/notifications)', async () => {
      const data = await request('GET', '/api/notifications');
      if (!Array.isArray(data.events)) throw new Error('Events not array');
      log(`   ✓ Found ${data.events.length} events`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 13: Post Notification
  if (
    await test('Notifications: Post event (POST /api/notifications)', async () => {
      const data = await request('POST', '/api/notifications', {
        type: 'test',
        message: 'Test notification',
      });
      if (!data.event) throw new Error('No event in response');
      log(`   ✓ Event created: ${data.event.type}`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 14: Email Send
  if (
    await test('Email: Send email (POST /api/email/send)', async () => {
      const data = await request('POST', '/api/email/send', {
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'Test body',
      });
      if (!data.success) throw new Error('Email send failed');
      log(`   ✓ Email sent to ${data.recipient}`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 15: Database Blueprint
  if (
    await test('Database: Get blueprint (GET /api/database/blueprint)', async () => {
      const data = await request('GET', '/api/database/blueprint');
      if (!data.blueprint) throw new Error('No blueprint in response');
      if (!data.blueprint.provider) throw new Error('No provider');
      log(`   ✓ Blueprint provider: ${data.blueprint.provider}`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 16: GitHub Export
  if (
    await test('GitHub: Export endpoint (GET /api/integrations/github/export)', async () => {
      const response = await fetch(`${BASE_URL}/api/integrations/github/export`);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      log(`   ✓ GitHub export endpoint accessible`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 17: CSV Import
  if (
    await test('CSV: Import endpoint (POST /api/import/csv)', async () => {
      const data = await request('POST', '/api/import/csv', {
        resource: 'applications',
        csv: 'name,status,owner,updatedAt\nNew App,Live,Engineering,now\nBeta App,Preview,Product,today'
      });
      if (!data.imported) throw new Error('No imported count in response');
      log(`   ✓ CSV imported: ${data.imported} rows`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 18: Runtime Resource
  if (
    await test('Runtime: Get resource (GET /api/runtime/applications)', async () => {
      const data = await request('GET', '/api/runtime/applications');
      if (!data.resource) throw new Error('No resource in response');
      log(`   ✓ Resource endpoint working`, 'green');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log(`\n📊 TEST RESULTS:`, 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`, 'blue');

  if (failed === 0) {
    log('🎉 ALL TESTS PASSED! Ready for deployment!', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some tests failed. Review errors above.', 'yellow');
    process.exit(1);
  }
}

// Check if server is running
fetch(`${BASE_URL}/api/config`)
  .then(() => runTests())
  .catch(() => {
    log('❌ Server not running on ' + BASE_URL, 'red');
    log('   Start with: npm run dev', 'yellow');
    process.exit(1);
  });
