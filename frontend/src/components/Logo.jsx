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
  "colorlab": "/logos/color lab.png",
  "colorlabs": "/logos/color lab.png"
};

const Logo = ({
  name,
  domain,
  size = 'md',
  className = '',
  fallbackInitials,
  ...props
}) => {
  const [isError, setIsError] = useState(false);

  const normalizedName = normalizeName(name);
  let logoUrl = null;
  
  for (const key in logoMap) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      logoUrl = logoMap[key];
      break;
    }
  }

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
      'from-pink-500 to-rose-500',
      'from-purple-600 to-indigo-600',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-amber-500 to-orange-500',
      'from-violet-500 to-fuchsia-500',
    ];
    return gradients[hash % gradients.length];
  };

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-lg flex items-center justify-center bg-surface-3 border border-border',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {!isError && logoUrl ? (
        <img
          src={logoUrl}
          alt={`${name || 'Company'} logo`}
          className="w-full h-full object-contain p-1"
          loading="lazy"
          onError={() => {
            setIsError(true);
          }}
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
