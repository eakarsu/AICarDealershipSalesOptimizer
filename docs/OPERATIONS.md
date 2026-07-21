# Governed retail-deal operations

`/api/retail-lifecycle` links a lead to a current inventory snapshot, deterministic financing calculation, auditable desking and discount approval, explicit credit consent/permissible purpose, lender routing, disclosure digests, e-sign events, delivery reconciliation, and follow-up. Tenant-scoped state and audit events are durable and all commands require idempotency keys.

External DMS/CRM/OEM, lender, valuation, e-sign, payment, and messaging work is queued with visible failure state; queues are not represented as completed integrations. Contracts, lender certification, consumer-credit/legal review, PCI scope, identity proofing, licensed valuation/history sources, and provider credentials remain required. Startup never installs, migrates, seeds, starts databases, or kills port owners.
