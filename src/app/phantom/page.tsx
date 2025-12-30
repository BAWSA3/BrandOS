'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './phantom.module.css';

// Phantom Ghost Logo Component
const PhantomGhost = ({ size = 48, className = '', glow = false }: { size?: number; className?: string; glow?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={`${className} ${glow ? styles.ghostGlow : ''}`}
    fill="currentColor"
  >
    <path d="M50 5C25 5 10 25 10 50C10 70 15 85 15 95C15 98 18 98 20 95C22 92 25 88 30 88C35 88 38 92 40 95C42 98 45 98 47 95C49 92 50 88 50 88C50 88 51 92 53 95C55 98 58 98 60 95C62 92 65 88 70 88C75 88 78 92 80 95C82 98 85 98 85 95C85 85 90 70 90 50C90 25 75 5 50 5Z" />
    <ellipse cx="35" cy="45" rx="8" ry="12" fill="#1c1c1c" />
    <ellipse cx="65" cy="45" rx="8" ry="12" fill="#1c1c1c" />
  </svg>
);

// Product Card Component
const ProductCard = ({
  product,
  index,
  isVisible
}: {
  product: typeof products[0];
  index: number;
  isVisible: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${styles.productCard} ${isVisible ? styles.visible : ''}`}
      style={{ animationDelay: `${index * 150}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Frosted Glass Overlay */}
      <div className={styles.frostedOverlay} />

      {/* Product Number Badge */}
      <div className={styles.productBadge}>
        <span className={styles.badgeNumber}>0{index + 1}</span>
      </div>

      {/* Ghost Watermark */}
      <div className={styles.ghostWatermark}>
        <PhantomGhost size={120} />
      </div>

      {/* Circuit Pattern (revealed on hover) */}
      <div className={`${styles.circuitPattern} ${isHovered ? styles.circuitVisible : ''}`}>
        <svg viewBox="0 0 200 200" className={styles.circuitSvg}>
          <path d="M20 100 H80 M80 100 V60 M80 60 H120 M120 60 V100 M120 100 H180" stroke="currentColor" strokeWidth="1" fill="none" />
          <path d="M40 140 H100 M100 140 V180" stroke="currentColor" strokeWidth="1" fill="none" />
          <circle cx="80" cy="100" r="4" fill="currentColor" />
          <circle cx="120" cy="60" r="4" fill="currentColor" />
          <circle cx="100" cy="140" r="4" fill="currentColor" />
          <rect x="70" y="30" width="20" height="15" rx="2" fill="currentColor" opacity="0.5" />
          <rect x="150" y="90" width="25" height="20" rx="2" fill="currentColor" opacity="0.5" />
        </svg>
      </div>

      {/* Product Visual Area */}
      <div className={styles.productVisual}>
        <div className={styles.productIcon}>
          {product.icon}
        </div>
        <div className={`${styles.ledIndicator} ${isHovered ? styles.ledActive : ''}`} />
      </div>

      {/* Product Info */}
      <div className={styles.productInfo}>
        <span className={styles.productCategory}>{product.category}</span>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.productTagline}>{product.tagline}</p>

        {/* Expanded Details on Hover */}
        <div className={`${styles.productDetails} ${isHovered ? styles.detailsVisible : ''}`}>
          <div className={styles.detailDivider} />
          <ul className={styles.featureList}>
            {product.features.map((feature, i) => (
              <li key={i} className={styles.featureItem}>
                <span className={styles.featureDot} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Material Tag */}
      <div className={styles.materialTag}>
        <span>{product.material}</span>
      </div>
    </div>
  );
};

// Accessory Card Component (smaller cards)
const AccessoryCard = ({
  accessory,
  index,
  isVisible
}: {
  accessory: typeof accessories[0];
  index: number;
  isVisible: boolean;
}) => {
  return (
    <div
      className={`${styles.accessoryCard} ${isVisible ? styles.visible : ''}`}
      style={{ animationDelay: `${(index + 4) * 150}ms` }}
    >
      <div className={styles.accessoryIcon}>{accessory.icon}</div>
      <div className={styles.accessoryInfo}>
        <h4 className={styles.accessoryName}>{accessory.name}</h4>
        <p className={styles.accessoryDesc}>{accessory.description}</p>
      </div>
      <div className={styles.accessoryGhost}>
        <PhantomGhost size={24} />
      </div>
    </div>
  );
};

// Product Data
const products = [
  {
    name: 'Phantom Portable',
    category: 'Handheld Console',
    tagline: 'The kind of device that feels substantial in hand.',
    material: 'Matte Soft-Touch ABS',
    features: [
      'Landscape orientation grip',
      'Frosted purple D-pad accent',
      'Embossed ghost icon',
      'PCB window on back panel'
    ],
    icon: (
      <svg viewBox="0 0 80 50" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="5" width="76" height="40" rx="8" />
        <rect x="22" y="12" width="36" height="26" rx="2" fill="currentColor" opacity="0.1" />
        <circle cx="12" cy="25" r="6" />
        <circle cx="68" cy="20" r="3" />
        <circle cx="68" cy="30" r="3" />
        <rect x="4" y="2" width="12" height="4" rx="1" />
        <rect x="64" y="2" width="12" height="4" rx="1" />
      </svg>
    )
  },
  {
    name: 'Phantom Station',
    category: 'Home Console',
    tagline: 'A console you\'d see in an architecture magazine.',
    material: 'Anodized Aluminum Trim',
    features: [
      'Compact horizontal profile',
      'Frosted LED edge strip',
      'Embossed top surface',
      'Hidden ventilation design'
    ],
    icon: (
      <svg viewBox="0 0 80 40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="8" width="76" height="28" rx="4" />
        <line x1="2" y1="32" x2="78" y2="32" strokeOpacity="0.3" />
        <circle cx="40" cy="20" r="8" strokeOpacity="0.5" />
        <circle cx="40" cy="20" r="3" fill="currentColor" opacity="0.3" />
        <rect x="10" y="14" width="8" height="2" rx="1" />
        <rect x="10" y="20" width="5" height="2" rx="1" />
        <circle cx="70" cy="18" r="2" fill="currentColor" opacity="0.5" />
      </svg>
    )
  },
  {
    name: 'Phantom Grip',
    category: 'Wireless Controller',
    tagline: 'Tool and art object. Quietly excellent.',
    material: 'Textured Grip Surface',
    features: [
      'Symmetrical analog layout',
      'Micro-pattern grip texture',
      'Purple LED light bar',
      'Translucent trigger option'
    ],
    icon: (
      <svg viewBox="0 0 80 50" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M15 20 Q5 25 5 35 Q5 45 15 45 L25 45 Q30 45 32 40 L35 30 L45 30 L48 40 Q50 45 55 45 L65 45 Q75 45 75 35 Q75 25 65 20 L55 15 Q40 10 25 15 Z" />
        <circle cx="25" cy="28" r="6" />
        <circle cx="55" cy="28" r="6" />
        <circle cx="42" cy="22" r="3" fill="currentColor" opacity="0.3" />
        <rect x="35" y="8" width="10" height="3" rx="1" />
      </svg>
    )
  }
];

const accessories = [
  {
    name: 'Phantom Cart',
    description: 'Game cartridge as collectible artifact',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="2" width="24" height="28" rx="2" />
        <rect x="8" y="6" width="16" height="12" rx="1" fill="currentColor" opacity="0.1" />
        <rect x="10" y="24" width="4" height="4" rx="0.5" />
        <rect x="18" y="24" width="4" height="4" rx="0.5" />
      </svg>
    )
  },
  {
    name: 'Phantom Shell',
    description: 'Travel case with soft interior',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="28" height="20" rx="4" />
        <path d="M2 16 Q16 12 30 16" strokeOpacity="0.5" />
        <circle cx="28" cy="16" r="2" fill="currentColor" opacity="0.5" />
      </svg>
    )
  },
  {
    name: 'Phantom Base',
    description: 'Charging dock with LED glow',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 28 L8 12 Q10 8 16 8 Q22 8 24 12 L28 28 Z" />
        <line x1="6" y1="28" x2="26" y2="28" />
        <rect x="12" y="4" width="8" height="6" rx="1" strokeOpacity="0.5" />
      </svg>
    )
  },
  {
    name: 'Phantom Pedestal',
    description: 'Museum-quality display stand',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="20" width="20" height="10" rx="2" />
        <rect x="10" y="8" width="12" height="12" rx="1" fill="currentColor" opacity="0.1" />
        <line x1="16" y1="8" x2="16" y2="4" strokeOpacity="0.5" />
      </svg>
    )
  }
];

