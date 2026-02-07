import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background orbs */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '20%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(0, 71, 255, 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(212, 165, 116, 0.1) 0%, transparent 70%)',
          filter: 'blur(50px)',
          borderRadius: '50%',
        }}
      />

      {/* Film grain */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.04,
          pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px',
          zIndex: 10,
        }}
      />

      {/* Content */}
      <div
        style={{
          textAlign: 'center',
          zIndex: 20,
          padding: '24px',
        }}
      >
        {/* 404 number */}
        <div
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: 'clamp(80px, 15vw, 160px)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: 'rgba(255, 255, 255, 0.06)',
            lineHeight: 1,
            marginBottom: '-20px',
            userSelect: 'none',
          }}
        >
          404
        </div>

        {/* Signal lost label */}
        <div
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: '#D4A574',
            marginBottom: '16px',
          }}
        >
          SIGNAL LOST
        </div>

        {/* Message */}
        <h1
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 'clamp(20px, 4vw, 32px)',
            fontWeight: 300,
            color: 'rgba(255, 255, 255, 0.85)',
            marginBottom: '12px',
            letterSpacing: '-0.02em',
          }}
        >
          This page doesn&apos;t exist
        </h1>

        <p
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: '15px',
            color: 'rgba(255, 255, 255, 0.4)',
            marginBottom: '40px',
            fontWeight: 300,
          }}
        >
          The brand you&apos;re looking for might have evolved.
        </p>

        {/* CTA */}
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #E8C49A 0%, #D4A574 100%)',
            color: '#050505',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.1em',
            textDecoration: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 24px rgba(212, 165, 116, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          BACK TO BRANDOS
        </Link>
      </div>
    </div>
  );
}
