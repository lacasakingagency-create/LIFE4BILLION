import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Sparkles,
  Sliders,
  Palette,
  Type,
  LayoutGrid,
  Smartphone,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  L4BEmblem,
  L4BHorizontalLogo,
  L4BStackedLogo,
  L4BWordmark,
  L4BAppIcon,
  L4BFavicon,
  getRawSvgString
} from './Life4BillionBrand';
import officialLogoAsset from '../../assets/images/life4billion_logo_official_1789728215731.jpg';

interface BrandIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
  onShowNotification?: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

export default function BrandIdentityModal({
  isOpen,
  onClose,
  language = 'pt',
  onShowNotification
}: BrandIdentityModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'directions' | 'deliverables' | 'spec' | 'scale'>('directions');
  const [testScale, setTestScale] = useState<number>(48);

  if (!isOpen) return null;

  const isPt = language.startsWith('pt');

  const copySvg = (deliverableId: string, name: string) => {
    const svgCode = getRawSvgString(deliverableId);
    if (!svgCode) return;

    navigator.clipboard.writeText(svgCode);
    setCopiedId(deliverableId);
    setTimeout(() => setCopiedId(null), 2500);

    if (onShowNotification) {
      onShowNotification(
        isPt ? 'SVG Copiado!' : 'SVG Copied!',
        isPt
          ? `Código vetorial W3C de "${name}" copiado para a área de transferência.`
          : `Clean W3C vector SVG of "${name}" copied to clipboard.`,
        'success'
      );
    }
  };

  const downloadSvg = (deliverableId: string, filename: string) => {
    const svgCode = getRawSvgString(deliverableId);
    if (!svgCode) return;

    const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onShowNotification) {
      onShowNotification(
        isPt ? 'Download Iniciado!' : 'Download Started!',
        isPt
          ? `Arquivo ${filename}.svg pronto para Figma, Illustrator ou produção web.`
          : `File ${filename}.svg ready for Figma, Illustrator, or web production.`,
        'success'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-[#0A0A0E] border border-amber-500/30 rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl shadow-black my-6 flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#090A0D] via-[#0E1017] to-[#121118]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 shrink-0 bg-black">
              <img 
                src={officialLogoAsset} 
                alt="Life4Billion Official Asset" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-tight flex items-center">
                  Life<span className="text-[#E5A91A]">4</span>Billion
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full">
                  {isPt ? 'Manual de Marca Oficial' : 'Official Brand Manual'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isPt
                  ? 'Asset Oficial Fornecido (JPG 1024×1024) & Sistema de Marca'
                  : 'Official Provided Asset (1024×1024 JPG) & Brand System'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Tab navigation */}
            <div className="hidden md:flex bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab('directions')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'directions'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isPt ? '4 Direções Refinadas' : '4 Refined Directions'}</span>
              </button>
              <button
                onClick={() => setActiveTab('deliverables')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'deliverables'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isPt ? '9 Entregáveis Oficiais' : '9 Brand Deliverables'}</span>
              </button>
              <button
                onClick={() => setActiveTab('spec')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'spec'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isPt ? 'Diretrizes & Cores' : 'Specs & Guidelines'}</span>
              </button>
              <button
                onClick={() => setActiveTab('scale')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'scale'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isPt ? 'Escalabilidade' : 'Scalability'}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title={isPt ? 'Fechar manual' : 'Close modal'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

          {/* =========================================================================
              TAB 1: THE 4 REFINED DIRECTIONS (SIDE-BY-SIDE PRESENTATION)
             ========================================================================= */}
          {activeTab === 'directions' && (
            <div className="space-y-6">
              {/* OFFICIAL ASSET HIGHLIGHT CARD */}
              <div className="bg-[#121118] border-2 border-amber-500/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-2xl bg-black shrink-0">
                      <img 
                        src={officialLogoAsset} 
                        alt="Life4Billion Official Asset Provided by User" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black rounded-md">
                          {isPt ? 'Asset Oficial Implementado' : 'Official Implemented Asset'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">1024 × 1024 JPG</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        {isPt ? 'Logotipo Oficial Life4Billion' : 'Life4Billion Official Logotype'}
                      </h3>
                      <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                        {isPt 
                          ? 'Arquivo original fornecido implementado diretamente na aplicação (cabeçalhos, navegação lateral, tela de login, splash screen e favicon) com 100% de preservação visual.'
                          : 'Official provided asset integrated directly across the application (headers, sidebar navigation, login view, splash screen, and favicon) with 100% visual fidelity.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href={officialLogoAsset}
                      download="life4billion-official-logo.jpg"
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isPt ? 'Baixar Asset Original' : 'Download Original Asset'}</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-950/30 via-amber-900/15 to-transparent border border-amber-500/30 rounded-2xl p-5 flex items-start space-x-4">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed space-y-1">
                  <div className="font-bold text-amber-300 text-sm">
                    {isPt ? 'As 4 Direções Refinadas da Marca Life4Billion' : 'The 4 Refined Directions of the Life4Billion Identity'}
                  </div>
                  <p>
                    {isPt
                      ? 'Baseadas estritamente na identidade de referência (Preto + Branco + Ouro) e refinadas para um padrão de simplicidade no nível da Apple com sofisticação de fintech global. O monograma L4B integra sutilmente as letras L e B com o "4" dourado como protagonista visual indiscutível.'
                      : 'Derived directly from the primary visual reference (Black + White + Gold) and elevated to an Apple-level standard of minimalism and SaaS precision. The L4B monogram unifies L and B with the golden "4" as the clear visual protagonist.'}
                  </p>
                </div>
              </div>

              {/* 4 Directions Grid (2x2 on desktop, stacked on mobile) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* DIRECTION 1: L4B MONOGRAM */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/40 transition group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          {isPt ? 'Direção 1: Monograma L4B' : 'Direction 1: L4B Monogram'}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                        {isPt ? 'Símbolo Puro' : 'Pure Symbol'}
                      </span>
                    </div>

                    <div className="h-44 bg-[#08080A] rounded-xl flex items-center justify-center p-6 border border-white/5 shadow-inner">
                      <L4BEmblem size={84} variant="dark" />
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-white">
                        {isPt ? 'Símbolo Geométrico Integrado' : 'Integrated Geometric Monogram'}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {isPt
                          ? 'O "4" em ouro 18k atua como protagonista central e vetor de tração. O "L" e o "B" em branco puro ancoram a composição em um único bloco arquitetônico sem ornamentos excessivos.'
                          : 'The "4" in 18k gold is the undisputed protagonist. The "L" and "B" in clean white anchor the composition into one cohesive architectural mark.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">ViewBox 340×220</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => copySvg('standalone-icon-dark', 'Monograma L4B')}
                        className="p-1.5 bg-white/5 hover:bg-white/15 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition"
                      >
                        {copiedId === 'standalone-icon-dark' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">SVG</span>
                      </button>
                      <button
                        onClick={() => downloadSvg('standalone-icon-dark', 'life4billion-monogram-l4b')}
                        className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs flex items-center gap-1 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Download</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* DIRECTION 2: SYMBOL + WORDMARK */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/40 transition group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          {isPt ? 'Direção 2: Símbolo + Wordmark' : 'Direction 2: Symbol + Wordmark'}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                        {isPt ? 'Logo Primário SaaS' : 'Primary SaaS Logo'}
                      </span>
                    </div>

                    <div className="h-44 bg-[#08080A] rounded-xl flex items-center justify-center p-6 border border-white/5 shadow-inner">
                      <L4BHorizontalLogo height={44} variant="dark" />
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-white">
                        {isPt ? 'Assinatura Horizontal Primária' : 'Primary Horizontal Signature'}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {isPt
                          ? 'Símbolo L4B à esquerda em harmonia óptica com a tipografia "Life4Billion". Otimizado para cabeçalhos de produtos web, barras laterais de dashboards e interfaces digitais.'
                          : 'L4B symbol on the left in optical balance with "Life4Billion". Optimized for web application headers, dashboard sidebars, and software interfaces.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">ViewBox 680×140</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => copySvg('primary-horizontal-dark', 'Logo Horizontal')}
                        className="p-1.5 bg-white/5 hover:bg-white/15 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition"
                      >
                        {copiedId === 'primary-horizontal-dark' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">SVG</span>
                      </button>
                      <button
                        onClick={() => downloadSvg('primary-horizontal-dark', 'life4billion-logo-horizontal')}
                        className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs flex items-center gap-1 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Download</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* DIRECTION 3: APP ICON */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/40 transition group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          {isPt ? 'Direção 3: App Icon' : 'Direction 3: App Icon'}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                        {isPt ? 'Mobile Squircle' : 'Mobile Squircle'}
                      </span>
                    </div>

                    <div className="h-44 bg-[#08080A] rounded-xl flex items-center justify-center p-6 border border-white/5 shadow-inner">
                      <L4BAppIcon size={108} variant="standard" />
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-white">
                        {isPt ? 'Ícone de Aplicativo Mobile & Desktop' : 'Mobile & Desktop App Icon'}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {isPt
                          ? 'Super-elipse (squircle) com curvatura de 22.5% padrão iOS/Android. Fundo preto obsidiana profundo com o monograma centralizado e sutil brilho ambiente de luxo.'
                          : 'Squircle with 22.5% iOS/Android standard curvature. Deep obsidian black canvas with the centered L4B monogram and subtle ambient luxury aura.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">512×512 HD</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => copySvg('app-icon', 'App Icon')}
                        className="p-1.5 bg-white/5 hover:bg-white/15 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition"
                      >
                        {copiedId === 'app-icon' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">SVG</span>
                      </button>
                      <button
                        onClick={() => downloadSvg('app-icon', 'life4billion-app-icon')}
                        className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs flex items-center gap-1 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Download</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* DIRECTION 4: PURE WORDMARK */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/40 transition group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          {isPt ? 'Direção 4: Wordmark Puro' : 'Direction 4: Pure Wordmark'}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                        {isPt ? 'Tipografia Pura' : 'Pure Typography'}
                      </span>
                    </div>

                    <div className="h-44 bg-[#08080A] rounded-xl flex items-center justify-center p-6 border border-white/5 shadow-inner">
                      <L4BWordmark fontSize={38} variant="dark" />
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-white">
                        {isPt ? 'Identidade Tipográfica Escrita' : 'Refined Typographic Mark'}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {isPt
                          ? 'Grafia rigorosa "Life4Billion" sem espaços ou sufixos. "Life" e "Billion" em branco e o número "4" destacado em ouro nobre com peso 900 e tracking de -0.035em.'
                          : 'Strict "Life4Billion" single-word spelling. "Life" and "Billion" in white, with the central "4" illuminated in noble gold at 900 weight and -0.035em tracking.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">ViewBox 460×80</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => copySvg('pure-wordmark-dark', 'Wordmark Puro')}
                        className="p-1.5 bg-white/5 hover:bg-white/15 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition"
                      >
                        {copiedId === 'pure-wordmark-dark' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">SVG</span>
                      </button>
                      <button
                        onClick={() => downloadSvg('pure-wordmark-dark', 'life4billion-wordmark')}
                        className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs flex items-center gap-1 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Download</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: THE 9 OFFICIAL BRAND DELIVERABLES
             ========================================================================= */}
          {activeTab === 'deliverables' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    {isPt ? 'Os 9 Entregáveis da Identidade Visual' : 'The 9 Official Brand Deliverables'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isPt
                      ? 'Arquivos vetoriais W3C prontos para produção comercial, web, mobile, gráfica e mídia social.'
                      : 'W3C-standard vector assets ready for commercial production, web, mobile, print, and marketing.'}
                  </p>
                </div>
              </div>

              {/* GRID OF 9 DELIVERABLES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* 1. Primary Logo (Horizontal) */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        1. Primary Logo
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copySvg('primary-horizontal-dark', '1. Primary Logo')}
                          className="p-1 bg-white/5 hover:bg-white/15 text-slate-300 rounded text-xs"
                          title="Copiar SVG"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => downloadSvg('primary-horizontal-dark', '01-primary-logo-horizontal')}
                          className="p-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs"
                          title="Download SVG"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="h-28 bg-[#08080A] rounded-xl flex items-center justify-center p-3 border border-white/5">
                      <L4BHorizontalLogo height={34} variant="dark" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2.5">
                      {isPt ? 'Composição horizontal oficial: Símbolo L4B à esquerda + Wordmark.' : 'Official horizontal composition: L4B mark on the left + Wordmark.'}
                    </p>
                  </div>
                </div>

                {/* 2. Secondary Logo (Stacked) */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        2. Secondary Logo
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copySvg('secondary-stacked-dark', '2. Secondary Logo')}
                          className="p-1 bg-white/5 hover:bg-white/15 text-slate-300 rounded text-xs"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => downloadSvg('secondary-stacked-dark', '02-secondary-logo-stacked')}
                          className="p-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="h-28 bg-[#08080A] rounded-xl flex items-center justify-center p-2 border border-white/5">
                      <L4BStackedLogo emblemSize={38} variant="dark" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2.5">
                      {isPt ? 'Composição vertical centrada: Símbolo acima do nome para telas de login e splash.' : 'Centered vertical composition: Symbol above wordmark for login & splash screens.'}
                    </p>
                  </div>
                </div>

                {/* 3. Standalone Icon */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        3. Standalone Icon
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copySvg('standalone-icon-dark', '3. Standalone Icon')}
                          className="p-1 bg-white/5 hover:bg-white/15 text-slate-300 rounded text-xs"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => downloadSvg('standalone-icon-dark', '03-standalone-icon')}
                          className="p-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="h-28 bg-[#08080A] rounded-xl flex items-center justify-center p-3 border border-white/5">
                      <L4BEmblem size={56} variant="dark" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2.5">
                      {isPt ? 'Monograma puro L4B para avatares, carimbos, favicons e elementos de UI.' : 'Pure L4B monogram for profile avatars, watermarks, stamps, and UI elements.'}
                    </p>
                  </div>
                </div>

                {/* 4. Pure Wordmark */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        4. Wordmark
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copySvg('pure-wordmark-dark', '4. Wordmark')}
                          className="p-1 bg-white/5 hover:bg-white/15 text-slate-300 rounded text-xs"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => downloadSvg('pure-wordmark-dark', '04-wordmark')}
                          className="p-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="h-28 bg-[#08080A] rounded-xl flex items-center justify-center p-3 border border-white/5">
                      <L4BWordmark fontSize={24} variant="dark" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2.5">
                      {isPt ? 'Tipografia isolada "Life4Billion" com o 4 dourado sem outros elementos.' : 'Isolated "Life4Billion" typography with golden 4, no extra decorations.'}
                    </p>
                  </div>
                </div>

                {/* 5. Dark-Background Version */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        5. Dark Background
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copySvg('primary-horizontal-dark', '5. Dark Background')}
                          className="p-1 bg-white/5 hover:bg-white/15 text-slate-300 rounded text-xs"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => downloadSvg('primary-horizontal-dark', '05-dark-background-version')}
                          className="p-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="h-28 bg-[#000000] rounded-xl flex items-center justify-center p-3 border border-white/10">
                      <L4BHorizontalLogo height={32} variant="dark" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2.5">
                      {isPt ? 'Ouro 18k e branco puro contrastados sobre preto absoluto (#000000 / #08080A).' : '18k gold and pure white balanced on deep black (#000000 / #08080A).'}
                    </p>
                  </div>
                </div>

                {/* 6. Light-Background Version */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        6. Light Background
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copySvg('primary-horizontal-light', '6. Light Background')}
                          className="p-1 bg-white/5 hover:bg-white/15 text-slate-300 rounded text-xs"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => downloadSvg('primary-horizontal-light', '06-light-background-version')}
                          className="p-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="h-28 bg-white rounded-xl flex items-center justify-center p-3 border border-slate-300">
                      <L4BHorizontalLogo height={32} variant="light" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2.5">
                      {isPt ? 'Tipografia preta profunda (#0B0B0E) e ouro de alto contraste para fundos claros.' : 'Deep black (#0B0B0E) and high-contrast gold tuned for light backdrops.'}
                    </p>
                  </div>
                </div>

                {/* 7. Monochrome Versions */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        7. Monochrome
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copySvg('mono-black', '7. Monochrome')}
                          className="p-1 bg-white/5 hover:bg-white/15 text-slate-300 rounded text-xs"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => downloadSvg('mono-black', '07-monochrome-version')}
                          className="p-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="h-28 bg-white rounded-xl flex items-center justify-center p-3 border border-slate-300">
                      <L4BHorizontalLogo height={32} variant="mono-black" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2.5">
                      {isPt ? '100% preto sólido (#000000) e 100% branco para impressão e carimbos.' : '100% solid black and pure white for monochrome printing and engraving.'}
                    </p>
                  </div>
                </div>

                {/* 8. App Icon Version */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        8. App Icon
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copySvg('app-icon', '8. App Icon')}
                          className="p-1 bg-white/5 hover:bg-white/15 text-slate-300 rounded text-xs"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => downloadSvg('app-icon', '08-app-icon-squircle')}
                          className="p-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="h-28 bg-[#08080A] rounded-xl flex items-center justify-center p-3 border border-white/5">
                      <L4BAppIcon size={64} variant="standard" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2.5">
                      {isPt ? 'Squircle móvel com o monograma L4B centrado para App Store e Google Play.' : 'Mobile squircle featuring the centered L4B monogram for App Store & Google Play.'}
                    </p>
                  </div>
                </div>

                {/* 9. Favicon Version */}
                <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        9. Favicon Version
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copySvg('favicon-32', '9. Favicon Version')}
                          className="p-1 bg-white/5 hover:bg-white/15 text-slate-300 rounded text-xs"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => downloadSvg('favicon-32', '09-favicon-suite')}
                          className="p-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="h-28 bg-[#08080A] rounded-xl flex items-center justify-center gap-4 p-3 border border-white/5">
                      <div className="flex flex-col items-center gap-1">
                        <L4BFavicon size={16} />
                        <span className="text-[8px] text-slate-500 font-mono">16px</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <L4BFavicon size={24} />
                        <span className="text-[8px] text-slate-500 font-mono">24px</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <L4BFavicon size={32} />
                        <span className="text-[8px] text-slate-500 font-mono">32px</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2.5">
                      {isPt ? 'Otimizado para legibilidade micro-óptica em abas de navegadores web.' : 'Optimized for micro-optical recognition in modern browser tabs.'}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: SPECIFICATIONS & GUIDELINES
             ========================================================================= */}
          {activeTab === 'spec' && (
            <div className="space-y-6">
              {/* BRAND STORY & PHILOSOPHY */}
              <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  {isPt ? 'Pilares & Arquitetura da Marca' : 'Brand Positioning & Pillars'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-1.5">
                    <div className="text-white font-bold text-sm">L — Life & Longevidade</div>
                    <p className="text-slate-400 leading-relaxed">
                      {isPt
                        ? 'Fundação estrutural sólida. Representa disciplina financeira, controle sobre a própria vida e proteção patrimonial inabalável.'
                        : 'Solid structural foundation. Represents financial control, mastery over one\'s life, and long-term asset protection.'}
                    </p>
                  </div>
                  <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl space-y-1.5">
                    <div className="text-amber-300 font-bold text-sm">4 — Protagonista & Crescimento</div>
                    <p className="text-slate-300 leading-relaxed">
                      {isPt
                        ? 'O elemento central em ouro. Atua como vetor ascendente de crescimento, tração e ambição. Conecta as 4 dimensões de riqueza: Finanças, Hábitos, Conhecimento e Tempo.'
                        : 'The core golden protagonist. Serves as an ascending growth vector connecting the 4 pillars of true wealth: Capital, Habits, Knowledge, and Time.'}
                    </p>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-1.5">
                    <div className="text-white font-bold text-sm">B — Billion & Escala</div>
                    <p className="text-slate-400 leading-relaxed">
                      {isPt
                        ? 'Curvatura geométrica dupla. Simboliza escala exponencial, prosperidade geracional e impacto para bilhões de vidas.'
                        : 'Balanced dual geometric loops. Represents exponential scale, generational wealth, and impact for billions of lives.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* COLOR PALETTE */}
              <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  {isPt ? 'Paleta Cromática Oficial (Preto + Branco + Ouro)' : 'Official Chromatic Palette'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Preto Obsidiana */}
                  <div className="bg-black/50 border border-white/10 p-4 rounded-xl space-y-3">
                    <div className="h-16 rounded-lg bg-[#08080A] border border-white/10 flex items-center justify-center">
                      <span className="text-xs font-mono font-bold text-white">#08080A</span>
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-white">Preto Obsidiana</div>
                      <div className="text-slate-400 font-mono text-[10px]">RGB: 8, 8, 10</div>
                      <div className="text-slate-500 text-[10px]">{isPt ? 'Fundo primordial de luxo e sobriedade' : 'Deep luxury primary background'}</div>
                    </div>
                  </div>

                  {/* Ouro 18K Protagonista */}
                  <div className="bg-black/50 border border-white/10 p-4 rounded-xl space-y-3">
                    <div className="h-16 rounded-lg bg-gradient-to-tr from-[#C99424] via-[#E5A91A] to-[#F5C448] flex items-center justify-center shadow-md">
                      <span className="text-xs font-mono font-bold text-black">#E5A91A</span>
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-amber-300">Ouro 18K Protagonista</div>
                      <div className="text-slate-400 font-mono text-[10px]">RGB: 229, 169, 26</div>
                      <div className="text-slate-500 text-[10px]">{isPt ? 'Cor do número 4 e vetor de crescimento' : 'The distinct color of the central 4'}</div>
                    </div>
                  </div>

                  {/* Ouro Dark/Light */}
                  <div className="bg-black/50 border border-white/10 p-4 rounded-xl space-y-3">
                    <div className="h-16 rounded-lg bg-[#BF8E1B] flex items-center justify-center">
                      <span className="text-xs font-mono font-bold text-white">#BF8E1B</span>
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-amber-400">Ouro Alto Contraste</div>
                      <div className="text-slate-400 font-mono text-[10px]">RGB: 191, 142, 27</div>
                      <div className="text-slate-500 text-[10px]">{isPt ? 'Legibilidade WCAG AA sobre fundos brancos' : 'WCAG AA legibility on light backdrops'}</div>
                    </div>
                  </div>

                  {/* Branco Puro */}
                  <div className="bg-black/50 border border-white/10 p-4 rounded-xl space-y-3">
                    <div className="h-16 rounded-lg bg-white flex items-center justify-center">
                      <span className="text-xs font-mono font-bold text-black">#FFFFFF</span>
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-white">Branco Puro</div>
                      <div className="text-slate-400 font-mono text-[10px]">RGB: 255, 255, 255</div>
                      <div className="text-slate-500 text-[10px]">{isPt ? 'Letras L e B, tipografia e contraste' : 'L & B letters, typography, clarity'}</div>
                    </div>
                  </div>

                </div>
              </div>

              {/* STRICT TYPOGRAPHY RULES */}
              <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Type className="w-4 h-4 text-amber-400" />
                  {isPt ? 'Regras Estritas de Tipografia da Marca' : 'Strict Typography Rules'}
                </h3>
                <div className="p-5 bg-black/60 rounded-xl border border-white/5 space-y-4">
                  <div className="text-3xl font-extrabold tracking-tight">
                    <span className="text-white">Life</span>
                    <span className="text-[#E5A91A] font-black">4</span>
                    <span className="text-white">Billion</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                    <div className="space-y-1.5">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        {isPt ? 'Grafia Correta (Única Autorizada)' : 'Approved Spelling (Single Word)'}
                      </div>
                      <p className="font-mono text-white text-sm bg-white/5 p-2 rounded border border-white/10">
                        Life4Billion
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        {isPt
                          ? 'Sempre uma única palavra contínua, sem espaços, sem hífen e sem símbolo de marca registrada.'
                          : 'Always written as a single unified word, without spaces, hyphens, or trademark symbols.'}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="font-bold text-rose-400 flex items-center gap-1.5">
                        <X className="w-3.5 h-3.5" />
                        {isPt ? 'Variações Proibidas' : 'Forbidden Variations'}
                      </div>
                      <ul className="text-slate-400 text-[11px] space-y-1 list-disc list-inside">
                        <li>Life 4 Billion (com espaços)</li>
                        <li>Life4 Billion</li>
                        <li>Life4B</li>
                        <li>Life Billion</li>
                        <li>Life4Billion™</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: SCALABILITY SIMULATOR & CONTEXT TESTING
             ========================================================================= */}
          {activeTab === 'scale' && (
            <div className="space-y-6">
              <div className="bg-[#0E0F14] border border-white/10 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    {isPt ? 'Simulador de Escalabilidade Vetorial' : 'Vector Scalability Simulator'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isPt
                      ? 'Arraste para testar a nitidez do monograma e do wordmark em qualquer escala (de 16px a 160px).'
                      : 'Drag the slider to inspect the geometric fidelity of the L4B mark at any resolution.'}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-400 font-mono">16px</span>
                  <input
                    type="range"
                    min={16}
                    max={160}
                    value={testScale}
                    onChange={(e) => setTestScale(Number(e.target.value))}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-xs text-amber-300 font-mono font-bold w-14 text-right">{testScale}px</span>
                </div>

                {/* Scaled Preview Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-8 bg-[#08080A] rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[220px]">
                    <L4BEmblem size={testScale} variant="dark" />
                    <span className="text-[10px] font-mono text-slate-500 mt-4">Dark Canvas (#08080A)</span>
                  </div>
                  <div className="p-8 bg-white rounded-2xl border border-slate-300 flex flex-col items-center justify-center min-h-[220px]">
                    <L4BEmblem size={testScale} variant="light" />
                    <span className="text-[10px] font-mono text-slate-500 mt-4">Light Canvas (#FFFFFF)</span>
                  </div>
                </div>

                {/* Real-World Context Mockups */}
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {isPt ? 'Simulações em Contextos Reais:' : 'Real-World Context Previews:'}
                  </span>
                  <div className="flex flex-wrap gap-4">
                    
                    {/* Browser Tab Preview */}
                    <div className="bg-[#14151D] border border-white/10 rounded-xl px-4 py-2.5 flex items-center space-x-2.5">
                      <L4BFavicon size={16} />
                      <span className="text-xs text-slate-300 font-medium">Life4Billion — Operating System</span>
                      <span className="text-xs text-slate-500 ml-2">×</span>
                    </div>

                    {/* App Header Preview */}
                    <div className="bg-[#08080A] border border-white/10 rounded-xl px-4 py-2 flex items-center space-x-3">
                      <L4BHorizontalLogo height={24} variant="dark" />
                      <div className="w-1 h-3 bg-white/10 rounded-full" />
                      <span className="text-[11px] text-slate-400">Dashboard</span>
                    </div>

                    {/* Mobile App Icon */}
                    <div className="flex items-center space-x-2.5 bg-black/40 border border-white/5 rounded-xl px-3 py-1.5">
                      <L4BAppIcon size={36} />
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">Life4Billion</div>
                        <div className="text-[9px] text-slate-400">Mobile iOS</div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#08080A] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {isPt
                ? 'Todos os arquivos em formato vetorial SVG padrão W3C (infinitamente escaláveis).'
                : 'All brand deliverables generated in W3C-standard vector SVG (infinitely scalable).'}
            </span>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => copySvg('primary-horizontal-dark', 'Logo Principal')}
              className="flex-1 sm:flex-initial px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>{isPt ? 'Copiar SVG Primário' : 'Copy Primary SVG'}</span>
            </button>
            <button
              onClick={() => downloadSvg('primary-horizontal-dark', 'life4billion-official-master-logo')}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-950/40 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isPt ? 'Baixar SVG Master' : 'Download Master SVG'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
