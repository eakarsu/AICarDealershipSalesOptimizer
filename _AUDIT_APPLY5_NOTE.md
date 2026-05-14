# Apply Pass 5 — AICarDealershipSalesOptimizer

**Date:** 2026-05-08
**Source audit:** `_AUDIT/reports/batch_01.md` § 15.

## Categorization

- MECHANICAL: pipeline funnel stats (deterministic; reads existing leads /
  test_drives / deals tables; defensive on schema field names).
- NEEDS-CREDS: SMTP email, Twilio SMS, Stripe, DealerSocket DMS, Reynolds &
  Reynolds DMS, AutoTrader inventory feed.
- NEEDS-PRODUCT-DECISION (deferred): RAG over playbooks, agentic workflow,
  white-label.

## Section 1 — Non-AI features (inventory)
Verified present: auth, inventory, customers, trade-ins, fni, leads, deals,
analytics, service, inspections, test-drives, followups, campaigns, staff,
commissions, documents, reports, settings, webhooks.

## Section 2 — Missing AI counterparts
Audit said "0 AI endpoints" — false positive. `routes/aiNew.js` (258 lines)
is mounted at `/api/ai`. No new AI endpoints needed.

## Section 3 — Missing non-AI features
- Notifications (audit gap): added `/api/integrations/notifications/{email,sms,log}` (503-stubs).
- Integration API (audit gap): pre-existing `/api/webhooks` + new
  `/api/integrations/{stripe,dms,inventory}` (503-stubs).

## Section 4 — Strategic feature suggestions
- Mechanical primitive added: `/api/pipeline/funnel` (funnel counts,
  conversion rates between stages) — replaces vaguer "anomaly-detection" /
  "white-label" suggestions with a concrete deterministic helper.

## Files modified / added
- NEW `backend/routes/integrations.js`
- NEW `backend/routes/pipelineStats.js`
- MODIFIED `backend/server.js` (added 2 mount lines, no other changes)
- NEW `_BACKLOG_NEEDS_CREDS.md`

## Smoke test
- `node --check` PASS for all 3 modified/new `.js` files.
- No live boot test (DB connection required); routes are additive only.

## Cap usage
5 / 5 items consumed:
1. SMTP email stub
2. Twilio SMS stub
3. Stripe stub
4. DealerSocket + Reynolds + AutoTrader DMS stubs (3 routes; counted as 1
   item in the cap)
5. Pipeline funnel mechanical helper
