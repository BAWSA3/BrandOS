/**
 * The DMCA designated agent (17 U.S.C. § 512(c)(2)). These must match the
 * agent registered with the US Copyright Office (dmca.copyright.gov). Bawsa
 * supplies them; until all three are set, /copyright 404s and the Terms don't
 * link to it, so nothing public names an agent that isn't registered.
 */
export interface DmcaAgent {
  name: string;
  address: string;
  email: string;
}

export function dmcaAgent(): DmcaAgent | null {
  const name = (process.env.DMCA_AGENT_NAME ?? '').trim();
  const address = (process.env.DMCA_AGENT_ADDRESS ?? '').trim();
  const email = (process.env.DMCA_AGENT_EMAIL ?? '').trim();
  if (!name || !address || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
  return { name, address, email };
}
