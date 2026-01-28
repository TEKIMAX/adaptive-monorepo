# Chef Platform - Metering & Usage Tracking Architecture

## Executive Summary

This document outlines the complete infrastructure cost breakdown, metering architecture, and usage tracking system for the Chef multi-tenant platform. The system tracks resource usage across all PaaS providers (Neon, Fly.io, Cloudflare R2/Pages) and provides real-time analytics for future billing integration with Stripe.

---

## Table of Contents

1. [Infrastructure Stack Per Tenant](#infrastructure-stack-per-tenant)
2. [Cost Analysis & Breakdown](#cost-analysis--breakdown)
3. [Metering Architecture](#metering-architecture)
4. [Cloudflare Analytics Engine Integration](#cloudflare-analytics-engine-integration)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Implementation Roadmap](#implementation-roadmap)

---

## Infrastructure Stack Per Tenant

### Complete Resource Allocation

When a user provisions an environment (e.g., "demo"), the following resources are created:

| # | Service | Provider | Resource | Purpose | Lifecycle |
|---|---------|----------|----------|---------|-----------|
| 1 | **PostgreSQL** | Neon | Serverless Database | Convex data storage | Created first (dependency) |
| 2 | **Backend** | Fly.io | Container Machine | Real-time API + WebSocket | Requires database URL |
| 3 | **Storage** | Cloudflare R2 | S3 Bucket | File uploads, assets | Independent |
| 4 | **Frontend** | Cloudflare Pages | Static Site | React/Remix UI | Requires backend URL |
| 5 | **DNS** | Cloudflare DNS | CNAME Record | Custom domain | Final step |

### Sequential Dependency Chain

```
1. Neon Database
   └─> Provides: DATABASE_URL
       │
2. Fly.io Convex Backend
   └─> Uses: DATABASE_URL
   └─> Provides: CONVEX_URL
       │
3. Cloudflare R2 Bucket
   └─> Independent (parallel with 2)
   └─> Provides: R2_CREDENTIALS
       │
4. Cloudflare Pages
   └─> Uses: CONVEX_URL, R2_CREDENTIALS
   └─> Provides: PAGES_URL
       │
5. DNS Configuration
   └─> Uses: PAGES_URL
   └─> Provides: CUSTOM_DOMAIN
```

---

## Cost Analysis & Breakdown

### Per-Environment Monthly Costs

#### 1. Neon Postgres Database

| Metric | Free Tier | Paid Tier | Typical Usage | Monthly Cost |
|--------|-----------|-----------|---------------|--------------|
| Storage | 0.5 GB | $0.102/GB | 0.2 GB | $0.00 (within free) |
| Compute | 191 hours | $0.16/hour | 150 hours | $0.00 (within free) |
| Data Transfer | 5 GB egress | $0.09/GB | 1 GB | $0.00 (within free) |
| **Subtotal** | | | | **$0.00** |

**When paid tier is needed (>0.5GB or >191hrs):**
- Storage: 2GB × $0.102 = $0.20
- Compute: 300hrs × $0.16 = $48.00
- **Estimated: $48.20/month** (high-usage scenario)

#### 2. Fly.io Convex Backend

| Component | Spec | Price | Usage | Monthly Cost |
|-----------|------|-------|-------|--------------|
| Machine | shared-cpu-1x (256MB) | $0.02/GB-month | 0.25 GB always-on | $0.005 |
| CPU Time | 1 shared vCPU | $0.0000023/sec | ~2.6M seconds/month | $6.00 |
| Data Transfer | Ingress free | $0.02/GB egress | 10 GB | $0.20 |
| **Subtotal** | | | | **$6.20** |

**Cost breakdown:**
- Base machine (always-on): $1.52/month (730 hrs × $0.02/GB × 0.25GB)
- CPU usage: ~$6/month (varies by load)
- Network egress: $0.20/month (10GB typical)

#### 3. Cloudflare R2 Storage

| Metric | Free Tier | Paid Rate | Typical Usage | Monthly Cost |
|--------|-----------|-----------|---------------|--------------|
| Storage | 10 GB | $0.015/GB | 2 GB | $0.00 (within free) |
| Class A Operations | 1M/month | $4.50/million | 50K | $0.00 (within free) |
| Class B Operations | 10M/month | $0.36/million | 500K | $0.00 (within free) |
| **Subtotal** | | | | **$0.00** |

**Class A:** PUT, POST, LIST, CREATE
**Class B:** GET, HEAD, OPTIONS

#### 4. Cloudflare Pages

| Metric | Free Tier | Paid Rate | Typical Usage | Monthly Cost |
|--------|-----------|-----------|---------------|--------------|
| Requests | Unlimited | Free | 1M requests | $0.00 |
| Bandwidth | Unlimited | Free | 50 GB | $0.00 |
| Builds | 500/month | $0.10/build | 100 builds | $0.00 (within free) |
| Build Minutes | 500/month | $0.01/minute | 300 minutes | $0.00 (within free) |
| **Subtotal** | | | | **$0.00** |

#### 5. Cloudflare DNS

| Service | Cost |
|---------|------|
| DNS Hosting | Free |
| CNAME Records | Free |
| SSL Certificate | Free (Let's Encrypt) |
| **Subtotal** | **$0.00** |

### Total Cost Per Environment

| Scenario | Neon | Fly.io | R2 | Pages | DNS | **Total/Month** |
|----------|------|--------|----|----|-----|-----------------|
| **Free Tier (Low Usage)** | $0.00 | $6.20 | $0.00 | $0.00 | $0.00 | **$6.20** |
| **Moderate Usage** | $0.00 | $8.50 | $0.15 | $0.00 | $0.00 | **$8.65** |
| **High Usage** | $48.20 | $15.00 | $1.50 | $5.00 | $0.00 | **$69.70** |
| **Enterprise** | $120.00 | $30.00 | $10.00 | $20.00 | $0.00 | **$180.00** |

### Multi-Environment Cost Scaling

| # Environments | Cost/Month (Avg) | Annual Cost |
|----------------|------------------|-------------|
| 1 | $6.20 | $74.40 |
| 5 | $31.00 | $372.00 |
| 10 | $62.00 | $744.00 |
| 50 | $310.00 | $3,720.00 |
| 100 | $620.00 | $7,440.00 |

---

## Metering Architecture

### Overview

The metering system tracks resource usage across all providers and aggregates data for billing, analytics, and cost optimization.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Data Collection Layer                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   Neon   │  │  Fly.io  │  │    R2    │  │  Pages  │ │
│  │   API    │  │   API    │  │Analytics │  │Analytics│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │             │              │             │       │
└───────┼─────────────┼──────────────┼─────────────┼───────┘
        │             │              │             │
        └─────────────┴──────────────┴─────────────┘
                            │
        ┌───────────────────▼──────────────────────┐
        │     Metering Collector Service           │
        │     (Rust - Axum + Tokio Cron)          │
        ├──────────────────────────────────────────┤
        │  - Polls provider APIs every 5 minutes   │
        │  - Aggregates usage data                 │
        │  - Writes to Analytics Engine            │
        │  - Calculates costs in real-time         │
        └──────────────┬───────────────────────────┘
                       │
        ┌──────────────▼───────────────────────────┐
        │   Cloudflare Analytics Engine            │
        │   (Time-Series Database)                 │
        ├──────────────────────────────────────────┤
        │  - Unlimited cardinality                 │
        │  - SQL queries                           │
        │  - Real-time aggregation                 │
        │  - Retention: 90 days                    │
        └──────────────┬───────────────────────────┘
                       │
        ┌──────────────▼───────────────────────────┐
        │      PostgreSQL (Control Plane DB)       │
        │      (Hourly/Daily Aggregates)           │
        ├──────────────────────────────────────────┤
        │  - usage_metrics table                   │
        │  - tenant_usage_summary table            │
        │  - billing_periods table                 │
        └──────────────┬───────────────────────────┘
                       │
        ┌──────────────▼───────────────────────────┐
        │         Usage API Endpoints              │
        │         (Control Plane - Axum)           │
        ├──────────────────────────────────────────┤
        │  GET /api/usage/:tenant_id/current       │
        │  GET /api/usage/:tenant_id/history       │
        │  GET /api/usage/:tenant_id/cost          │
        │  GET /api/usage/dashboard                │
        └──────────────┬───────────────────────────┘
                       │
        ┌──────────────▼───────────────────────────┐
        │         Frontend Dashboard               │
        │         (React + Charts.js)              │
        ├──────────────────────────────────────────┤
        │  - Real-time usage graphs                │
        │  - Cost breakdown charts                 │
        │  - Usage alerts                          │
        │  - Export to CSV                         │
        └──────────────────────────────────────────┘
```

### Components

#### 1. Metering Collector Service (New Rust Service)

**Purpose:** Collect usage data from all providers and write to Analytics Engine

**Technology Stack:**
- Rust (Axum framework)
- Tokio Cron Scheduler
- Reqwest (HTTP client)
- CloudFlare Analytics Engine SDK

**Deployment:**
- Fly.io (single machine)
- Cron: Every 5 minutes
- Cost: ~$3/month

**Key Functions:**
```rust
// Pseudocode
async fn collect_neon_usage(tenant_id: Uuid) -> NeonMetrics {
    // Call Neon API: GET /projects/{id}/consumption
    // Returns: storage_bytes, compute_hours, egress_bytes
}

async fn collect_flyio_usage(app_name: &str) -> FlyioMetrics {
    // Call Fly API: GET /apps/{name}/machines/{id}/metrics
    // Returns: cpu_seconds, memory_mb_hours, egress_bytes
}

async fn collect_r2_usage(bucket_name: &str) -> R2Metrics {
    // Call CF Analytics API
    // Returns: storage_bytes, class_a_ops, class_b_ops
}

async fn collect_pages_usage(project_name: &str) -> PagesMetrics {
    // Call CF Analytics API
    // Returns: requests, bandwidth_bytes, build_minutes
}

async fn write_to_analytics_engine(metrics: UsageMetrics) {
    // Write to CF Analytics Engine
}
```

#### 2. Cloudflare Analytics Engine

**Setup:**
```sql
-- Create Analytics Engine dataset
CREATE TABLE usage_events (
  timestamp TIMESTAMP,
  tenant_id STRING,
  environment_slug STRING,
  provider STRING,  -- 'neon', 'flyio', 'r2', 'pages'
  metric_type STRING,  -- 'storage_bytes', 'compute_hours', etc.
  value DOUBLE,
  cost_usd DOUBLE,
  INDEX idx1 BY tenant_id, timestamp
);
```

**Write Events (from Collector):**
```javascript
// Example: Writing from Worker/Collector
await env.USAGE_ANALYTICS.writeDataPoint({
  indexes: [tenantId],
  blobs: [environmentSlug, provider, metricType],
  doubles: [value, costUsd],
});
```

**Query Examples:**
```sql
-- Total cost per tenant (last 30 days)
SELECT
  tenant_id,
  SUM(cost_usd) as total_cost
FROM usage_events
WHERE timestamp >= NOW() - INTERVAL '30' DAY
GROUP BY tenant_id;

-- Usage breakdown by provider
SELECT
  provider,
  metric_type,
  SUM(value) as total_value,
  SUM(cost_usd) as total_cost
FROM usage_events
WHERE tenant_id = ?
  AND timestamp >= NOW() - INTERVAL '7' DAY
GROUP BY provider, metric_type;

-- Hourly usage trend
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  AVG(value) as avg_value
FROM usage_events
WHERE tenant_id = ?
  AND metric_type = 'compute_hours'
  AND timestamp >= NOW() - INTERVAL '24' HOUR
GROUP BY hour
ORDER BY hour;
```

---

## Database Schema

### PostgreSQL Schema (Control Plane)

```sql
-- Usage metrics aggregated hourly
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenant_environments(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,  -- 'neon', 'flyio', 'r2', 'pages'
  metric_type VARCHAR(100) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  cost_usd DECIMAL(10, 4) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_tenant_period (tenant_id, period_start),
  INDEX idx_provider_type (provider, metric_type)
);

-- Daily usage summary
CREATE TABLE tenant_usage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenant_environments(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Neon metrics
  neon_storage_gb DOUBLE PRECISION DEFAULT 0,
  neon_compute_hours DOUBLE PRECISION DEFAULT 0,
  neon_egress_gb DOUBLE PRECISION DEFAULT 0,
  neon_cost_usd DECIMAL(10, 4) DEFAULT 0,

  -- Fly.io metrics
  flyio_cpu_hours DOUBLE PRECISION DEFAULT 0,
  flyio_memory_gb_hours DOUBLE PRECISION DEFAULT 0,
  flyio_egress_gb DOUBLE PRECISION DEFAULT 0,
  flyio_cost_usd DECIMAL(10, 4) DEFAULT 0,

  -- R2 metrics
  r2_storage_gb DOUBLE PRECISION DEFAULT 0,
  r2_class_a_ops BIGINT DEFAULT 0,
  r2_class_b_ops BIGINT DEFAULT 0,
  r2_cost_usd DECIMAL(10, 4) DEFAULT 0,

  -- Pages metrics
  pages_requests BIGINT DEFAULT 0,
  pages_bandwidth_gb DOUBLE PRECISION DEFAULT 0,
  pages_build_minutes INTEGER DEFAULT 0,
  pages_cost_usd DECIMAL(10, 4) DEFAULT 0,

  -- Totals
  total_cost_usd DECIMAL(10, 4) DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (tenant_id, date),
  INDEX idx_tenant_date (tenant_id, date DESC)
);

-- Billing periods for invoicing
CREATE TABLE billing_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenant_environments(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_cost_usd DECIMAL(10, 4) NOT NULL,
  stripe_invoice_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'invoiced', 'paid', 'failed'
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_tenant_period (tenant_id, period_start, period_end)
);

-- Usage alerts/thresholds
CREATE TABLE usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenant_environments(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,  -- 'cost_threshold', 'quota_exceeded'
  threshold_value DECIMAL(10, 4) NOT NULL,
  current_value DECIMAL(10, 4) NOT NULL,
  triggered_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  notified BOOLEAN DEFAULT FALSE,

  INDEX idx_tenant_triggered (tenant_id, triggered_at DESC)
);
```

---

## API Endpoints

### Usage Tracking Endpoints

#### 1. Get Current Usage (Real-Time)

```http
GET /api/usage/:tenant_id/current
Authorization: Bearer <token>
```

**Response:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_slug": "demo",
  "period": {
    "start": "2024-01-24T00:00:00Z",
    "end": "2024-01-24T23:59:59Z",
    "type": "current_month"
  },
  "providers": {
    "neon": {
      "storage_gb": 0.25,
      "compute_hours": 120.5,
      "egress_gb": 1.2,
      "cost_usd": 0.00
    },
    "flyio": {
      "cpu_hours": 720.0,
      "memory_gb_hours": 180.0,
      "egress_gb": 8.5,
      "cost_usd": 6.17
    },
    "r2": {
      "storage_gb": 2.1,
      "class_a_operations": 45000,
      "class_b_operations": 320000,
      "cost_usd": 0.00
    },
    "pages": {
      "requests": 850000,
      "bandwidth_gb": 45.2,
      "build_minutes": 85,
      "cost_usd": 0.00
    }
  },
  "summary": {
    "total_cost_usd": 6.17,
    "estimated_monthly_cost_usd": 6.20,
    "free_tier_savings_usd": 0.32
  }
}
```

#### 2. Get Usage History

```http
GET /api/usage/:tenant_id/history?period=30d&granularity=daily
Authorization: Bearer <token>
```

**Query Parameters:**
- `period`: `7d`, `30d`, `90d`, `1y`
- `granularity`: `hourly`, `daily`, `weekly`, `monthly`

**Response:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z",
    "granularity": "daily"
  },
  "data": [
    {
      "date": "2024-01-24",
      "neon_cost_usd": 0.00,
      "flyio_cost_usd": 6.15,
      "r2_cost_usd": 0.00,
      "pages_cost_usd": 0.00,
      "total_cost_usd": 6.15
    },
    {
      "date": "2024-01-23",
      "neon_cost_usd": 0.00,
      "flyio_cost_usd": 6.20,
      "r2_cost_usd": 0.00,
      "pages_cost_usd": 0.00,
      "total_cost_usd": 6.20
    }
    // ... more days
  ],
  "summary": {
    "total_cost_usd": 186.45,
    "avg_daily_cost_usd": 6.21,
    "max_daily_cost_usd": 8.50,
    "min_daily_cost_usd": 6.15
  }
}
```

#### 3. Get Cost Breakdown

```http
GET /api/usage/:tenant_id/cost?breakdown=provider
Authorization: Bearer <token>
```

**Response:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "period": "current_month",
  "breakdown": [
    {
      "provider": "flyio",
      "percentage": 100.0,
      "cost_usd": 6.17,
      "metrics": [
        {
          "type": "cpu_hours",
          "value": 720.0,
          "cost_usd": 5.00
        },
        {
          "type": "memory_gb_hours",
          "value": 180.0,
          "cost_usd": 1.00
        },
        {
          "type": "egress_gb",
          "value": 8.5,
          "cost_usd": 0.17
        }
      ]
    },
    {
      "provider": "neon",
      "percentage": 0.0,
      "cost_usd": 0.00,
      "metrics": [...]
    },
    {
      "provider": "r2",
      "percentage": 0.0,
      "cost_usd": 0.00,
      "metrics": [...]
    },
    {
      "provider": "pages",
      "percentage": 0.0,
      "cost_usd": 0.00,
      "metrics": [...]
    }
  ],
  "total_cost_usd": 6.17
}
```

#### 4. Get Dashboard Summary (All Tenants)

```http
GET /api/usage/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user_id": "user_01KDPNAW79DMPW1S5ZSVSYG8X8",
  "team_id": "b271d7fc-b32b-4d3d-b966-a575719ece09",
  "period": "current_month",
  "summary": {
    "total_environments": 3,
    "active_environments": 2,
    "total_cost_usd": 18.51,
    "estimated_monthly_cost_usd": 18.60
  },
  "environments": [
    {
      "tenant_id": "550e8400-...",
      "slug": "production",
      "status": "ready",
      "cost_usd": 12.34,
      "primary_cost_driver": "flyio"
    },
    {
      "tenant_id": "660e9511-...",
      "slug": "staging",
      "status": "ready",
      "cost_usd": 6.17,
      "primary_cost_driver": "flyio"
    },
    {
      "tenant_id": "770ea622-...",
      "slug": "demo",
      "status": "failed",
      "cost_usd": 0.00,
      "primary_cost_driver": null
    }
  ],
  "cost_trend": {
    "last_7_days": [6.2, 6.3, 6.1, 6.4, 6.2, 6.3, 6.2],
    "projected_month_end": 18.60
  }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goals:**
- Set up Analytics Engine dataset
- Create database schema
- Implement basic data collection

**Tasks:**
1. ✅ Create Analytics Engine dataset in Cloudflare
2. ✅ Add database migrations for usage tables
3. ✅ Implement Neon API client for usage data
4. ✅ Implement Fly.io API client for metrics
5. ✅ Test data collection manually

**Deliverables:**
- Working Analytics Engine dataset
- Database tables created
- Manual data collection scripts

### Phase 2: Metering Collector Service (Week 3-4)

**Goals:**
- Build Rust service for automated collection
- Schedule cron jobs
- Write to Analytics Engine

**Tasks:**
1. Create new Rust project: `metering-collector`
2. Implement provider API clients:
   - Neon API client
   - Fly.io API client
   - Cloudflare R2 Analytics
   - Cloudflare Pages Analytics
3. Implement cron scheduler (tokio-cron)
4. Write to Analytics Engine
5. Deploy to Fly.io
6. Monitor and debug

**Deliverables:**
- Deployed metering-collector service
- Automated data collection every 5 minutes
- Data flowing to Analytics Engine

### Phase 3: API Endpoints (Week 5)

**Goals:**
- Build usage API in control plane
- Aggregate data from Analytics Engine
- Cache in PostgreSQL

**Tasks:**
1. Add API routes to control plane
2. Implement SQL queries for Analytics Engine
3. Implement aggregation logic
4. Add caching layer
5. Write integration tests
6. Document API

**Deliverables:**
- 4 API endpoints live
- Documentation
- Postman collection

### Phase 4: Frontend Dashboard (Week 6-7)

**Goals:**
- Build usage dashboard UI
- Charts and graphs
- Real-time updates

**Tasks:**
1. Create usage dashboard page
2. Integrate Chart.js or Recharts
3. Fetch data from API endpoints
4. Display cost breakdown
5. Add export to CSV
6. Add usage alerts UI

**Deliverables:**
- Usage dashboard page
- Interactive charts
- Export functionality

### Phase 5: Billing Integration (Week 8-9)

**Goals:**
- Integrate with Stripe
- Generate invoices
- Automate billing

**Tasks:**
1. Set up Stripe account
2. Create Stripe products/prices
3. Implement usage-based billing
4. Generate monthly invoices
5. Send invoice emails
6. Handle payment webhooks

**Deliverables:**
- Stripe integration
- Automated billing
- Invoice generation

---

## Cost Analysis Tools

### Provider API Documentation

#### Neon API
```bash
# Get project consumption
curl -H "Authorization: Bearer $NEON_API_KEY" \
  https://console.neon.tech/api/v2/projects/{project_id}/consumption

# Response
{
  "consumption": {
    "storage_bytes": 256000000,  # 256MB
    "compute_seconds": 435600,    # 121 hours
    "data_transfer_bytes": 1200000000  # 1.2GB
  }
}
```

#### Fly.io API
```bash
# Get app metrics
curl -H "Authorization: Bearer $FLY_API_TOKEN" \
  "https://api.fly.io/graphql" \
  -d '{
    "query": "query($appName: String!) {
      app(name: $appName) {
        machines {
          nodes {
            id
            region
            state
            config {
              guest { cpus, memory_mb }
            }
          }
        }
      }
    }",
    "variables": {"appName": "chef-convex-demo"}
  }'
```

#### Cloudflare Analytics Engine
```sql
-- Query R2 usage
SELECT
  bucket_name,
  SUM(storage_bytes) as total_storage,
  SUM(class_a_operations) as writes,
  SUM(class_b_operations) as reads
FROM r2_analytics
WHERE account_id = '5a91e619c59af6ec7a40ffccc93f2a5c'
  AND timestamp >= NOW() - INTERVAL '1' DAY
GROUP BY bucket_name;
```

---

## Alerts and Notifications

### Usage Alert Types

1. **Cost Threshold Alert**
   - Trigger when monthly cost exceeds $X
   - Email notification to user
   - Dashboard banner

2. **Quota Exceeded Alert**
   - Trigger when usage exceeds free tier
   - Suggest upgrade to paid tier
   - Show cost impact

3. **Anomaly Detection**
   - Detect unusual spikes in usage
   - Compare to 7-day average
   - Alert if >50% increase

### Alert Configuration

```sql
-- Set cost alert threshold
INSERT INTO usage_alerts (tenant_id, alert_type, threshold_value)
VALUES ('550e8400-...', 'cost_threshold', 10.00);

-- Alert triggers when daily cost > $10
```

---

## Future Enhancements

### Q2 2024
- [ ] Real-time usage streaming (WebSocket)
- [ ] Predictive cost modeling (ML)
- [ ] Budget recommendations
- [ ] Cost optimization suggestions

### Q3 2024
- [ ] Multi-currency support
- [ ] Team-based billing
- [ ] Usage-based pricing tiers
- [ ] Committed use discounts

### Q4 2024
- [ ] Self-service billing portal
- [ ] Invoice customization
- [ ] Payment methods (ACH, wire)
- [ ] Enterprise billing agreements

---

## Appendix

### Cost Calculation Formulas

#### Neon
```python
# Storage cost
storage_cost = (storage_gb - 0.5) * 0.102 if storage_gb > 0.5 else 0

# Compute cost
compute_hours = compute_seconds / 3600
compute_cost = (compute_hours - 191) * 0.16 if compute_hours > 191 else 0

# Egress cost
egress_cost = (egress_gb - 5) * 0.09 if egress_gb > 5 else 0

total_neon_cost = storage_cost + compute_cost + egress_cost
```

#### Fly.io
```python
# CPU cost
cpu_cost = (cpu_seconds / 3600) * 0.0000023

# Memory cost
memory_cost = (memory_mb_hours / 1024) * 0.02

# Egress cost
egress_cost = egress_gb * 0.02

total_flyio_cost = cpu_cost + memory_cost + egress_cost
```

#### R2
```python
# Storage cost
storage_cost = (storage_gb - 10) * 0.015 if storage_gb > 10 else 0

# Operations cost
class_a_cost = ((class_a_ops - 1000000) / 1000000) * 4.50 if class_a_ops > 1000000 else 0
class_b_cost = ((class_b_ops - 10000000) / 1000000) * 0.36 if class_b_ops > 10000000 else 0

total_r2_cost = storage_cost + class_a_cost + class_b_cost
```

#### Pages
```python
# Build cost
build_cost = (build_minutes - 500) * 0.01 if build_minutes > 500 else 0

# Requests and bandwidth are free
total_pages_cost = build_cost
```

---

## References

- [Neon Pricing](https://neon.tech/pricing)
- [Fly.io Pricing](https://fly.io/docs/about/pricing/)
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare Pages Pricing](https://developers.cloudflare.com/pages/platform/pricing/)
- [Cloudflare Analytics Engine Docs](https://developers.cloudflare.com/analytics/analytics-engine/)
- [Stripe Usage-Based Billing](https://stripe.com/docs/billing/subscriptions/usage-based)

---

**Document Version:** 1.0
**Last Updated:** 2024-01-24
**Author:** Chef Platform Team
**Status:** Draft - Pending Review


# Chef Platform

Multi-tenant AI app builder with self-hosted infrastructure using Cloudflare + Neon.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chef Platform                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │   Chef UI    │───▶│  Control Plane   │───▶│  Cloudflare   │  │
│  │   (Remix)    │    │     (Rust)       │    │    + Neon     │  │
│  └──────────────┘    └──────────────────┘    └───────────────┘  │
│                              │                                   │
│                              ▼                                   │
│                      ┌──────────────────┐                       │
│                      │  Per-Tenant:     │                       │
│                      │  - Neon Postgres │                       │
│                      │  - R2 Bucket     │                       │
│                      │  - KV Namespace  │                       │
│                      │  - D1 Database   │                       │
│                      │  - Worker        │                       │
│                      └──────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Rust 1.83+ (for local development)
- WorkOS account
- Cloudflare account with API token
- Neon account

### Development Setup

1. **Clone and configure:**
   ```bash
   cd chef-platform
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Verify:**
   ```bash
   curl http://localhost:8080/api/internal/health
   ```

### Local Development (without Docker)

1. **Start Postgres:**
   ```bash
   docker run -d --name chef-postgres \
     -e POSTGRES_USER=chef \
     -e POSTGRES_PASSWORD=chefpassword \
     -e POSTGRES_DB=control_plane \
     -p 5432:5432 \
     postgres:16-alpine
   ```

2. **Run control plane:**
   ```bash
   cd control-plane
   cargo run
   ```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/internal/health` | Health check |
| POST | `/oauth/token` | WorkOS token exchange |
| GET | `/api/dashboard/profile` | User profile |
| GET | `/api/dashboard/teams` | List teams |
| POST | `/api/create_project` | Create project + provision resources |
| POST | `/api/dashboard/authorize` | Generate deploy key |
| POST | `/api/hosting/deploy` | Deploy to R2/Workers |
| GET | `/api/dashboard/teams/:slug/usage/get_token_info` | Check quota |
| POST | `/api/dashboard/teams/:slug/usage/record_tokens` | Record usage |
| POST | `/webhooks/workos` | WorkOS webhook receiver |

## Environment Variables

See `.env.example` for all configuration options.

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `WORKOS_CLIENT_ID` - WorkOS OAuth client ID
- `WORKOS_API_KEY` - WorkOS API key
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with R2/KV/D1/Workers permissions
- `AWS_ACCESS_KEY_ID` - R2 access key
- `AWS_SECRET_ACCESS_KEY` - R2 secret key
- `AWS_S3_ENDPOINT` - R2 endpoint URL
- `NEON_API_KEY` - Neon API key
- `NEON_ORG_ID` - Neon organization ID
- `JWT_SECRET` - Secret for JWT signing
- `ENCRYPTION_KEY` - Key for encrypting secrets

## Project Structure

```
chef-platform/
├── control-plane/          # Rust API
│   ├── src/
│   │   ├── api/           # HTTP handlers
│   │   ├── services/      # Business logic
│   │   ├── providers/     # External API clients
│   │   ├── models/        # Database models
│   │   └── middleware/    # Auth, rate limiting
│   └── migrations/        # SQL migrations
├── docker/                # Dockerfiles
├── docker-compose.yml     # Local development
└── docker-compose.prod.yml # Production
```

## WorkOS Webhook Setup

Configure WorkOS to send webhooks to `https://your-domain.com/webhooks/workos` for:
- `organization.created`
- `organization.updated`
- `organization.deleted`
- `user.created`
- `user.updated`
- `organization_membership.created`
- `organization_membership.deleted`

## License

Private - All rights reserved.
