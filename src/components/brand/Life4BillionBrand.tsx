import React from 'react';

export type BrandVariant = 'dark' | 'light' | 'mono-black' | 'mono-white' | 'gold-only';

interface EmblemProps {
  size?: number | string;
  variant?: BrandVariant;
  className?: string;
  idPrefix?: string;
}

/**
 * Mathematical Vector Geometry for the Official Life4Billion L4B Monogram
 *
 * ViewBox: 0 0 340 220
 * Cap Height: 180px (y = 20 to y = 200)
 * Uniform Stem Width: 36px (consistent geometric line weight)
 *
 * Architectural Harmony:
 * - L: Solid vertical stem + horizontal base (M20 20 H56 V164 H124 V200 H20 Z)
 * - 4: Central gold protagonist. Top apex at x=156, y=20.
 *      Diagonal enters directly into the nook of the L (x=80, y=148).
 *      Horizontal crossbar spans x=80 to 216 (passing 24px past the vertical stem).
 *      Vertical stem descends through baseline y=200.
 *      Inner triangular counter: M156 60 L108 112 H156 V60 Z.
 * - B: Vertical spine at x=228 to 264. Dual balanced rounded loops.
 *      Upper loop (y: 20-106), lower loop (y: 106-200).
 *      Smooth geometric beziers with optical counter cutouts.
 */
