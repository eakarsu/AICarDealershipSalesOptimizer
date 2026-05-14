# Audit Apply Note — AICarDealershipSalesOptimizer

Source: `_AUDIT/reports/batch_01.md` § 15.

## Audit findings vs. reality
The audit reported "0 AI endpoints" but `routes/aiNew.js` exposes 8 AI endpoints. So "Missing AI Layer" is incorrect. Notifications and integration API gaps remain valid.

## Implemented in this pass (MECHANICAL)

| # | Item | File | Endpoints |
|---|------|------|-----------|
| 1 | Webhook subscription stub | `backend/routes/webhooks.js` (new) + `backend/server.js` | `GET/POST/DELETE /api/webhooks`, `POST /api/webhooks/:id/test`, `GET /api/webhooks/_/events` |

Allowed events: lead.created/qualified, deal.opened/closed_won/closed_lost, test_drive.scheduled, service_appointment.scheduled, inventory.added/sold, commission.calculated, campaign.launched. Lazy table; payload-only test (no outbound HTTP). `node --check` passes.

## Backlog (not implemented)

| Item | Tag | Why deferred |
|------|-----|---------------|
| Email/SMS/push notifications | NEEDS-CREDS | SMTP / Twilio / FCM |
| Outbound webhook delivery | TOO-RISKY | Background job infra |
| CRM/DMS integrations (Salesforce, CDK, Reynolds) | NEEDS-CREDS | Vendor partnerships |
| Multi-agent orchestration | NEEDS-PRODUCT-DECISION | Agent topology |

## Apply pass 3 (frontend)

LEFT-AS-IS. Frontend was already complete. `frontend/src/pages/AIStudioPage.js` exposes all 8 AI tools from `backend/routes/aiNew.js` plus history pagination and feature filter; `frontend/src/pages/WebhooksPage.js` covers list/create/delete/test for `backend/routes/webhooks.js`. Both pages are registered in `frontend/src/App.js` (`/ai-studio`, `/webhooks`) and use the shared `services/api.js` `request()` helper which sets `Authorization: Bearer <localStorage token>`. Backend already returns JSON errors that the UI surfaces (covers the 503-no-key case). No FE files changed in this pass.

## Apply pass 4 (mechanical backlog)

LEFT-AS-IS. No mechanical backlog items remain. The original audit's "Missing AI Layer" gap was incorrect (8 endpoints exist in `routes/aiNew.js`); pass 2 added the webhook subscription scaffold; pass 3 verified FE coverage. All remaining items in this audit note are deferred for explicit reasons:
- Email/SMS/push notifications — NEEDS-CREDS (SMTP/Twilio/FCM).
- Outbound webhook delivery — TOO-RISKY (background-job infra; would touch working code).
- CRM/DMS integrations (Salesforce, CDK, Reynolds) — NEEDS-CREDS (vendor partnerships).
- Multi-agent orchestration — NEEDS-PRODUCT-DECISION (agent topology).
- Audit's strategic suggestions (RAG over playbooks, real-time anomaly detection, white-label/reseller) — NEEDS-PRODUCT-DECISION.

No code changes. No smoke test (no code change).
