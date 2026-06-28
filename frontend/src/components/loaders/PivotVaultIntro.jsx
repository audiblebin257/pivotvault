import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrowdCanvas } from '../CrowdCanvas';

const PivotVaultIntro = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 0: 0-1.5s → Crowd only
    // Phase 1: 1.5-3.5s → Show branding
    // Phase 2: 3.5-6s → Keep visible
    // Phase 3: 6-7s → Fade out
    const timer1 = setTimeout(() => setPhase(1), 1500);
    const timer2 = setTimeout(() => setPhase(2), 6000);
    const timer3 = setTimeout(() => onComplete(), 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="intro"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 3 ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
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
        <div className="relative z-10 flex flex-col items-center gap-4 text-center" style={{ marginTop: '-40px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: phase >= 1 ? 1 : 0,
              y: phase >= 1 ? 0 : 20,
              scale: phase >= 1 ? 1 : 0.95
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-white">
              PIVOTVAULT
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{
              opacity: phase >= 1 ? 1 : 0,
              y: phase >= 1 ? 0 : 15
            }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-[#D1D5DB]"
          >
            Startup Failure Intelligence
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: phase >= 1 ? 1 : 0,
              y: phase >= 1 ? 0 : 10
            }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="text-lg md:text-xl text-[#D4A037] font-medium"
          >
            Learn From Failure
          </motion.div>
        </div>

        {/* Loading Text */}
        <div className="absolute bottom-12 z-10 flex flex-col items-center gap-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: phase >= 1 ? 1 : 0,
              y: phase >= 1 ? 0 : 10
            }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            className="text-lg text-[#D1D5DB]"
          >
            Loading intelligence...
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PivotVaultIntro;
