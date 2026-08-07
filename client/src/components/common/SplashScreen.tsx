import React, { useEffect, useState } from 'react';

export const SplashScreen: React.FC<{ onFinish?: () => void }> = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      const hideTimer = setTimeout(() => {
        setHidden(true);
        if (onFinish) onFinish();
      }, 500);
      return () => clearTimeout(hideTimer);
    }, 2200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between py-12 px-6 bg-gradient-to-b from-[#022B58] via-[#064B88] to-[#0A6FB5] overflow-hidden transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Graphic: Faint Dashed Flight Trails & Airplane Silhouettes */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top-Right Flight Trajectory */}
        <path
          d="M -50 350 Q 200 150 450 80"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeDasharray="6 8"
        />
        {/* Airplane Icon Silhouette Top Right */}
        <g transform="translate(430, 70) rotate(-15) scale(0.6)">
          <path
            fill="#FFFFFF"
            d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"
          />
        </g>

        {/* Lower Left Flight Trajectory */}
        <path
          d="M 50 650 Q 150 450 300 350"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeDasharray="5 7"
        />
        {/* Airplane Icon Silhouette Middle Left */}
        <g transform="translate(60, 630) rotate(-35) scale(0.5)">
          <path
            fill="#FFFFFF"
            d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"
          />
        </g>
      </svg>

      {/* Top Spacer */}
      <div className="w-full flex-1 min-h-[40px]" />

      {/* Main Center Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full my-auto space-y-10 animate-in fade-in zoom-in duration-700">
        
        {/* Brand Logo & Title Group */}
        <div className="flex flex-col items-center">
          {/* Logo Graphic + Brand Name Row */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-4">
            
            {/* Custom Vector Logo Emblem: Stylized H + Cyan 3D Swoosh & Airplane */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                {/* 3D Cyan Swoosh Ring */}
                <path
                  d="M 12 65 C 10 40 30 20 60 22 C 78 23 88 34 85 45 C 81 58 60 70 30 75 C 18 77 12 73 12 65 Z"
                  fill="url(#cyanSwooshGrad)"
                  opacity="0.9"
                />
                {/* Stylized White "H" */}
                <path
                  d="M 28 25 L 42 25 L 42 42 L 58 42 L 58 25 L 72 25 L 72 75 L 58 75 L 58 56 L 42 56 L 42 75 L 28 75 Z"
                  fill="#FFFFFF"
                />
                {/* Dynamic Cyan Swoosh Arc to Airplane */}
                <path
                  d="M 10 70 C 15 85 45 88 70 58 C 80 46 88 34 94 20"
                  fill="none"
                  stroke="#26C6DA"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                {/* Airplane Flying Off Top Right */}
                <g transform="translate(86, 12) rotate(35) scale(0.65)">
                  <path
                    fill="#FFFFFF"
                    d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"
                  />
                </g>
                <defs>
                  <linearGradient id="cyanSwooshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#00838F" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Brand Typography */}
            <div className="flex flex-col items-start text-left">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
                  Holiday
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#26C6DA] tracking-tight leading-none">
                  City
                </span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide mt-1">
                Pvt. Ltd.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: World Map Mesh & Location Pin Markers */}
      <div className="relative w-full max-w-md mx-auto flex flex-col items-center justify-end z-10 mt-auto">
        {/* World Map Mesh SVG & Pins Overlay */}
        <div className="relative w-full h-36 flex items-center justify-center pointer-events-none opacity-40">
          <svg viewBox="0 0 400 160" className="w-full h-full">
            {/* World Map Dotted Pattern */}
            <g fill="#26C6DA" opacity="0.45">
              {/* North America dots */}
              <circle cx="60" cy="50" r="1.8" /><circle cx="75" cy="45" r="1.8" /><circle cx="90" cy="55" r="1.8" />
              <circle cx="70" cy="65" r="1.8" /><circle cx="85" cy="70" r="1.8" /><circle cx="100" cy="60" r="1.8" />
              {/* South America dots */}
              <circle cx="110" cy="95" r="1.8" /><circle cx="120" cy="110" r="1.8" /><circle cx="125" cy="125" r="1.8" />
              {/* Europe & Africa dots */}
              <circle cx="190" cy="45" r="1.8" /><circle cx="205" cy="50" r="1.8" /><circle cx="200" cy="75" r="1.8" />
              <circle cx="215" cy="90" r="1.8" /><circle cx="210" cy="115" r="1.8" />
              {/* Asia & Australia dots */}
              <circle cx="270" cy="45" r="1.8" /><circle cx="290" cy="50" r="1.8" /><circle cx="310" cy="55" r="1.8" />
              <circle cx="280" cy="70" r="1.8" /><circle cx="300" cy="75" r="1.8" /><circle cx="320" cy="80" r="1.8" />
              <circle cx="330" cy="115" r="1.8" /><circle cx="345" cy="120" r="1.8" />
            </g>

            {/* Flight Path Arc connecting Pin 1 & Pin 2 */}
            <path
              d="M 90 90 Q 200 40 300 70"
              fill="none"
              stroke="#26C6DA"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.7"
            />

            {/* Location Pin 1 (Left) */}
            <g transform="translate(90, 80) scale(0.85)">
              <path
                fill="#26C6DA"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              />
            </g>

            {/* Location Pin 2 (Right) */}
            <g transform="translate(295, 60) scale(0.85)">
              <path
                fill="#26C6DA"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              />
            </g>
          </svg>
        </div>

        {/* Bottom Pagination Dots */}
        <div className="flex items-center justify-center space-x-2.5 pt-4 pb-2">
          <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
          <div className="w-2 h-2 bg-white/60 rounded-full" />
          <div className="w-1.5 h-1.5 bg-white/35 rounded-full" />
        </div>
      </div>

    </div>
  );
};

