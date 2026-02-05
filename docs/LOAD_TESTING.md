# Load Testing Guide

**Project:** Kushim Compliance Automation Platform  
**Version:** 1.0.0  
**Last Updated:** February 6, 2026

---

## Overview

This guide provides comprehensive load testing procedures for the Kushim platform using **k6** (primary) and **Artillery** (alternative). Load testing ensures the system can handle production traffic and helps identify performance bottlenecks before deployment.

---

## Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [Performance Targets](#performance-targets)
3. [Test Scenarios](#test-scenarios)
4. [Running Tests](#running-tests)
5. [Analyzing Results](#analyzing-results)
6. [Optimization Guide](#optimization-guide)

---

## Setup Instructions

### Install k6 (Recommended)

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Docker:**
```bash
docker pull grafana/k6:latest
```

### Install Artillery (Alternative)

```bash
npm install -g artillery@latest
```

### Environment Setup

Create `.env.load-test` in project root:
```bash
# Test environment
API_BASE_URL=http://localhost:3001/api
FRONTEND_URL=http://localhost:3000

# Test credentials
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=SecureTestPassword123!
TEST_CUSTOMER_ID=test-customer-id

# Performance targets
TARGET_P95_LATENCY=200
TARGET_ERROR_RATE=0.01
TARGET_CACHE_HIT_RATE=0.70
```

---

## Performance Targets

### Response Time Targets (p95)

| Endpoint Category | Target Latency | Critical Threshold |
|-------------------|----------------|-------------------|
| Health checks | <50ms | 100ms |
| Authentication | <300ms | 500ms |
| Simple queries (GET) | <100ms | 200ms |
| Complex queries | <300ms | 500ms |
| Data mutations (POST/PUT) | <200ms | 400ms |
| Evidence downloads | <500ms | 1000ms |
| Async operations | <2s (job queued) | 5s |

### Throughput Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Requests per second | 1000 RPS | Peak traffic |
| Concurrent users | 100 | Typical load |
| Concurrent users (peak) | 500 | Black Friday equivalent |
| Database connections | 10-20 | Connection pool |
| Queue processing rate | 100 jobs/min | Background tasks |

### Reliability Targets

| Metric | Target |
|--------|--------|
| Error rate | <1% |
| Timeout rate | <0.5% |
| Cache hit rate | >70% |
| System uptime | 99.9% |

---

## Test Scenarios

### Scenario 1: Baseline Load Test

**Objective:** Establish performance baseline with normal load  
**Duration:** 10 minutes  
**Virtual Users:** 50 concurrent  
**Expected RPS:** ~500

**k6 Script:** `scripts/load-tests/baseline.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const dashboardDuration = new Trend('dashboard_duration');

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% of requests under 200ms
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001/api';

export function setup() {
  // Login to get auth token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: __ENV.TEST_USER_EMAIL || 'testuser@example.com',
    password: __ENV.TEST_USER_PASSWORD || 'password123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  return { token: loginRes.json('token') };
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Health Check
  let res = http.get(`${BASE_URL}/health`, { headers });
  check(res, {
    'health check status 200': (r) => r.status === 200,
    'health check under 50ms': (r) => r.timings.duration < 50,
  });
  errorRate.add(res.status !== 200);

  sleep(1);

  // Test 2: Get Compliance Controls
  res = http.get(`${BASE_URL}/compliance/controls`, { headers });
  check(res, {
    'controls status 200': (r) => r.status === 200,
    'controls under 200ms': (r) => r.timings.duration < 200,
    'controls returns array': (r) => Array.isArray(r.json()),
  });
  errorRate.add(res.status !== 200);

  sleep(2);

  // Test 3: Get Dashboard Stats
  res = http.get(`${BASE_URL}/compliance/stats`, { headers });
  dashboardDuration.add(res.timings.duration);
  check(res, {
    'stats status 200': (r) => r.status === 200,
    'stats under 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(res.status !== 200);

  sleep(2);

  // Test 4: Get Integrations
  res = http.get(`${BASE_URL}/integrations`, { headers });
  check(res, {
    'integrations status 200': (r) => r.status === 200,
    'integrations under 150ms': (r) => r.timings.duration < 150,
  });
  errorRate.add(res.status !== 200);

  sleep(3);

  // Test 5: Get Evidence List
  res = http.get(`${BASE_URL}/evidence?limit=20`, { headers });
  check(res, {
    'evidence status 200': (r) => r.status === 200,
    'evidence under 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(res.status !== 200);

  sleep(2);
}

export function teardown(data) {
  // Cleanup if needed
}
```

### Scenario 2: Stress Test

**Objective:** Find breaking point and degradation thresholds  
**Duration:** 15 minutes  
**Virtual Users:** 0 → 500 (gradual increase)  
**Expected Breaking Point:** 300-500 users

**k6 Script:** `scripts/load-tests/stress.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp up to 50
    { duration: '3m', target: 100 },   // Ramp up to 100
    { duration: '3m', target: 200 },   // Ramp up to 200
    { duration: '3m', target: 300 },   // Ramp up to 300
    { duration: '2m', target: 500 },   // Push to 500
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // Allow higher latency
    http_req_failed: ['rate<0.05'],    // Allow 5% error rate under stress
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001/api';

export function setup() {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: __ENV.TEST_USER_EMAIL,
    password: __ENV.TEST_USER_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  return { token: loginRes.json('token') };
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
  };

  // Mixed workload
  const endpoints = [
    '/health',
    '/compliance/controls',
    '/compliance/stats',
    '/integrations',
    '/evidence?limit=10',
    '/users/profile',
  ];

  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${randomEndpoint}`, { headers });
  
  errorRate.add(res.status !== 200);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(Math.random() * 3 + 1); // Random sleep 1-4 seconds
}
```

### Scenario 3: Spike Test

**Objective:** Test system behavior during sudden traffic spikes  
**Duration:** 10 minutes  
**Virtual Users:** 10 → 300 (instant spike) → 10

**k6 Script:** `scripts/load-tests/spike.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Normal load
    { duration: '30s', target: 300 },  // SPIKE!
    { duration: '3m', target: 300 },   // Sustained spike
    { duration: '30s', target: 10 },   // Recover
    { duration: '2m', target: 10 },    // Normal load
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'], // Allow degradation during spike
    http_req_failed: ['rate<0.1'],     // Allow 10% errors during spike
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001/api';

export function setup() {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: __ENV.TEST_USER_EMAIL,
    password: __ENV.TEST_USER_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  return { token: loginRes.json('token') };
}

export default function(data) {
  const headers = { 'Authorization': `Bearer ${data.token}` };

  // Focus on dashboard (most common page)
  http.get(`${BASE_URL}/compliance/controls`, { headers });
  sleep(1);
  http.get(`${BASE_URL}/compliance/stats`, { headers });
  sleep(1);
}
```

### Scenario 4: Soak Test (Endurance)

**Objective:** Identify memory leaks and performance degradation over time  
**Duration:** 2 hours  
**Virtual Users:** 50 (constant)

**k6 Script:** `scripts/load-tests/soak.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 50 },     // Ramp up
    { duration: '110m', target: 50 },   // Sustained load
    { duration: '5m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001/api';

export function setup() {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: __ENV.TEST_USER_EMAIL,
    password: __ENV.TEST_USER_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  return { token: loginRes.json('token') };
}

export default function(data) {
  const headers = { 'Authorization': `Bearer ${data.token}` };

  // Realistic user journey
  http.get(`${BASE_URL}/compliance/controls`, { headers });
  sleep(3);
  http.get(`${BASE_URL}/evidence?limit=20`, { headers });
  sleep(5);
  http.get(`${BASE_URL}/integrations`, { headers });
  sleep(2);
  http.get(`${BASE_URL}/compliance/stats`, { headers });
  sleep(10);
}
```

### Scenario 5: Database Connection Pool Test

**Objective:** Test database connection pool under load  
**Duration:** 5 minutes  
**Virtual Users:** 100 (constant)  
**Focus:** Database-heavy queries

**k6 Script:** `scripts/load-tests/database.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001/api';

export function setup() {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: __ENV.TEST_USER_EMAIL,
    password: __ENV.TEST_USER_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  return { token: loginRes.json('token') };
}

export default function(data) {
  const headers = { 'Authorization': `Bearer ${data.token}` };

  // Heavy database queries
  http.get(`${BASE_URL}/compliance/controls?includeChecks=true`, { headers });
  sleep(1);
  http.get(`${BASE_URL}/evidence?limit=50&includeMetadata=true`, { headers });
  sleep(1);
  http.get(`${BASE_URL}/audit/logs?limit=100`, { headers });
  sleep(1);
}
```

### Scenario 6: Integration Endpoint Test

**Objective:** Test integration-specific endpoints  
**Duration:** 10 minutes  
**Virtual Users:** 20 (integrations are rate-limited)

**k6 Script:** `scripts/load-tests/integrations.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '6m', target: 20 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // Integrations can be slower
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001/api';

export function setup() {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: __ENV.TEST_USER_EMAIL,
    password: __ENV.TEST_USER_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  return { token: loginRes.json('token') };
}

export default function(data) {
  const headers = { 'Authorization': `Bearer ${data.token}` };

  // Test integration endpoints
  const integrations = ['aws', 'github', 'okta', 'jira'];
  const randomIntegration = integrations[Math.floor(Math.random() * integrations.length)];
  
  http.get(`${BASE_URL}/integrations/${randomIntegration}/status`, { headers });
  sleep(2);
  
  http.get(`${BASE_URL}/integrations/${randomIntegration}/health`, { headers });
  sleep(3);
}
```

---

## Running Tests

### Using k6

**Run baseline test:**
```bash
k6 run scripts/load-tests/baseline.js
```

**Run with environment variables:**
```bash
k6 run \
  -e API_BASE_URL=https://api.kushim.io/api \
  -e TEST_USER_EMAIL=load-test@kushim.io \
  -e TEST_USER_PASSWORD=SecurePassword123 \
  scripts/load-tests/baseline.js
```

**Run with custom thresholds:**
```bash
k6 run \
  --threshold http_req_duration=p(95)<150 \
  --threshold http_req_failed=rate<0.005 \
  scripts/load-tests/baseline.js
```

**Output results to file:**
```bash
k6 run --out json=results/baseline-$(date +%Y%m%d-%H%M%S).json \
  scripts/load-tests/baseline.js
```

**Run with Prometheus metrics:**
```bash
k6 run --out prometheus=localhost:9090 \
  scripts/load-tests/baseline.js
```

**Run in Docker:**
```bash
docker run --rm \
  -v $(pwd)/scripts/load-tests:/scripts \
  -e API_BASE_URL=http://host.docker.internal:3001/api \
  grafana/k6 run /scripts/baseline.js
```

### Using Artillery

**Create Artillery config:** `scripts/load-tests/artillery-baseline.yml`

```yaml
config:
  target: "http://localhost:3001/api"
  phases:
    - duration: 120
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 5
      name: "Cool down"
  processor: "./helpers/auth.js"
  
scenarios:
  - name: "Browse compliance dashboard"
    flow:
      - function: "authenticate"
      - get:
          url: "/compliance/controls"
          headers:
            Authorization: "Bearer {{ token }}"
      - think: 2
      - get:
          url: "/compliance/stats"
          headers:
            Authorization: "Bearer {{ token }}"
      - think: 3
      - get:
          url: "/evidence?limit=20"
          headers:
            Authorization: "Bearer {{ token }}"
      - think: 5
```

**Run Artillery test:**
```bash
artillery run scripts/load-tests/artillery-baseline.yml
```

**Generate HTML report:**
```bash
artillery run --output results/artillery-report.json \
  scripts/load-tests/artillery-baseline.yml

artillery report results/artillery-report.json
```

---

## Analyzing Results

### k6 Output Interpretation

**Sample Output:**
```
     ✓ health check status 200
     ✓ controls status 200
     ✓ controls under 200ms

     checks.........................: 99.87% ✓ 14981      ✗ 19
     data_received..................: 45 MB  150 kB/s
     data_sent......................: 5.2 MB 17 kB/s
     http_req_blocked...............: avg=1.2ms    min=1µs      med=3µs      max=125ms    p(90)=5µs     p(95)=8µs
     http_req_connecting............: avg=982µs    min=0s       med=0s       max=98ms     p(90)=0s      p(95)=0s
     http_req_duration..............: avg=89.5ms   min=12ms     med=78ms     max=450ms    p(90)=145ms   p(95)=178ms
       { expected_response:true }...: avg=89.3ms   min=12ms     med=78ms     max=420ms    p(90)=144ms   p(95)=177ms
     http_req_failed................: 0.12%  ✓ 19         ✗ 14981
     http_req_receiving.............: avg=245µs    min=18µs     med=187µs    max=12ms     p(90)=425µs   p(95)=612µs
     http_req_sending...............: avg=35µs     min=7µs      med=25µs     max=3.5ms    p(90)=65µs    p(95)=89µs
     http_req_tls_handshaking.......: avg=0s       min=0s       med=0s       max=0s       p(90)=0s      p(95)=0s
     http_req_waiting...............: avg=89.2ms   min=11ms     med=77ms     max=449ms    p(90)=144ms   p(95)=177ms
     http_reqs......................: 15000  50/s
     iteration_duration.............: avg=10.2s    min=10.1s    med=10.2s    max=10.5s    p(90)=10.3s   p(95)=10.4s
     iterations.....................: 1500   5/s
     vus............................: 50     min=10       max=50
     vus_max........................: 50     min=50       max=50
```

**Key Metrics:**
- **http_req_duration (p95):** Should be <200ms for most endpoints
- **http_req_failed:** Should be <1% (0.01 rate)
- **checks:** Should be >99%
- **http_reqs:** Total requests per second (RPS)
- **vus:** Virtual users active

### Performance Regression Detection

**Compare results over time:**
```bash
# Save baseline
k6 run scripts/load-tests/baseline.js > results/baseline-v1.0.0.txt

# After changes
k6 run scripts/load-tests/baseline.js > results/baseline-v1.0.1.txt

# Compare
diff results/baseline-v1.0.0.txt results/baseline-v1.0.1.txt
```

### Monitoring During Tests

**Monitor backend metrics:**
```bash
# In one terminal: Start backend with metrics
npm run backend:dev

# In another terminal: Watch Prometheus metrics
watch -n 1 'curl -s http://localhost:3001/api/metrics | grep http_request'

# Monitor database connections
watch -n 1 'docker exec kushim-postgres psql -U kushim -c "SELECT count(*) FROM pg_stat_activity;"'

# Monitor Redis
redis-cli --stat
```

**Monitor system resources:**
```bash
# CPU and Memory
htop

# Network
iftop

# Disk I/O
iotop
```

---

## Optimization Guide

### Common Performance Issues

#### 1. High Response Times

**Symptoms:**
- p95 latency >200ms
- Gradual increase over time

**Diagnosis:**
```bash
# Check slow queries
docker exec kushim-postgres psql -U kushim -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check cache hit rate
redis-cli INFO stats | grep keyspace
```

**Solutions:**
- Add database indexes
- Implement query result caching
- Optimize N+1 queries
- Use database connection pooling

#### 2. Database Connection Pool Exhaustion

**Symptoms:**
- Errors: "Connection pool exhausted"
- Increasing connection time

**Diagnosis:**
```bash
# Check active connections
docker exec kushim-postgres psql -U kushim -c "SELECT count(*) FROM pg_stat_activity;"

# Check pool stats in Prisma logs
```

**Solutions:**
```typescript
// Increase pool size in schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_size = 20  // Increase from 10
  pool_timeout = 30
}
```

#### 3. Memory Leaks

**Symptoms:**
- Gradual memory increase during soak test
- Out of memory errors after hours

**Diagnosis:**
```bash
# Monitor Node.js memory
node --inspect backend/dist/main.js
# Then use Chrome DevTools memory profiler

# Or use clinic.js
clinic doctor -- node backend/dist/main.js
```

**Solutions:**
- Fix event listener leaks
- Clear timers and intervals
- Implement proper stream cleanup
- Use WeakMap for caching

#### 4. High Error Rates

**Symptoms:**
- Error rate >1%
- Specific endpoints failing

**Diagnosis:**
```bash
# Check Sentry for error patterns
# Check application logs
docker logs kushim-backend --tail 100 | grep ERROR

# Check rate limit blocks
curl http://localhost:3001/api/metrics | grep rate_limit
```

**Solutions:**
- Increase rate limits for legitimate traffic
- Fix application bugs causing errors
- Add retry logic with exponential backoff
- Improve error handling

#### 5. Cache Inefficiency

**Symptoms:**
- Cache hit rate <70%
- High database load

**Diagnosis:**
```bash
# Check Redis stats
redis-cli INFO stats

# Check cache hit/miss ratio
curl http://localhost:3001/api/metrics | grep cache
```

**Solutions:**
- Increase cache TTL for stable data
- Pre-warm cache on deployment
- Implement cache-aside pattern
- Use Redis clustering for scale

### Database Optimization Checklist

- [ ] Add indexes on frequently queried columns
- [ ] Use EXPLAIN ANALYZE on slow queries
- [ ] Implement database query caching
- [ ] Configure appropriate connection pool size
- [ ] Use read replicas for heavy read workloads
- [ ] Optimize JOIN queries
- [ ] Implement pagination for large result sets
- [ ] Use database vacuum and analyze

### API Optimization Checklist

- [ ] Implement response compression (gzip)
- [ ] Use HTTP/2 for multiplexing
- [ ] Implement API response caching
- [ ] Optimize JSON serialization
- [ ] Reduce payload sizes
- [ ] Implement field selection (GraphQL-style)
- [ ] Use CDN for static assets
- [ ] Implement request batching

### Frontend Optimization Checklist

- [ ] Implement code splitting
- [ ] Use lazy loading for routes
- [ ] Optimize bundle sizes
- [ ] Implement service workers
- [ ] Use image optimization
- [ ] Minimize JavaScript execution time
- [ ] Implement virtual scrolling for lists
- [ ] Use React.memo for expensive components

---

## Continuous Performance Testing

### CI/CD Integration

**GitHub Actions Example:**

`.github/workflows/load-test.yml`
```yaml
name: Load Test

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Wait for services
        run: sleep 30
      
      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run baseline load test
        run: |
          k6 run \
            -e API_BASE_URL=http://localhost:3001/api \
            -e TEST_USER_EMAIL=${{ secrets.TEST_USER_EMAIL }} \
            -e TEST_USER_PASSWORD=${{ secrets.TEST_USER_PASSWORD }} \
            --out json=results.json \
            scripts/load-tests/baseline.js
      
      - name: Check thresholds
        run: |
          # Parse results and fail if thresholds not met
          k6 inspect --execution-requirements results.json
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
```

### Performance Regression Alerts

**Set up monitoring alerts:**
```yaml
# Prometheus alert rules
groups:
  - name: performance
    interval: 1m
    rules:
      - alert: HighAPILatency
        expr: http_request_duration_seconds{quantile="0.95"} > 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API latency too high"
          description: "p95 latency is {{ $value }}s"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

---

## Appendix

### A. Test Data Setup

**Create test users:**
```bash
cd apps/backend
npm run prisma:studio

# Or via script
node scripts/create-test-users.js
```

### B. Load Test Checklist

**Before running tests:**
- [ ] Backend services running
- [ ] Database seeded with test data
- [ ] Redis running
- [ ] Test user credentials configured
- [ ] Monitoring tools ready
- [ ] Baseline metrics captured

**During tests:**
- [ ] Monitor CPU usage
- [ ] Monitor memory usage
- [ ] Monitor database connections
- [ ] Monitor error logs
- [ ] Monitor cache hit rates

**After tests:**
- [ ] Analyze k6 results
- [ ] Compare to baseline
- [ ] Document performance issues
- [ ] Create optimization tickets
- [ ] Update performance targets if needed

### C. Tools Reference

**Performance Testing:**
- k6: https://k6.io/docs/
- Artillery: https://artillery.io/docs/
- JMeter: https://jmeter.apache.org/

**Monitoring:**
- Prometheus: https://prometheus.io/
- Grafana: https://grafana.com/
- Sentry: https://sentry.io/

**Profiling:**
- Chrome DevTools
- clinic.js: https://clinicjs.org/
- 0x: https://github.com/davidmarkclements/0x

---

## Next Steps

1. **Create test scripts directory:**
   ```bash
   mkdir -p scripts/load-tests
   ```

2. **Copy k6 scripts** from this guide into `scripts/load-tests/`

3. **Configure test environment** with `.env.load-test`

4. **Run baseline test** to establish performance baseline

5. **Set up CI/CD** integration for continuous performance testing

6. **Document results** and create optimization backlog

---

**Questions or Issues?**  
Contact: devops@kushim.io
