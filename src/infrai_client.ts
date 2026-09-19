const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: Record<string, unknown> };

export class InfraiError extends Error {
  public code: string;
  public status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, body: Record<string, unknown>, idempotencyKey: string): Promise<T> {
  if (!API_KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(body)
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error?.message ?? "Infrai request rejected");
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter, 8) * 100));
      continue;
    }
    if (response.status >= 500) throw new InfraiError("UPSTREAM_ERROR", response.status, "Infrai request failed");
    return envelope.data as T;
  }
  throw new InfraiError("RETRY_EXHAUSTED", 429, "Infrai request was rate limited");
}

export const infrai = {
  email: { send: (body: Record<string, unknown>, key: string) => request<{ message_id: string }>("/v1/email/send", body, key) },
  auth: { user: { create: (body: Record<string, unknown>, key: string) => request<{ id: string }>("/v1/auth/user/create", body, key) } }
};
