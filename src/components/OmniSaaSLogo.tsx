import React from 'react';

interface OmniSaaSLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function OmniSaaSLogo({ className = '', size = 'md', showText = true }: OmniSaaSLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-2xl'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none relative ${className}`} id="life4billion-logo-container">
      <div className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center shrink-0`}>
        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
          <svg className="w-3/5 h-3/5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
      </div>
      {showText && (
        <span className={`font-black tracking-tight text-white font-sans ${textSizes[size]}`}>
          Life<span className="text-emerald-400">4</span>Billion
        </span>
      )}
    </div>
  );
}

