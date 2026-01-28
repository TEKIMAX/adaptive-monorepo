# TODO - Version 1.1.0

**Branch:** `develop/v1.1`
**Target:** Q1 2026

---

## High Priority

### Health Monitoring
- [ ] Add instance health check endpoint
- [ ] Implement background health monitoring
- [ ] Create health status dashboard query
- [ ] Set up alerting for down instances

### Error Recovery
- [ ] Implement automatic retry for transient failures
- [ ] Add cleanup for failed provisioning resources
- [ ] Create manual retry endpoint
- [ ] Build orphaned resource detection

### Security & Compliance
- [ ] Enhanced audit logging
- [ ] Resource validation after provisioning
- [ ] Implement rate limiting on endpoints
- [ ] Deploy key rotation system

---

## Medium Priority

### Enhanced Observability
- [ ] Add structured logging throughout provisioning
- [ ] Track provisioning metrics (success rate, timing)
- [ ] Build metrics dashboard query
- [ ] Enhanced GitHub Actions logging

### User Experience
- [ ] Provisioning started email notification
- [ ] Instance ready email with login URL
- [ ] Public provisioning status page
- [ ] Welcome email with onboarding guide

### Documentation
- [ ] API documentation for all endpoints
- [ ] Update architecture diagrams
- [ ] Add runbook for operations
- [ ] Document metrics and monitoring

---

## Low Priority

### Performance
- [ ] Parallelize independent provisioning steps
- [ ] Cache WorkOS user lookups
- [ ] Optimize Convex queries with indexes
- [ ] Pre-warm Cloudflare deployments

### Testing
- [ ] Integration tests for health monitoring
- [ ] Unit tests for retry logic
- [ ] E2E tests with notifications
- [ ] Load testing for concurrent provisioning

---

## Technical Debt

- [ ] Standardize error handling across scripts
- [ ] Add TypeScript types for all Convex functions
- [ ] Refactor large functions into modules
- [ ] Add input validation for all endpoints
- [ ] Improve code comments

---

## Decisions Needed

- [ ] Choose email service provider (Resend vs SendGrid)
- [ ] Define retry policy (max retries, backoff)
- [ ] Set rate limits for provisioning
- [ ] Decide on monitoring service or custom dashboard

---

## Current Sprint

### This Week
- [ ] Set up docs folder structure
- [ ] Review v1.0.0 baseline
- [ ] Plan first feature implementation
- [ ] Set up staging environment for v1.1

---

## Completed ✅

### v1.0.0 (Released)
- ✅ Complete end-to-end provisioning
- ✅ Stripe webhook integration
- ✅ Convex Management API integration
- ✅ WorkOS provisioning
- ✅ Cloudflare deployment
- ✅ Brain control plane
- ✅ Audit trail (stripeEvents, provisioningJobs)

---

**Last Updated:** January 28, 2026
