"use client";

import { useState } from "react";

const BACKGROUND_URL = "/images/background.jpg";

export default function PixelatedBackground() {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none z-0"
      style={{ minHeight: "100%" }}
    >
      {/* Full background image that scrolls with content */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BACKGROUND_URL}
          alt=""
          onLoad={() => setImageLoaded(true)}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
