import LandingClient from './LandingClient';

// The landing page. A server wrapper only so the Direction 03 switch can read
// FIELD_SYSTEM (no request data, so the page stays static).
export default function LandingPage() {
  return <LandingClient fieldEnv={process.env.FIELD_SYSTEM === 'true'} />;
}
