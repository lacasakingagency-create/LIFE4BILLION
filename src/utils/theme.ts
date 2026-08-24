/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeColorId = 'purple' | 'orange' | 'navy' | 'dark_green' | 'dark_gray';

export interface ThemeColorOption {
  id: ThemeColorId;
  namePt: string;
  nameEn: string;
  nameEs: string;
  hex: string;
  hoverHex: string;
  borderHex: string;
  bgTailwind: string;
}

export const THEME_COLOR_OPTIONS: ThemeColorOption[] = [
  {
    id: 'navy',
    namePt: 'Azul Marinho',
    nameEn: 'Navy',
    nameEs: 'Azul Marino',
    hex: '#1B2A4A',
    hoverHex: '#233761',
    borderHex: '#2A406C',
    bgTailwind: 'bg-[#1B2A4A]',
  },
  {
    id: 'purple',
    namePt: 'Roxo',
    nameEn: 'Purple',
    nameEs: 'Púrpura',
    hex: '#8E2A8B',
    hoverHex: '#A2329E',
    borderHex: '#B23BB0',
    bgTailwind: 'bg-[#8E2A8B]',
  },
  {
    id: 'orange',
    namePt: 'Laranja',
    nameEn: 'Orange',
    nameEs: 'Naranja',
    hex: '#F0400C',
    hoverHex: '#FF4D19',
    borderHex: '#FF5C29',
    bgTailwind: 'bg-[#F0400C]',
  },
  {
    id: 'dark_green',
    namePt: 'Verde Escuro',
    nameEn: 'Dark Green',
    nameEs: 'Verde Oscuro',
    hex: '#1C4A32',
    hoverHex: '#245E40',
    borderHex: '#2C704D',
    bgTailwind: 'bg-[#1C4A32]',
  },
  {
    id: 'dark_gray',
    namePt: 'Cinza Escuro',
    nameEn: 'Dark Gray',
    nameEs: 'Gris Oscuro',
    hex: '#343434',
    hoverHex: '#424242',
    borderHex: '#505050',
    bgTailwind: 'bg-[#343434]',
  },
];

export const DEFAULT_THEME_COLOR_ID: ThemeColorId = 'navy';

export interface ThemeChartPalette {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  highlightText: string;
  border: string;
}

export function getThemeChartPalette(id: string | null | undefined, isLight = false): ThemeChartPalette {
  const themeId = (id || 'navy') as ThemeColorId;
  
  switch (themeId) {
    case 'purple':
      return {
        primary: isLight ? '#9333EA' : '#C084FC',
        primaryHover: '#A855F7',
        secondary: isLight ? '#8E2A8B' : '#7E22CE',
        accent: '#F59E0B',
        highlightText: isLight ? '#FFFFFF' : '#0F172A',
        border: isLight ? '#E9D5FF' : '#B23BB0',
      };
    case 'orange':
      return {
        primary: isLight ? '#EA580C' : '#FB923C',
        primaryHover: '#F97316',
        secondary: isLight ? '#9A3412' : '#C2410C',
        accent: '#FACC15',
        highlightText: isLight ? '#FFFFFF' : '#0F172A',
        border: isLight ? '#FED7AA' : '#FF5C29',
      };
    case 'dark_green':
      return {
        primary: isLight ? '#16A34A' : '#4ADE80',
        primaryHover: '#22C55E',
        secondary: isLight ? '#1C4A32' : '#15803D',
        accent: '#F59E0B',
        highlightText: isLight ? '#FFFFFF' : '#0F172A',
        border: isLight ? '#BBF7D0' : '#2C704D',
      };
    case 'dark_gray':
      return {
        primary: isLight ? '#475569' : '#94A3B8',
        primaryHover: '#64748B',
        secondary: isLight ? '#1E293B' : '#334155',
        accent: '#38BDF8',
        highlightText: isLight ? '#FFFFFF' : '#0F172A',
        border: isLight ? '#CBD5E1' : '#505050',
      };
    case 'navy':
    default:
      return {
        primary: isLight ? '#2563EB' : '#38BDF8',
        primaryHover: '#3B82F6',
        secondary: isLight ? '#1B2A4A' : '#1E3A8A',
        accent: '#F59E0B',
        highlightText: isLight ? '#FFFFFF' : '#0F172A',
        border: isLight ? '#CBD5E1' : '#2A406C',
      };
  }
}

export function getThemeColorById(id: string | null | undefined): ThemeColorOption {
  if (!id) return THEME_COLOR_OPTIONS[0]; // Navy default #1B2A4A
  const match = THEME_COLOR_OPTIONS.find(c => c.id === id);
  return match || THEME_COLOR_OPTIONS[0];
}

export function applyThemeColorToDOM(colorOption: ThemeColorOption) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--theme-primary', colorOption.hex);
    document.documentElement.style.setProperty('--theme-primary-hover', colorOption.hoverHex);
    document.documentElement.style.setProperty('--theme-primary-border', colorOption.borderHex);
  }
}
