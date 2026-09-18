import React from 'react';
import officialLogoAsset from '../assets/images/life4billion_logo_official_1789728215731.jpg';

interface OmniSaaSLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
}

export default function OmniSaaSLogo({
  className = '',
  size = 'md',
  showText = true,
  variant = 'dark'
}: OmniSaaSLogoProps) {
  // Proportional sizing strictly preserving 100% of the original logo asset
  const iconDimensions = {
    sm: { width: 32, height: 32 },
    md: { width: 42, height: 42 },
    lg: { width: 56, height: 56 },
    xl: { width: 72, height: 72 }
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const isLight = variant === 'light';
  const { width, height } = iconDimensions[size];

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none relative ${className}`}
      id="life4billion-logo-container"
    >
      {/* Official Provided Logo Asset Image */}
      <div 
        className="relative shrink-0 flex items-center justify-center overflow-hidden rounded-xl"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <img
          src={officialLogoAsset}
          alt="Life4Billion Official Logo"
          width={width}
          height={height}
          className="w-full h-full object-contain pointer-events-none"
          loading="eager"
          decoding="async"
        />
      </div>

      {showText && (
        <span
          className={`font-black tracking-tight font-sans ${textSizes[size]} ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          Life<span className="text-[#E5A91A]">4</span>Billion
        </span>
      )}
    </div>
  );
}


