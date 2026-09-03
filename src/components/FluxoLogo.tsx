import React from 'react';

interface FluxoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  showSubtitle?: boolean;
}

export const FluxoIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 36,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      id="fluxo-app-icon-svg"
    >
      <defs>
        {/* Background shadow & glow */}
        <radialGradient id="fluxoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>

        {/* Outer squircle gradient */}
        <linearGradient id="squircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d2ff" />
          <stop offset="35%" stopColor="#2563eb" />
          <stop offset="75%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        {/* Inner checkmark gradient */}
        <linearGradient id="checkGrad" x1="15%" y1="20%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="45%" stopColor="#2563eb" />
          <stop offset="85%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        {/* Shadow filter for 3D ribbon depth */}
        <filter id="ribbonShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#020617" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Subtle outer glow */}
      <circle cx="50" cy="50" r="48" fill="url(#fluxoGlow)" />

      {/* Main squircle body */}
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="26"
        fill="#0f172a"
        stroke="url(#squircleGrad)"
        strokeWidth="4"
      />

      {/* Glowing inner shadow layer */}
      <rect
        x="12"
        y="12"
        width="76"
        height="76"
        rx="24"
        fill="none"
        stroke="url(#squircleGrad)"
        strokeWidth="1.5"
        opacity="0.35"
      />

      {/* Dynamic continuous checkmark ribbon loop */}
      {/* Outer ribbon loop */}
      <path
        d="M26 48 C 26 35, 36 25, 49 25 C 62 25, 71 34, 71 46"
        stroke="url(#squircleGrad)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
        filter="url(#ribbonShadow)"
      />
      
      {/* Bottom loop curving into checkmark */}
      <path
        d="M26 48 C 26 62, 36 73, 50 73 C 64 73, 73 63, 73 50"
        stroke="url(#squircleGrad)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
        filter="url(#ribbonShadow)"
      />

      {/* The sharp prominent checkmark */}
      <path
        d="M38 51 L 49 62 L 73 34"
        stroke="url(#checkGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#ribbonShadow)"
      />
    </svg>
  );
};

export const FluxoLogo: React.FC<FluxoLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  showSubtitle = true,
}) => {
  const iconSizes = {
    sm: 28,
    md: 38,
    lg: 48,
    xl: 64,
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const currentIconSize = iconSizes[size];

  if (variant === 'icon') {
    return <FluxoIcon size={currentIconSize} className={className} />;
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-3 py-1.5 text-white shadow-md shadow-neutral-950/20 border border-neutral-800 ${className}`}>
        <FluxoIcon size={24} />
        <span className="font-extrabold tracking-tight text-white text-sm">Fluxo</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`} id="fluxo-app-brand-logo">
      <div className="relative flex items-center justify-center drop-shadow-md">
        <FluxoIcon size={currentIconSize} />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight text-neutral-900 dark:text-white ${titleSizes[size]}`}>
            Fluxo
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
            Planeje <span className="text-blue-500">•</span> Organize <span className="text-purple-500">•</span> Conquiste
          </span>
        )}
      </div>
    </div>
  );
};

export const FluxoEmblemImage: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => {
  return (
    <img
      src="/fluxo-logo.jpg"
      alt="Fluxo - Planeje • Organize • Conquiste"
      className={`rounded-2xl object-cover shadow-sm ${className}`}
      style={{ width: size, height: size }}
      referrerPolicy="no-referrer"
    />
  );
};
