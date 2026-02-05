/**
 * AI Features Load Test
 * 
 * Tests performance and cost under realistic load:
 * - Evidence mapping (batch and individual)
 * - Policy generation
 * - Copilot chat
 * 
 * Usage:
 *   node scripts/ai-load-test.js
 * 
 * Or with k6:
 *   k6 run scripts/ai-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const aiResponseTime = new Trend('ai_response_time');
const aiCost = new Trend('ai_cost_per_request');
const totalRequests = new Counter('total_requests');

// Load test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 50 },  // Increase to 50 users
    { duration: '5m', target: 100 }, // Peak at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    errors: ['rate<0.1'],              // Error rate < 10%
    ai_response_time: ['p95<30000'],   // 95th percentile < 30s
    http_req_duration: ['p99<60000'],  // 99th percentile < 60s
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const API_KEY = __ENV.API_KEY || 'test-api-key';

// Test data
const evidenceIds = [
  'test-evidence-1',
  'test-evidence-2',
  'test-evidence-3',
  'test-evidence-4',
  'test-evidence-5',
];

const copilotQuestions = [
  'What is our compliance status?',
  'Show me evidence for access control',
  'What controls are we missing?',
  'List all policies',
  'What is CC6.1?',
];

const policyTypes = [
  'ACCESS_CONTROL',
  'DATA_PROTECTION',
  'INCIDENT_RESPONSE',
  'CHANGE_MANAGEMENT',
];

function makeAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  };
}

/**
 * Test evidence mapping performance
 */
export function testEvidenceMapping() {
  const evidenceId = evidenceIds[Math.floor(Math.random() * evidenceIds.length)];
  
  const start = Date.now();
  const response = http.post(
    `${BASE_URL}/api/ai/evidence-mapping`,
    JSON.stringify({ evidenceId }),
    { headers: makeAuthHeaders() }
  );
  const duration = Date.now() - start;

  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'has mapping result': (r) => JSON.parse(r.body).controlId !== undefined,
  });

  errorRate.add(!success);
  aiResponseTime.add(duration);
  totalRequests.add(1);

  if (success) {
    const body = JSON.parse(response.body);
    if (body.cost) {
      aiCost.add(body.cost);
    }
  }

  sleep(1);
}

/**
 * Test batch evidence mapping
 */
export function testBatchMapping() {
  const start = Date.now();
  const response = http.post(
    `${BASE_URL}/api/ai/orchestrator/batch/map-evidence`,
    JSON.stringify({
      evidenceIds: evidenceIds.slice(0, 3),
      concurrency: 3,
    }),
    { headers: makeAuthHeaders(), timeout: '120s' }
  );
  const duration = Date.now() - start;

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has batch results': (r) => JSON.parse(r.body).successful !== undefined,
  });

  errorRate.add(!success);
  aiResponseTime.add(duration);
  totalRequests.add(1);

  if (success) {
    const body = JSON.parse(response.body);
    if (body.totalCost) {
      aiCost.add(body.totalCost / body.successful);
    }
  }

  sleep(2);
}

/**
 * Test policy generation performance
 */
export function testPolicyGeneration() {
  const policyType = policyTypes[Math.floor(Math.random() * policyTypes.length)];
  
  const start = Date.now();
  const response = http.post(
    `${BASE_URL}/api/ai/policy-drafting`,
    JSON.stringify({
      policyType,
      controlIds: ['CC6.1', 'CC6.2'],
    }),
    { headers: makeAuthHeaders(), timeout: '120s' }
  );
  const duration = Date.now() - start;

  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'has policy content': (r) => {
      const body = JSON.parse(r.body);
      return body.content && body.content.length > 500;
    },
  });

  errorRate.add(!success);
  aiResponseTime.add(duration);
  totalRequests.add(1);

  if (success) {
    const body = JSON.parse(response.body);
    if (body.cost) {
      aiCost.add(body.cost);
    }
  }

  sleep(3);
}

/**
 * Test Copilot chat performance
 */
export function testCopilotChat() {
  const question = copilotQuestions[Math.floor(Math.random() * copilotQuestions.length)];
  
  const start = Date.now();
  const response = http.post(
    `${BASE_URL}/api/ai/copilot/chat`,
    JSON.stringify({ message: question }),
    { headers: makeAuthHeaders() }
  );
  const duration = Date.now() - start;

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has message': (r) => JSON.parse(r.body).message !== undefined,
  });

  errorRate.add(!success);
  aiResponseTime.add(duration);
  totalRequests.add(1);

  if (success) {
    const body = JSON.parse(response.body);
    if (body.cost) {
      aiCost.add(body.cost);
    }
  }

  sleep(1);
}

/**
 * Main test scenario - mixed workload
 */
export default function() {
  const scenario = Math.random();

  if (scenario < 0.5) {
    // 50% - Copilot chat (most common)
    testCopilotChat();
  } else if (scenario < 0.8) {
    // 30% - Evidence mapping
    testEvidenceMapping();
  } else if (scenario < 0.95) {
    // 15% - Policy generation
    testPolicyGeneration();
  } else {
    // 5% - Batch mapping
    testBatchMapping();
  }
}

/**
 * Setup - runs once at start
 */
export function setup() {
  console.log('Starting AI load test...');
  console.log(`Target: ${BASE_URL}`);
  
  // Warmup
  http.get(`${BASE_URL}/health`);
}

/**
 * Teardown - runs once at end
 */
export function teardown(data) {
  console.log('Load test completed');
}
