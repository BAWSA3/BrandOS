import LandingClient from './LandingClient';
import { getLandingData } from '@/lib/landing-data';

// The landing page. A server wrapper so the Direction 03 switch can read
// FIELD_SYSTEM and the landing scroll gets its live numbers (brands read,
// Founding seats left, the example read, the Index). No request data, so the
// page stays static and refreshes hourly.
export const revalidate = 3600;

export default async function LandingPage() {
  const landing = await getLandingData().catch(() => undefined);
  return <LandingClient fieldEnv={process.env.FIELD_SYSTEM === 'true'} landing={landing} />;
}