export const L4BEmblem: React.FC<EmblemProps> = ({
  size = 48,
  variant = 'dark',
  className = '',
  idPrefix = 'l4b'
}) => {
  const gradId = `${idPrefix}-gold-grad`;
  const gradLightId = `${idPrefix}-gold-grad-light`;

  const getColors = () => {
    switch (variant) {
      case 'light':
        return {
          letterColor: '#0B0B0E',
          goldFill: `url(#${gradLightId})`,
          solidGold: '#C59324'
        };
      case 'mono-black':
        return {
          letterColor: '#000000',
          goldFill: '#000000',
          solidGold: '#000000'
        };
      case 'mono-white':
        return {
          letterColor: '#FFFFFF',
          goldFill: '#FFFFFF',
          solidGold: '#FFFFFF'
        };
      case 'gold-only':
        return {
          letterColor: `url(#${gradId})`,
          goldFill: `url(#${gradId})`,
          solidGold: '#E5A91A'
        };
      case 'dark':
      default:
        return {
          letterColor: '#FFFFFF',
          goldFill: `url(#${gradId})`,
          solidGold: '#E5A91A'
        };
    }
  };

  const colors = getColors();

  return (
    <svg
      viewBox="0 0 340 220"
      width={typeof size === 'number' ? (size * 340) / 220 : size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="Life4Billion L4B Monogram"
    >
      <defs>
        {/* Official 18k Champagne/Amber Gold Gradient for Dark Backgrounds */}
        <linearGradient id={gradId} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#C99424" />
          <stop offset="35%" stopColor="#E5A91A" />
          <stop offset="70%" stopColor="#F5C448" />
          <stop offset="100%" stopColor="#D4991F" />
        </linearGradient>

        {/* High-Contrast Luxury Gold Gradient for Light/White Backgrounds */}
        <linearGradient id={gradLightId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#996F12" />
          <stop offset="45%" stopColor="#BF8E1B" />
          <stop offset="100%" stopColor="#A87814" />
        </linearGradient>
      </defs>

      {/* L — Pure White / Black */}
      <path
        d="M20 20 H56 V164 H124 V200 H20 Z"
        fill={colors.letterColor}
      />

      {/* 4 — Central Gold Protagonist */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M156 20 L80 148 H156 V200 H192 V148 H216 V112 H192 V20 H156 Z M156 60 L108 112 H156 V60 Z"
        fill={colors.goldFill}
      />

      {/* B — Pure White / Black */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M228 20 H282 C302 20 316 34 316 62 C316 80 304 94 288 102 C308 108 320 124 320 152 C320 182 302 200 280 200 H228 V20 Z M264 54 V76 H280 C288 76 292 70 292 65 C292 60 288 54 280 54 H264 Z M264 126 V166 H282 C291 166 296 157 296 146 C296 135 291 126 282 126 H264 Z"
        fill={colors.letterColor}
      />
    </svg>
  );
};

interface WordmarkProps {
  fontSize?: number;
  variant?: BrandVariant;
  className?: string;
}

/**
 * Pure Wordmark: Life4Billion
 * Strict spelling: Life4Billion (no spaces, no TM)
 * Life: White / Dark
 * 4: Gold accent
 * Billion: White / Dark
 */
export const L4BWordmark: React.FC<WordmarkProps> = ({
  fontSize = 24,
  variant = 'dark',
  className = ''
}) => {
  const isLight = variant === 'light' || variant === 'mono-black';
  const isMonoWhite = variant === 'mono-white';

  const textColor = isLight ? '#0B0B0E' : '#FFFFFF';
  const goldColor = isLight ? '#BF8E1B' : '#E5A91A';

  return (
    <span
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        letterSpacing: '-0.035em',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
      className={`font-extrabold tracking-tight select-none inline-flex items-center ${className}`}
      aria-label="Life4Billion"
    >
      <span style={{ color: isMonoWhite ? '#FFFFFF' : textColor }}>Life</span>
      <span
        style={{
          color: isMonoWhite ? '#FFFFFF' : variant === 'mono-black' ? '#000000' : goldColor,
          fontWeight: 900
        }}
      >
        4
      </span>
      <span style={{ color: isMonoWhite ? '#FFFFFF' : textColor }}>Billion</span>
    </span>
  );
};

interface HorizontalLogoProps {
  height?: number;
  variant?: BrandVariant;
  className?: string;
  showWordmark?: boolean;
}

/**
 * 1. Primary Logo: Horizontal Composition (Symbol + Wordmark)
 */
export const L4BHorizontalLogo: React.FC<HorizontalLogoProps> = ({
  height = 36,
  variant = 'dark',
  className = '',
  showWordmark = true
}) => {
  const emblemHeight = height;
  const fontSize = height * 0.68;

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      style={{ height }}
      aria-label="Life4Billion Primary Logo"
    >
      <L4BEmblem size={emblemHeight} variant={variant} />
      {showWordmark && (
        <L4BWordmark fontSize={fontSize} variant={variant} />
      )}
    </div>
  );
};

interface StackedLogoProps {
  emblemSize?: number;
  variant?: BrandVariant;
  className?: string;
}

/**
 * 2. Secondary Logo: Stacked Composition (Symbol Centered Above Wordmark)
 */
export const L4BStackedLogo: React.FC<StackedLogoProps> = ({
  emblemSize = 64,
  variant = 'dark',
  className = ''
}) => {
  const fontSize = emblemSize * 0.42;

  return (
    <div
      className={`inline-flex flex-col items-center gap-3 select-none text-center ${className}`}
      aria-label="Life4Billion Stacked Logo"
    >
      <L4BEmblem size={emblemSize} variant={variant} />
      <L4BWordmark fontSize={fontSize} variant={variant} />
    </div>
  );
};

interface AppIconProps {
  size?: number;
  variant?: 'standard' | 'light' | 'mono';
  className?: string;
}

/**
 * 3. App Icon: Squircle Mobile Icon (iOS / Android 22.5% Curvature)
 */
export const L4BAppIcon: React.FC<AppIconProps> = ({
  size = 96,
  variant = 'standard',
  className = ''
}) => {
  const isLight = variant === 'light';
  const cornerRadius = size * 0.225;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: cornerRadius
      }}
      className={`relative flex items-center justify-center overflow-hidden shrink-0 shadow-2xl transition-transform ${
        isLight
          ? 'bg-white border border-slate-200 text-black shadow-slate-300'
          : 'bg-[#08080A] border border-white/10 shadow-black'
      } ${className}`}
      aria-label="Life4Billion App Icon"
    >
      {/* Subtle luxury ambient highlight */}
      {!isLight && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: 'radial-gradient(circle at 50% 25%, rgba(229, 169, 26, 0.25) 0%, transparent 70%)'
          }}
        />
      )}

      {/* L4B Central Monogram scaled optically */}
      <L4BEmblem
        size={size * 0.48}
        variant={isLight ? 'light' : variant === 'mono' ? 'mono-white' : 'dark'}
      />
    </div>
  );
};

interface FaviconProps {
  size?: number;
  className?: string;
}

/**
 * Favicon Component (Optimized for 16x16, 32x32, 48x48)
 */
export const L4BFavicon: React.FC<FaviconProps> = ({ size = 32, className = '' }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22
      }}
      className={`flex items-center justify-center bg-[#08080A] border border-white/10 shrink-0 ${className}`}
    >
      <L4BEmblem size={size * 0.58} variant="dark" />
    </div>
  );
};

/**
 * Raw SVG String Generator for 100% clean W3C exports / downloads
 */
