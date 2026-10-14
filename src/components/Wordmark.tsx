import Link from 'next/link';

/**
 * The BrandOS hero wordmark ("Brand" + halftone "OS"): the only way the logo
 * appears in the product. Never type "BrandOS" as a logo (brand tokens,
 * 2026-10-13). Day art on light surfaces, night art on dark ones.
 */
export default function Wordmark({
  height = 28,
  mode = 'day',
  href = '/',
  className,
}: {
  height?: number;
  mode?: 'day' | 'night';
  /** null: not a link */
  href?: string | null;
  className?: string;
}) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized brand art
    <img
      src={mode === 'night' ? '/brandos-wordmark-night.png' : '/brandos-wordmark-day.png'}
      alt="BrandOS"
      width={Math.round(height * (1600 / 319))}
      height={height}
      className={className}
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
  return href ? (
    <Link href={href} aria-label="BrandOS home">
      {img}
    </Link>
  ) : (
    img
  );
}
