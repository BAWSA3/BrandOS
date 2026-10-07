import { Inter_Tight } from 'next/font/google';
import ScanReveal from './ScanReveal';

// Preview of the scan -> reveal redesign (not linked). See ScanReveal.tsx.
const display = Inter_Tight({ subsets: ['latin'] });

export default function Page() {
  return (
    <div className={display.className}>
      <ScanReveal />
    </div>
  );
}
