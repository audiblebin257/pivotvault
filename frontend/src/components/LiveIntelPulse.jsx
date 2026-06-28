import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Zap, Skull, MessageSquare, Terminal } from 'lucide-react';

const IntelEvent = React.forwardRef(function IntelEvent({ event }, ref) {
  return (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="flex items-center gap-3 px-4 py-2 bg-surface/40 backdrop-blur-md border border-border/50 rounded-full whitespace-nowrap shrink-0"
  >
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{event.type}</span>
    </div>
    <div className="w-px h-3 bg-border/50" />
    <span className="text-xs text-text-secondary">
      <span className="text-text-primary font-bold">{event.startup}</span> {event.action}
    </span>
  </motion.div>
  );
});

const LiveIntelPulse = () => {
  const events = [
    { type: 'POSTMORTEM', startup: 'Vine', action: 'added to the vault' },
    { type: 'SIGNAL', startup: 'EdTech Sector', action: 'showing high churn patterns' },
    { type: 'GHOST', startup: 'Theranos', action: 'is available for seance' },
    { type: 'RISK', startup: 'B2C Delivery', action: 'lethal CAC levels detected' },
    { type: 'ANALYSIS', startup: 'Quibi', action: 'content burn rate calculated' },
    { type: 'POSTMORTEM', startup: 'Webvan', action: 'legacy failure analysis complete' },
  ];

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [visibleEvents, setVisibleEvents] = React.useState([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [events.length]);

  React.useEffect(() => {
    const nextEvent = events[currentIndex];
    setVisibleEvents((prev) => [nextEvent, ...prev.slice(0, 2)]);
  }, [currentIndex]);

  return (
    <div className="w-full bg-bg/50 border-y border-border/40 py-3 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <Radio className="w-4 h-4 text-danger animate-pulse" />
          <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">Live Intel Pulse</span>
        </div>
        
        <div className="flex-1 flex gap-4 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {visibleEvents.map((event, i) => (
              <IntelEvent key={`${event.startup}-${currentIndex}-${i}`} event={event} />
            ))}
          </AnimatePresence>
        </div>

        <div className="hidden md:flex items-center gap-4 shrink-0 border-l border-border/40 pl-6">
          <div className="flex items-center gap-1.5">
            <Skull className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[10px] font-bold text-text-muted">12,437 Vaulted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[10px] font-bold text-text-muted">450+ Patterns</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveIntelPulse;
