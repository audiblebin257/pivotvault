import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, Zap, ClipboardCheck, FileText, BarChart2,
  ArrowLeft, ArrowRight, X, Check,
} from 'lucide-react';

/**
 * ProductTour — a guided, spotlight-style walkthrough of the core PivotVault
 * tools. It dims the screen and highlights the *actual* sidebar item for each
 * step (via a `data-tour` attribute), anchoring an explainer card beside it.
 *
 * The tour expands the desktop sidebar (and opens the mobile drawer) for its
 * duration so the highlighted items are always visible, then restores the
 * previous layout on exit. If a target can't be measured (e.g. very narrow
 * screens), it falls back to a centered card so the flow never dead-ends.
 *
 * Controls: Next / Previous / Skip / Finish, plus ←/→/Esc keyboard shortcuts.
 */

export const TOUR_STEPS = [
  { id: 'explore', icon: Search, title: 'Failure Explorer', body: 'Discover why real startups failed — browse documented postmortems across every industry.' },
  { id: 'assistant', icon: Sparkles, title: 'AI Research Assistant', body: 'Ask questions about startup failures and get answers grounded in real cases.' },
  { id: 'scan', icon: Zap, title: 'Risk Scanner', body: 'Analyze your startup idea before building — stress-test it against historical failures.' },
  { id: 'playbook', icon: ClipboardCheck, title: 'Founder Playbook', body: 'Generate a roadmap tailored to your idea, based on what killed similar startups.' },
  { id: 'autopsy', icon: FileText, title: 'Pitch Deck Autopsy', body: 'Improve your investor pitch by exposing the weaknesses that sank others.' },
  { id: 'insights', icon: BarChart2, title: 'Insights Dashboard', body: 'Discover industry-wide failure patterns and where the danger zones are.' },
];

const SPOTLIGHT_PAD = 8;
const TOOLTIP_W = 340;

// Find the on-screen element for a step. The sidebar renders twice (desktop +
// mobile drawer); pick whichever copy is actually visible.
const findTarget = (id) => {
  const els = Array.from(document.querySelectorAll(`[data-tour="${id}"]`));
  return els.find((el) => el.getBoundingClientRect().width > 0) || els[0] || null;
};

export default function ProductTour({ steps = TOUR_STEPS, onFinish, onSkip, sidebar }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const restoreRef = useRef(null);

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  // Expand the sidebar (open the drawer on mobile) for the tour, then restore.
  useEffect(() => {
    if (!sidebar) return undefined;
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    restoreRef.current = { collapsed: sidebar.isCollapsed };
    sidebar.setIsCollapsed?.(false);
    if (isMobile) sidebar.setIsMobileOpen?.(true);
    return () => {
      sidebar.setIsCollapsed?.(restoreRef.current?.collapsed ?? true);
      sidebar.setIsMobileOpen?.(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bring the current target into view once per step.
  useLayoutEffect(() => {
    const el = findTarget(step.id);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [step.id]);

  // Track the target's rect across the sidebar-expand transition + resize/scroll.
  useLayoutEffect(() => {
    let raf;
    let frames = 0;
    const read = () => {
      const el = findTarget(step.id);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width || r.height) {
          setRect({
            top: r.top - SPOTLIGHT_PAD,
            left: r.left - SPOTLIGHT_PAD,
            width: r.width + SPOTLIGHT_PAD * 2,
            height: r.height + SPOTLIGHT_PAD * 2,
          });
        }
      } else {
        setRect(null);
      }
      // Re-measure for ~600ms to follow the layout/transition settling.
      if (frames < 38) {
        frames += 1;
        raf = requestAnimationFrame(read);
      }
    };
    raf = requestAnimationFrame(read);

    const onMove = () => {
      const el = findTarget(step.id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - SPOTLIGHT_PAD,
        left: r.left - SPOTLIGHT_PAD,
        width: r.width + SPOTLIGHT_PAD * 2,
        height: r.height + SPOTLIGHT_PAD * 2,
      });
    };
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [step.id]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onSkip?.();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSkip]);

  // Compute the explainer-card position relative to the highlighted item.
  let tipStyle;
  let centered = false;
  if (!rect) {
    centered = true;
    tipStyle = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: TOOLTIP_W };
  } else {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const placeRight = rect.left + rect.width + 16 + TOOLTIP_W <= vw;
    const left = placeRight
      ? rect.left + rect.width + 16
      : Math.max(16, rect.left - 16 - TOOLTIP_W);
    const top = Math.min(Math.max(16, rect.top), vh - 320);
    tipStyle = { left, top, width: TOOLTIP_W };
  }

  const StepIcon = step.icon;

  return createPortal(
    <div className="fixed inset-0 z-[120]" aria-live="polite" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* Click-blocker so navigation can't fire mid-tour */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Spotlight (or full dim when no target is measurable) */}
      {rect ? (
        <motion.div
          className="pointer-events-none fixed rounded-xl border-2 border-accent"
          initial={false}
          animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          transition={{ type: 'spring', stiffness: 360, damping: 34 }}
          style={{ boxShadow: '0 0 0 9999px rgba(8, 10, 14, 0.72)' }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[rgba(8,10,14,0.72)]" />
      )}

      {/* Explainer card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          className="pv-card fixed z-[121] p-5 shadow-elevated"
          style={tipStyle}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/10 text-accent">
                <StepIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                Step {index + 1} of {steps.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onSkip}
              aria-label="Skip tour"
              className="pv-btn-ghost pv-btn-icon h-8 w-8"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 className="font-display text-lg font-bold text-text-primary">{step.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{step.body}</p>

          {/* Progress dots */}
          <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={
                  i === index
                    ? 'h-1.5 w-5 rounded-full bg-accent transition-all'
                    : 'h-1.5 w-1.5 rounded-full bg-border transition-all'
                }
              />
            ))}
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-semibold text-text-muted transition-colors hover:text-text-primary"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                disabled={isFirst}
                className="pv-btn-secondary h-9 px-3"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              {isLast ? (
                <button type="button" onClick={onFinish} className="pv-btn-primary h-9 px-4">
                  Finish
                  <Check className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" onClick={next} className="pv-btn-primary h-9 px-4">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
