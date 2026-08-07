import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  Building2, DollarSign, TrendingUp, Compass, AlertTriangle, Flame,
  BookOpen, MousePointerClick, Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import TimelineEventPanel from './TimelineEventPanel';

// Stage → icon + color mapping used for the timeline nodes.
const STAGE_META = {
  founding: { icon: Building2, color: 'info' },
  funding: { icon: DollarSign, color: 'success' },
  growth: { icon: TrendingUp, color: 'purple' },
  major_decisions: { icon: Compass, color: 'warning' },
  warning_signs: { icon: AlertTriangle, color: 'orange' },
  collapse: { icon: Flame, color: 'danger' },
  aftermath: { icon: BookOpen, color: 'slate' },
};

const stagePalette = {
  info: {
    node: 'border-info/40 bg-info/10 text-info',
    chip: 'bg-info/10 text-info border-info/25',
  },
  success: {
    node: 'border-success/40 bg-success/10 text-success',
    chip: 'bg-success/10 text-success border-success/25',
  },
  purple: {
    node: 'border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#a78bfa]',
    chip: 'bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/25',
  },
  warning: {
    node: 'border-warning/40 bg-warning/10 text-warning',
    chip: 'bg-warning/10 text-warning border-warning/25',
  },
  orange: {
    node: 'border-orange-400/40 bg-orange-400/10 text-orange-400',
    chip: 'bg-orange-400/10 text-orange-400 border-orange-400/25',
  },
  danger: {
    node: 'border-danger/40 bg-danger/10 text-danger',
    chip: 'bg-danger/10 text-danger border-danger/25',
  },
  slate: {
    node: 'border-slate-400/40 bg-slate-400/10 text-slate-400',
    chip: 'bg-slate-400/10 text-slate-400 border-slate-400/25',
  },
};

const normalizeEvent = (e, index) => ({
  id: e?.id ?? `evt-${index}`,
  date: e?.date || e?.dateStr || '',
  title: e?.title || 'Untitled event',
  description: e?.description || '',
  stage: e?.stage || 'major_decisions',
  ...(e?.people ? { people: e.people } : {}),
  ...(e?.companies ? { companies: e.companies } : {}),
  ...(e?.financialImpact ? { financialImpact: e.financialImpact } : {}),
  ...(e?.lessons ? { lessons: e.lessons } : {}),
  ...(e?.references ? { references: e.references } : {}),
});

const StartupTimeline = ({
  events = [],
  startup = null,
  doc = null,
  relatedStartups = [],
  compact = false,
}) => {
  const [selected, setSelected] = React.useState(null);
  const trackRef = React.useRef(null);

  const normalized = React.useMemo(
    () => (Array.isArray(events) ? events.map(normalizeEvent) : []),
    [events]
  );

  // Scroll-linked line: the progress fills as the user scrolls through the
  // timeline. The spring smooths the fill for a premium feel.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 0.85', 'end 0.55'],
  });
  const fillProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.4,
  });

  const selectedEvent = normalized.find((e) => e.id === selected) || null;

  return (
    <div ref={trackRef} className={clsx('relative', !compact && 'py-2')}>
      {/* Connecting line track */}
      <div
        aria-hidden="true"
        className="absolute left-[22px] top-2 bottom-2 w-[3px] rounded-full bg-border/40 sm:left-[27px]"
      />
      {/* Animated fill — grows with scroll */}
      <motion.div
        aria-hidden="true"
        style={{ scaleY: fillProgress }}
        className="absolute left-[22px] top-2 bottom-2 w-[3px] origin-top rounded-full bg-gradient-to-b from-accent via-accent to-danger sm:left-[27px]"
      />

      <ol className="space-y-10 sm:space-y-12">
        {normalized.map((event, index) => {
          const meta = STAGE_META[event.stage] || STAGE_META.major_decisions;
          const Icon = meta.icon;
          const palette = stagePalette[meta.color] || stagePalette.warning;
          const isLast = index === normalized.length - 1;

          return (
            <li key={event.id} className="relative pl-14 sm:pl-20">
              {/* Large timeline node */}
              <motion.button
                type="button"
                onClick={() => setSelected(event.id)}
                aria-label={`Open event: ${event.title}`}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: index * 0.04 }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                  'absolute left-0 top-0 grid h-11 w-11 place-items-center rounded-full border-2 border-bg shadow-elevated transition-colors sm:h-[54px] sm:w-[54px]',
                  palette.node,
                  selected === event.id && 'ring-2 ring-accent/60 ring-offset-2 ring-offset-bg'
                )}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                {/* Active pulse */}
                {selected === event.id && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-accent/20" aria-hidden="true" />
                )}
              </motion.button>

              {/* Event card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, ease: [0.2, 0, 0, 1], delay: 0.08 }}
                className={clsx(
                  'group rounded-xl border bg-surface p-5 shadow-sm transition-all duration-200 sm:p-6',
                  selected === event.id
                    ? 'border-accent/40 shadow-card'
                    : 'border-border/60 hover:border-border-strong hover:shadow-card'
                )}
              >
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  <span className="font-data text-xs font-bold uppercase tracking-wider text-accent">
                    {event.date || 'Date unknown'}
                  </span>
                  <span className={clsx('rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest', palette.chip)}>
                    {event.stage.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-text-primary transition-colors group-hover:text-accent">
                  {event.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                  {event.description || 'No description recorded.'}
                </p>

                <button
                  type="button"
                  onClick={() => setSelected(event.id)}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent transition-colors hover:text-accent-2"
                >
                  <MousePointerClick className="h-3.5 w-3.5" />
                  Explore Event
                </button>
              </motion.div>

              {/* Fading tail on the last node */}
              {isLast && (
                <div
                  aria-hidden="true"
                  className="absolute left-[21px] top-11 h-16 w-[3px] rounded-full bg-gradient-to-b from-danger/50 to-transparent sm:left-[26px] sm:top-[54px]"
                />
              )}
            </li>
          );
        })}
      </ol>

      {normalized.length === 0 && (
        <div className="pv-card p-10 text-center text-sm text-text-muted">
          No timeline events recorded for this company yet.
        </div>
      )}

      {/* Detail side-panel */}
      <TimelineEventPanel
        event={selectedEvent}
        startup={startup}
        doc={doc}
        relatedStartups={relatedStartups}
        onClose={() => setSelected(null)}
      />

      {/* Hint */}
      {normalized.length > 0 && !selected && (
        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-text-muted">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Click any node to open the event dossier + AI analysis
        </div>
      )}
    </div>
  );
};

export default StartupTimeline;
