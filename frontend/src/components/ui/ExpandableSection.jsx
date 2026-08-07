import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * ExpandableSection — an animated accordion section used across the Founder
 * Intelligence Report. Each section has an icon, title, optional subtitle and
 * badge, and smoothly expands/collapses with framer-motion.
 */
const ExpandableSection = ({
  id,
  icon: Icon,
  title,
  subtitle,
  badge,
  defaultOpen = true,
  accent = 'accent',
  children,
  className,
}) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const bodyId = id ? `${id}-panel` : undefined;
  const buttonId = id ? `${id}-button` : undefined;

  return (
    <section
      id={id}
      className={clsx(
        'pv-card overflow-hidden border-border/70',
        open && 'shadow-card',
        className
      )}
    >
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-surface-2/40 sm:px-8"
      >
        <div
          className={clsx(
            'grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-all duration-200',
            open
              ? 'bg-accent/12 text-accent border-accent/25'
              : 'bg-surface-2 text-text-muted border-border group-hover:text-accent group-hover:border-accent/30'
          )}
        >
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold text-text-primary">{title}</h2>
            {badge && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent border border-accent/20">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-sm text-text-muted leading-relaxed">{subtitle}</p>
          )}
        </div>
        <div
          className={clsx(
            'grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-surface-2 transition-all duration-300',
            open && 'rotate-180 border-accent/30 text-accent'
          )}
          aria-hidden="true"
        >
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 px-6 py-7 sm:px-8">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ExpandableSection;
