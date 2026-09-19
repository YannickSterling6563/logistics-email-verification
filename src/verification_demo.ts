import { registerAndSendVerification } from "./verification_service";

const email = process.env.DEMO_EMAIL;
if (!email) throw new Error("DEMO_EMAIL is required");
const result = await registerAndSendVerification({ email, password: "correct-horse-battery", name: "Mina Chen", shipmentId: "SHP-2048", eventType: "in_transit" });
console.log(result);
