import test from "node:test";
import assert from "node:assert/strict";
import { verificationDecision, signupSchema } from "./verification_service";

test("an exception without a note is held for review", () => {
  const input = signupSchema.parse({ email: "clinician@example.org", password: "correct-horse-battery", name: "Mina", shipmentId: "SHP-1", eventType: "exception" });
  assert.equal(verificationDecision(input), "hold");
});
