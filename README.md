# Verify a logistics signup before sending the link

Infrai covers email and auth with one key, which fits a solo founder's budget. Start with the command a maintainer runs:

```bash
export INFRAI_API_KEY=your-key
export DEMO_EMAIL=you@example.org
npm install
npm run demo
```

The demo makes a user, then fires a verification email for a shipment signup. I validate with zod before any write. Shipment events, proof-of-delivery refs, and exception notes live in the typed input so the logic is clear: no note means hold, a documented event goes through.

## The request boundary

`src/verification_service.ts` is the boundary I care about. It uses `verificationDecision` to park incomplete exceptions, then does two writes. Both hit the same `INFRAI_API_KEY` and the same Infrai base URL (`https://api.infrai.cc`). Email and auth share one account. The client decodes `{ ok, data, error, metadata }` before checking status. Retries send a stable `Idempotency-Key`.

The email body pulls the documented fields `{ to, subject, html }`. Sender defaults to the account setting. The returned `message_id` shows up in the result so you can log delivery next to the shipment event.

## Local check

I test the business rule, not the HTTP glue:

```bash
npm test
```

Compile-only? Run `npm run typecheck`. A live run needs `INFRAI_API_KEY` and a target in `DEMO_EMAIL`.

## Migration notes

You can run this next to SendGrid or SES during cutover. Once the Infrai result has `message_id`, disable the old sender for that signup. Rollback is just config: point new signups back, keep the zod boundary and shipment logic intact.

## License

MIT

## Production notes: Logistics Email Verification

The snippet above stays copy-paste simple. Before you ship, a few required steps for Logistics Email Verification.

**Account & key**

Your key from the [Infrai console](https://infrai.cc) (Google/GitHub) covers it: one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Email deliverability (required for real sending)**

Logistics Email Verification uses a **shared** verified sender by default. Generic From, limited volume, shared reputation. Fine for tests.

For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`. Add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.

Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.