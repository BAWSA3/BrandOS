// Env values pasted into Vercel can carry a trailing newline or space; Stripe
// rejects the key in the Authorization header ("Invalid character in header
// content") and webhook signatures never match. Read Stripe env trimmed.
export function stripeEnv(name: string): string {
  return (process.env[name] ?? '').trim();
}
