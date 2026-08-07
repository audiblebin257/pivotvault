import React, { useState } from 'react';
import { clsx } from 'clsx';

// Helper: Normalize company name to find in logo map
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const logoMap = {
  "dopplerlabs": "/logos/doppler labs.jpg",
  "fab": "/logos/fab.webp",
  "googleplus": "/logos/google plus.png",
  "homejoy": "/logos/homejoy.png",
  "jawbone": "/logos/jawbone.png",
  "juicero": "/logos/juicero.png",
  "moviepass": "/logos/moviepass.png",
  "parse": "/logos/parse.jpg",
  "petscom": "/logos/pets.png",
  "pets": "/logos/pets.png",
  "pivatechnologies": "/logos/powa technologies.png",
  "powa": "/logos/powa technologies.png",
  "quibi": "/logos/quibi.webp",
  "rdio": "/logos/rdio.png",
  "secret": "/logos/secret.webp",
  "shyp": "/logos/shyp.png",
  "sprig": "/logos/sprig.png",
  "theranos": "/logos/theranos.png",
  "vine": "/logos/vine.png",
  "webvan": "/logos/webvan.jpg",
  "yikyak": "/logos/yik yak.png",
  "zirtual": "/logos/zirtual.jpg",
  // New logos
  "aereo": "/logos/aereo.png",
  "airware": "/logos/airware.jpg",
  "beepi": "/logos/beepi.jpg",
  "betterplace": "/logos/betterplace.jpg",
  "better": "/logos/betterplace.jpg",
  "colorlab": "/logos/color lab.webp",
  "colorlabs": "/logos/color lab.webp"
};

const Logo = ({
  name,
  domain,
  size = 'md',
  className = '',
  fallbackInitials,
  ...props
}) => {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  const normalizedName = normalizeName(name);
  let staticLogoUrl = null;
  
  for (const key in logoMap) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      staticLogoUrl = logoMap[key];
      break;
    }
  }

  // Derive domain from explicit prop or company name
  const cleanDomain = domain 
    ? domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : normalizedName ? `${normalizedName}.com` : null;

  // Build candidate logo sources array
  const sources = [
    staticLogoUrl,
    cleanDomain ? `https://logo.clearbit.com/${cleanDomain}` : null,
    cleanDomain ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128` : null,
    cleanDomain ? `https://icon.horse/icon/${cleanDomain}` : null,
  ].filter(Boolean);

  const currentSourceUrl = !hasFailedAll && sourceIndex < sources.length ? sources[sourceIndex] : null;

  const initials = fallbackInitials || (() => {
    if (!name) return '??';
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  })();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-3xl'
  };

  const getGradient = (str) => {
    if (!str) return 'from-purple-600 to-indigo-600';
    const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      'from-amber-600 to-orange-600',
      'from-purple-600 to-indigo-600',
      'from-blue-600 to-cyan-600',
      'from-emerald-600 to-teal-600',
      'from-rose-600 to-red-600',
      'from-violet-600 to-fuchsia-600',
    ];
    return gradients[hash % gradients.length];
  };

  const handleImageError = () => {
    if (sourceIndex + 1 < sources.length) {
      setSourceIndex(prev => prev + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  const handleImageLoad = (e) => {
    // Filter out generic low-res 16x16 fallback globes (e.g. Google Favicon default placeholder)
    if (e.target.naturalWidth <= 16 || e.target.naturalHeight <= 16) {
      handleImageError();
    }
  };

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl flex items-center justify-center bg-surface-2 border border-border shadow-sm shrink-0',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {currentSourceUrl ? (
        <img
          key={currentSourceUrl}
          src={currentSourceUrl}
          alt={`${name || 'Company'} logo`}
          className="w-full h-full object-contain p-1 rounded-lg"
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <div className={clsx(
          'w-full h-full flex items-center justify-center font-display font-bold text-white bg-gradient-to-br',
          getGradient(name || initials)
        )}>
          {initials}
        </div>
      )}
    </div>
  );
};

export default Logo;
