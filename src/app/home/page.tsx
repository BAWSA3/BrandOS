import { redirect } from 'next/navigation';

// The title screen (station hero + main menu) was retired with stations
// (2026-10-22). /home stays as a route so old links and emails still land on
// the dashboard.
export default function HomePage() {
  redirect('/dashboard');
}
