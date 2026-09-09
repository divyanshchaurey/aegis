"use client";

import React, { useRef, useState } from "react";

export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.09)",
  borderColor = "rgba(255, 255, 255, 0.22)",
  showCrosshairs = true,
}) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-2xl border border-white/10 bg-mono-900/80 backdrop-blur-2xl overflow-hidden transition-all duration-300 ${
        showCrosshairs ? "industrial-corners" : ""
      } ${className}`}
    >
      {/* Interactive Cursor Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 -z-0"
        style={{
          opacity,
          background: `radial-gradient(550px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 45%)`,
        }}
      />
      {/* Glowing Border Line Highlighter */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 -z-0"
        style={{
          opacity,
          background: `radial-gradient(320px circle at ${position.x}px ${position.y}px, ${borderColor}, transparent 60%)`,
          maskImage: "linear-gradient(black, black) content-box, linear-gradient(black, black)",
          WebkitMaskImage: "linear-gradient(black, black) content-box, linear-gradient(black, black)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
