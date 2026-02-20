'use client';

export default function HeroBackground() {
  return (
    <div className="fixed inset-0 w-full h-screen z-0">
      <video
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/sky-loop.webm" type="video/webm" />
        <source src="/sky-loop.mp4" type="video/mp4" />
      </video>

      {/* Silver Matte overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(232, 232, 237, 0.15)' }}
      />
    </div>
  );
}
