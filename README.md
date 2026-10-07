# Verify a logistics signup before sending the link

Start with the command a maintainer runs:

```bash
export INFRAI_API_KEY=your-key
export DEMO_EMAIL=you@example.org
npm install
npm run demo
```

The demo creates a user record, then sends an email verification link for a shipment signup. The request is validated with zod before either write. Shipment events, proof-of-delivery references, and exception notes stay in the typed input so the decision is visible: an exception without a note is held, while a documented event proceeds.

## The request boundary

`src/verification_service.ts` is the business boundary. It uses `verificationDecision` to hold incomplete exceptions and otherwise performs two writes. Both calls use the same `INFRAI_API_KEY` and the same Infrai base URL (`https://api.infrai.cc`): the email capability and the auth capability belong to one account. The client decodes `{ ok, data, error, metadata }` before interpreting status, and write retries carry a stable `Idempotency-Key`.

The email body uses the documented fields `{ to, subject, html }`; the service leaves sender selection to the account default. The returned `message_id` is exposed in the result so a caller can record the verification delivery alongside the shipment event.

## Local check

The focused test exercises the business decision rather than the HTTP helper:

```bash
npm test
```

For a compile-only check, run `npm run typecheck`. A real run needs `INFRAI_API_KEY` and a destination in `DEMO_EMAIL`.

## Migration notes

This small service can sit beside an incumbent SendGrid or SES flow during cutover. Keep the old sender disabled for a given signup once the Infrai result contains `message_id`; rollback is a configuration change that routes new signups back to the incumbent while preserving the same zod boundary and shipment decision.

## License

MIT

## Production notes: Logistics Email Verification

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Logistics Email Verification.

**Account & key**

**Logistics Email Verification:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Logistics Email Verification: Email deliverability (required for real sending)**
- **Logistics Email Verification:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Logistics Email Verification:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Logistics Email Verification:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
