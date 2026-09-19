import { z } from "zod";
import { infrai } from "./infrai_client";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(1),
  shipmentId: z.string().min(1),
  eventType: z.enum(["picked_up", "in_transit", "delivered", "exception"]),
  proofOfDelivery: z.string().optional(),
  exceptionNote: z.string().optional()
});
export type Signup = z.infer<typeof signupSchema>;

export function verificationDecision(input: Signup): "send" | "hold" {
  return input.eventType === "exception" && !input.exceptionNote ? "hold" : "send";
}

export async function registerAndSendVerification(input: Signup) {
  const parsed = signupSchema.parse(input);
  if (verificationDecision(parsed) === "hold") return { status: "held", reason: "exception_note_required" as const };
  const idempotencyKey = `logistics-signup:${parsed.email}:${parsed.shipmentId}`;
  const user = await infrai.auth.user.create({ email: parsed.email, password: parsed.password, name: parsed.name, metadata: { shipment_id: parsed.shipmentId, event_type: parsed.eventType }, vendor: "logistics", mode: "M", idempotency_key: idempotencyKey }, idempotencyKey);
  const email = await infrai.email.send({ to: parsed.email, subject: "Verify your logistics account", html: `<p>Verify your account for shipment ${parsed.shipmentId}.</p>` }, idempotencyKey);
  return { status: "verification_sent" as const, userId: user.id, messageId: email.message_id };
}
