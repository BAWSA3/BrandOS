import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BrandOS Research Hub',
  description: 'Internal creator interview tool for BrandOS',
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
