import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CrowdCanvas } from '../CrowdCanvas';

const loadingMessages = [
  "Collecting failure signals...",
  "Comparing patterns...",
  "Building insights...",
  "Analyzing startup intelligence..."
];

const PivotVaultLoader = ({ customMessage }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (customMessage) {
      return;
    }
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [customMessage]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, blur: 10 }}
      animate={{ opacity: 1, scale: 1, blur: 0 }}
      exit={{ opacity: 0, scale: 0.98, blur: 10 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-md overflow-hidden"
      style={{ backgroundColor: '#050505' }}
    >
      {/* Crowd Animation */}
      <div className="absolute bottom-0 left-0 w-full h-[70vh]" style={{ transform: 'translateY(120px)' }}>
        <CrowdCanvas
          src="/images/peeps/all-peeps.webp"
          rows={15}
          cols={7}
          className="h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">
          PIVOTVAULT
        </h1>
        <motion.p
          key={customMessage || currentMessageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-lg md:text-xl text-[#D1D5DB]"
        >
          {customMessage || loadingMessages[currentMessageIndex]}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PivotVaultLoader;