export const getRawSvgString = (deliverableId: string): string => {
  const EMBLEM_PATHS = `
    <!-- L (White / Primary) -->
    <path d="M20 20 H56 V164 H124 V200 H20 Z" fill="VAR_LETTER_COLOR"/>
    <!-- 4 (Gold Protagonist) -->
    <path fill-rule="evenodd" clip-rule="evenodd" d="M156 20 L80 148 H156 V200 H192 V148 H216 V112 H192 V20 H156 Z M156 60 L108 112 H156 V60 Z" fill="VAR_GOLD_COLOR"/>
    <!-- B (White / Primary) -->
    <path fill-rule="evenodd" clip-rule="evenodd" d="M228 20 H282 C302 20 316 34 316 62 C316 80 304 94 288 102 C308 108 320 124 320 152 C320 182 302 200 280 200 H228 V20 Z M264 54 V76 H280 C288 76 292 70 292 65 C292 60 288 54 280 54 H264 Z M264 126 V166 H282 C291 166 296 157 296 146 C296 135 291 126 282 126 H264 Z" fill="VAR_LETTER_COLOR"/>
  `;

  const GOLD_GRADIENT_DARK = `
    <linearGradient id="l4b-gold-export" x1="30%" y1="0%" x2="70%" y2="100%">
      <stop offset="0%" stop-color="#C99424"/>
      <stop offset="35%" stop-color="#E5A91A"/>
      <stop offset="70%" stop-color="#F5C448"/>
      <stop offset="100%" stop-color="#D4991F"/>
    </linearGradient>
  `;

  const GOLD_GRADIENT_LIGHT = `
    <linearGradient id="l4b-gold-light-export" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#996F12"/>
      <stop offset="45%" stop-color="#BF8E1B"/>
      <stop offset="100%" stop-color="#A87814"/>
    </linearGradient>
  `;

  switch (deliverableId) {
    // 1. Primary Horizontal Logo (Dark)
    case 'primary-horizontal-dark':
    case 'horizontal-dark':
      return `<svg viewBox="0 0 680 140" width="680" height="140" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="680" height="140" fill="#08080A"/>
  <g transform="translate(36, 25) scale(0.41)">
    ${EMBLEM_PATHS.replace(/VAR_LETTER_COLOR/g, '#FFFFFF').replace(/VAR_GOLD_COLOR/g, 'url(#l4b-gold-export)')}
  </g>
  <text x="200" y="86" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" letter-spacing="-2">
    <tspan fill="#FFFFFF">Life</tspan><tspan fill="#E5A91A" font-weight="900">4</tspan><tspan fill="#FFFFFF">Billion</tspan>
  </text>
  <defs>
    ${GOLD_GRADIENT_DARK}
  </defs>
</svg>`;

    // Primary Horizontal Logo (Light)
    case 'primary-horizontal-light':
    case 'logo-white-bg':
      return `<svg viewBox="0 0 680 140" width="680" height="140" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="680" height="140" fill="#FFFFFF"/>
  <g transform="translate(36, 25) scale(0.41)">
    ${EMBLEM_PATHS.replace(/VAR_LETTER_COLOR/g, '#0B0B0E').replace(/VAR_GOLD_COLOR/g, 'url(#l4b-gold-light-export)')}
  </g>
  <text x="200" y="86" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" letter-spacing="-2">
    <tspan fill="#0B0B0E">Life</tspan><tspan fill="#BF8E1B" font-weight="900">4</tspan><tspan fill="#0B0B0E">Billion</tspan>
  </text>
  <defs>
    ${GOLD_GRADIENT_LIGHT}
  </defs>
</svg>`;

    // 2. Secondary Stacked Logo (Dark)
    case 'secondary-stacked-dark':
      return `<svg viewBox="0 0 400 360" width="400" height="360" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="360" fill="#08080A"/>
  <g transform="translate(98, 48) scale(0.6)">
    ${EMBLEM_PATHS.replace(/VAR_LETTER_COLOR/g, '#FFFFFF').replace(/VAR_GOLD_COLOR/g, 'url(#l4b-gold-export)')}
  </g>
  <text x="200" y="270" text-anchor="middle" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" letter-spacing="-1.5">
    <tspan fill="#FFFFFF">Life</tspan><tspan fill="#E5A91A" font-weight="900">4</tspan><tspan fill="#FFFFFF">Billion</tspan>
  </text>
  <defs>
    ${GOLD_GRADIENT_DARK}
  </defs>
</svg>`;

    // Secondary Stacked Logo (Light)
    case 'secondary-stacked-light':
      return `<svg viewBox="0 0 400 360" width="400" height="360" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="360" fill="#FFFFFF"/>
  <g transform="translate(98, 48) scale(0.6)">
    ${EMBLEM_PATHS.replace(/VAR_LETTER_COLOR/g, '#0B0B0E').replace(/VAR_GOLD_COLOR/g, 'url(#l4b-gold-light-export)')}
  </g>
  <text x="200" y="270" text-anchor="middle" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" letter-spacing="-1.5">
    <tspan fill="#0B0B0E">Life</tspan><tspan fill="#BF8E1B" font-weight="900">4</tspan><tspan fill="#0B0B0E">Billion</tspan>
  </text>
  <defs>
    ${GOLD_GRADIENT_LIGHT}
  </defs>
</svg>`;

    // 3. Standalone Icon (Pure L4B Symbol)
    case 'standalone-icon-dark':
    case 'symbol-isolated':
      return `<svg viewBox="0 0 340 220" width="340" height="220" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${EMBLEM_PATHS.replace(/VAR_LETTER_COLOR/g, '#FFFFFF').replace(/VAR_GOLD_COLOR/g, 'url(#l4b-gold-export)')}
  <defs>
    ${GOLD_GRADIENT_DARK}
  </defs>
</svg>`;

    case 'standalone-icon-light':
      return `<svg viewBox="0 0 340 220" width="340" height="220" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${EMBLEM_PATHS.replace(/VAR_LETTER_COLOR/g, '#0B0B0E').replace(/VAR_GOLD_COLOR/g, 'url(#l4b-gold-light-export)')}
  <defs>
    ${GOLD_GRADIENT_LIGHT}
  </defs>
</svg>`;

    // 4. Pure Wordmark
    case 'pure-wordmark-dark':
      return `<svg viewBox="0 0 460 80" width="460" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="460" height="80" fill="#08080A"/>
  <text x="30" y="55" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" letter-spacing="-2">
    <tspan fill="#FFFFFF">Life</tspan><tspan fill="#E5A91A" font-weight="900">4</tspan><tspan fill="#FFFFFF">Billion</tspan>
  </text>
</svg>`;

    case 'pure-wordmark-light':
      return `<svg viewBox="0 0 460 80" width="460" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="460" height="80" fill="#FFFFFF"/>
  <text x="30" y="55" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" letter-spacing="-2">
    <tspan fill="#0B0B0E">Life</tspan><tspan fill="#BF8E1B" font-weight="900">4</tspan><tspan fill="#0B0B0E">Billion</tspan>
  </text>
</svg>`;

    // 7. Monochrome Versions
    case 'mono-black':
      return `<svg viewBox="0 0 680 140" width="680" height="140" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(36, 25) scale(0.41)">
    ${EMBLEM_PATHS.replace(/VAR_LETTER_COLOR/g, '#000000').replace(/VAR_GOLD_COLOR/g, '#000000')}
  </g>
  <text x="200" y="86" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" letter-spacing="-2" fill="#000000">
    Life4Billion
  </text>
</svg>`;

    case 'mono-white':
      return `<svg viewBox="0 0 680 140" width="680" height="140" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(36, 25) scale(0.41)">
    ${EMBLEM_PATHS.replace(/VAR_LETTER_COLOR/g, '#FFFFFF').replace(/VAR_GOLD_COLOR/g, '#FFFFFF')}
  </g>
  <text x="200" y="86" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" letter-spacing="-2" fill="#FFFFFF">
    Life4Billion
  </text>
</svg>`;

    // 8. App Icon Version
    case 'app-icon':
      return `<svg viewBox="0 0 512 512" width="512" height="512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="115" fill="#08080A"/>
  <rect x="2" y="2" width="508" height="508" rx="113" stroke="rgba(255,255,255,0.08)" stroke-width="4"/>
  <g transform="translate(101, 156) scale(0.91)">
    ${EMBLEM_PATHS.replace(/VAR_LETTER_COLOR/g, '#FFFFFF').replace(/VAR_GOLD_COLOR/g, 'url(#l4b-gold-export)')}
  </g>
  <defs>
    ${GOLD_GRADIENT_DARK}
  </defs>
</svg>`;

    // 9. Favicon Versions
    case 'favicon':
    case 'favicon-32':
      return `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="7" fill="#08080A"/>
  <g transform="translate(5, 7.5) scale(0.065)">
    ${EMBLEM_PATHS.replace(/VAR_LETTER_COLOR/g, '#FFFFFF').replace(/VAR_GOLD_COLOR/g, '#E5A91A')}
  </g>
</svg>`;

    case 'favicon-16':
      return `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" rx="3.5" fill="#08080A"/>
  <g transform="translate(2.5, 3.8) scale(0.032)">
    ${EMBLEM_PATHS.replace(/VAR_LETTER_COLOR/g, '#FFFFFF').replace(/VAR_GOLD_COLOR/g, '#E5A91A')}
  </g>
</svg>`;

    default:
      return '';
  }
};
