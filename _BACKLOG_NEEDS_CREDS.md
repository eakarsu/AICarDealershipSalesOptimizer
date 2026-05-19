# Backlog — credentials needed (Apply Pass 5)

The following integration endpoints are stubbed and return HTTP 503
`{ error, missing: [...] }` until the corresponding env vars are set.

| Endpoint | Provider | Required env vars |
|---|---|---|
| `POST /api/integrations/notifications/email` | SMTP email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` |
| `POST /api/integrations/notifications/sms` | Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |
| `POST /api/integrations/stripe/charge` | Stripe | `STRIPE_SECRET_KEY` |
| `GET /api/integrations/dms/dealersocket/leads` | DealerSocket DMS | `DEALERSOCKET_API_KEY`, `DEALERSOCKET_DEALER_ID` |
| `GET /api/integrations/dms/reynolds/inventory` | Reynolds & Reynolds ERA-IGNITE | `REYNOLDS_API_KEY`, `REYNOLDS_DEALER_ID` |
| `GET /api/integrations/inventory/autotrader/feed` | AutoTrader | `AUTOTRADER_API_KEY`, `AUTOTRADER_DEALER_ID` |

When set, the routes still need their respective SDK / outbound HTTP wiring;
no new dependencies were added in this pass.