export default function PhantomShowcase() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const heroRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const accessoriesRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15, rootMargin: '-50px' }
    );

    [heroRef, productsRef, accessoriesRef, ctaRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, [mounted]);

  const handleImportBrand = () => {
    router.push('/app?template=phantom-gaming');
  };

  if (!mounted) {
    return <div className={styles.loading} />;
  }

  return (
    <div className={styles.container}>
      {/* Grid Background */}
      <div className={styles.gridBackground} />

      {/* Floating Orbs */}
      <div className={styles.orbContainer}>
        <div className={styles.orb} style={{ top: '10%', left: '10%', animationDelay: '0s' }} />
        <div className={styles.orb} style={{ top: '60%', right: '15%', animationDelay: '2s' }} />
        <div className={styles.orbSmall} style={{ top: '30%', right: '25%', animationDelay: '1s' }} />
        <div className={styles.orbSmall} style={{ bottom: '20%', left: '20%', animationDelay: '3s' }} />
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <PhantomGhost size={32} glow />
          <span className={styles.navBrand}>PHANTOM</span>
        </div>
        <button className={styles.navButton} onClick={handleImportBrand}>
          Import to BrandOS
        </button>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} id="hero" className={styles.hero}>
        <div className={styles.heroContent}>
          {/* Era Badge */}
          <div className={styles.eraBadge}>
            <span className={styles.eraYear}>Y2K</span>
            <span className={styles.eraDivider}>×</span>
            <span className={styles.eraText}>MODERN</span>
          </div>

          {/* Main Ghost Logo */}
          <div className={styles.heroLogo} style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
            <PhantomGhost size={180} glow />
          </div>

          {/* Title */}
          <h1 className={styles.heroTitle}>
            <span className={styles.titleMain}>PHANTOM</span>
            <span className={styles.titleSub}>GAMING</span>
          </h1>

          {/* Tagline */}
          <p className={styles.heroTagline}>
            Premium gaming hardware that rewards close inspection.
            <br />
            <span className={styles.taglineAccent}>A quiet flex—never loud, always knowing.</span>
          </p>

          {/* Color Palette Display */}
          <div className={styles.paletteDisplay}>
            <div className={styles.paletteItem}>
              <div className={styles.paletteSwatch} style={{ background: '#1c1c1c' }} />
              <span className={styles.paletteLabel}>Phantom Black</span>
            </div>
            <div className={styles.paletteItem}>
              <div className={styles.paletteSwatch} style={{ background: '#ab9ff2' }} />
              <span className={styles.paletteLabel}>Phantom Purple</span>
            </div>
            <div className={styles.paletteItem}>
              <div className={styles.paletteSwatch} style={{ background: '#fffdf8' }} />
              <span className={styles.paletteLabel}>Phantom Cream</span>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className={styles.scrollIndicator}>
            <span className={styles.scrollText}>EXPLORE PRODUCTS</span>
            <div className={styles.scrollLine} />
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section ref={productsRef} id="products" className={styles.productsSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>HARDWARE LINEUP</span>
          <h2 className={styles.sectionTitle}>Core Products</h2>
          <p className={styles.sectionDesc}>
            Three eras of gaming, distilled into premium modern artifacts.
          </p>
        </div>

        <div className={styles.productsGrid}>
          {products.map((product, index) => (
            <ProductCard
              key={product.name}
              product={product}
              index={index}
              isVisible={visibleSections.has('products')}
            />
          ))}
        </div>
      </section>

      {/* Accessories Section */}
      <section ref={accessoriesRef} id="accessories" className={styles.accessoriesSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>ECOSYSTEM</span>
          <h2 className={styles.sectionTitle}>Accessories</h2>
          <p className={styles.sectionDesc}>
            Objects that make ownership feel considered.
          </p>
        </div>

        <div className={styles.accessoriesGrid}>
          {accessories.map((accessory, index) => (
            <AccessoryCard
              key={accessory.name}
              accessory={accessory}
              index={index}
              isVisible={visibleSections.has('accessories')}
            />
          ))}
        </div>
      </section>

      {/* Design Philosophy Section */}
      <section className={styles.philosophySection}>
        <div className={styles.philosophyContent}>
          <div className={styles.philosophyQuote}>
            <PhantomGhost size={48} className={styles.quoteGhost} />
            <blockquote>
              "Premium but not sterile. Confident but not aggressive.
              Nostalgic but not kitschy. The feeling of unboxing something collectible."
            </blockquote>
          </div>

          <div className={styles.eraBlend}>
            <div className={styles.eraItem}>
              <span className={styles.eraTitle}>Late 80s/90s</span>
              <p>Chunky proportions, tactile buttons, Game Boy honesty</p>
            </div>
            <div className={styles.eraItem}>
              <span className={styles.eraTitle}>Mid-to-Late 90s</span>
              <p>PlayStation sophistication, gray-on-gray contrast</p>
            </div>
            <div className={styles.eraItem}>
              <span className={styles.eraTitle}>Y2K Era</span>
              <p>Translucent plastics, exposed internals, optimistic futurism</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} id="cta" className={styles.ctaSection}>
        <div className={`${styles.ctaContent} ${visibleSections.has('cta') ? styles.visible : ''}`}>
          <h2 className={styles.ctaTitle}>Import this brand into BrandOS</h2>
          <p className={styles.ctaDesc}>
            Use Phantom Gaming as a template for your own brand system.
            Includes color palette, tone settings, and voice samples.
          </p>
          <button className={styles.ctaButton} onClick={handleImportBrand}>
            <PhantomGhost size={20} />
            <span>Import Phantom Brand</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <PhantomGhost size={24} />
            <span>PHANTOM</span>
          </div>
          <div className={styles.footerLinks}>
            <a href="/app">BrandOS App</a>
            <a href="/">Home</a>
          </div>
          <div className={styles.footerMeta}>
            <span>Brand Showcase Demo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
