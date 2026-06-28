import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

export default function LoadingWithStages({ stages, className = '' }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!stages || stages.length === 0) return;
    
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % stages.length);
    }, 1500);
    
    return () => clearInterval(interval);
  }, [stages]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-surface-3 border-t-accent rounded-full animate-spin" />
        <Zap className="absolute inset-0 m-auto w-6 h-6 text-accent animate-pulse" />
      </div>
      <h3 className="text-lg font-data text-accent mb-2">
        {stages[stageIndex] || 'Loading...'}
      </h3>
    </div>
  );
}
