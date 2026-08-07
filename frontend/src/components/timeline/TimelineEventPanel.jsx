import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, Building2, Users, DollarSign, Lightbulb, Link2, Image as ImageIcon,
  BookOpen, AlertTriangle, Layers, FileText
} from 'lucide-react';
import { clsx } from 'clsx';
import EventChatPanel from './EventChatPanel';
import { generateMockExternalSources } from '../../lib/mockApi';

const STAGE_INTRO = {
  founding: 'This founding moment set the identity and initial positioning that every later decision built upon.',
  funding: 'Capital changed the company\u2019s incentives and velocity — more money usually meant more pressure to scale.',
  growth: 'Growth amplified both strengths and flaws; what worked at small scale often broke at this stage.',
  major_decisions: 'A defining strategic choice was made here that reshaped the company\u2019s trajectory.',
  warning_signs: 'Early signals of trouble were visible at this point — in hindsight they read clearly.',
  collapse: 'The turning point where the company ran out of options and the trajectory became irreversible.',
  aftermath: 'The aftermath determined what lessons survived and what the market learned from the failure.',
};

const formatINR = (val) => {
  if (!val) return 'Not disclosed';
  const num = Number(val);
  if (num >= 1000000000) return `₹${(num / 1000000000).toFixed(1)} B`;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const DetailBlock = ({ icon: Icon, label, children, accent = 'text-accent' }) => (
  <div className="rounded-xl border border-border/60 bg-surface-2/40 p-4">
    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
      <Icon className={clsx('h-3.5 w-3.5', accent)} />
      {label}
    </div>
    {children}
  </div>
);

const TimelineEventPanel = ({ event, startup, doc, relatedStartups = [], onClose }) => {
  const [tab, setTab] = React.useState('dossier');
  const closeRef = React.useRef(null);
  const panelRef = React.useRef(null);

  // Escape to close, focus the close button on open, and trap Tab focus
  // inside the drawer (memory.md accessibility convention).
  React.useEffect(() => {
    if (!event) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [event, onClose]);

  const references = React.useMemo(() => {
    if (event?.references?.length) return event.references;
    try {
      return generateMockExternalSources(`${startup?.name || 'Company'} ${event?.title || ''}`).slice(0, 3);
    } catch {
      return [];
    }
  }, [event, startup]);

  const related = relatedStartups.length
    ? relatedStartups
    : (doc?.similarStartups || []).slice(0, 3);

  const companies = event?.companies?.length
    ? event.companies
    : [startup?.name || 'The company itself'];

  const people = event?.people?.length
    ? event.people
    : ['Key decision-makers at the time'];

  const financialImpact = event?.financialImpact
    ? event.financialImpact
    : startup?.fundingInr
      ? `Capital at stake around this event: ${formatINR(startup.fundingInr)}`
      : 'Not disclosed in the archive.';

  const lessons = event?.lessons?.length
    ? event.lessons
    : (doc?.lessons || []).slice(0, 3).map((l) => l.insight || l.title);

  return createPortal(
    <AnimatePresence>
      {event && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Event dossier: ${event.title}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-[90] flex w-full flex-col border-l border-border bg-bg shadow-elevated sm:max-w-[26.5rem] lg:max-w-[30rem]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border bg-surface/60 px-6 py-5 backdrop-blur-xl">
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent">
                  <Calendar className="h-3.5 w-3.5" />
                  {event.date || 'Date unknown'}
                  <span className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[9px] text-text-muted">
                    {event.stage.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold leading-tight text-text-primary">
                  {event.title}
                </h3>
                {startup?.name && (
                  <p className="mt-1 text-xs font-medium text-text-muted">
                    {startup.name} · {startup.industry || '—'} · {startup.status || '—'}
                  </p>
                )}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close event dossier"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-text-secondary transition-colors hover:border-danger/40 hover:text-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border bg-surface/30 px-4 pt-3">
              {[
                { key: 'dossier', label: 'Event Dossier', icon: FileText },
                { key: 'ask', label: 'Ask AI', icon: BookOpen },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors',
                    tab === t.key
                      ? 'border-accent text-accent'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {tab === 'ask' ? (
                <EventChatPanel event={event} startupSlug={startup?.slug} startupName={startup?.name} />
              ) : (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {event.description || 'No detailed description recorded for this event.'}
                  </p>
                  {event.stage && (
                    <p className="rounded-lg border border-accent/15 bg-accent/5 p-3.5 text-xs leading-relaxed text-text-muted italic">
                      {STAGE_INTRO[event.stage] || 'This event is a significant inflection point in the company\u2019s story.'}
                    </p>
                  )}

                  {/* Images */}
                  <DetailBlock icon={ImageIcon} label="Visuals" accent="text-info">
                    <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-surface text-center">
                      <div className="flex flex-col items-center gap-1.5 px-4">
                        <ImageIcon className="h-5 w-5 text-text-muted" />
                        <span className="text-[11px] text-text-muted">No archival images available</span>
                      </div>
                    </div>
                  </DetailBlock>

                  {/* Companies involved */}
                  <DetailBlock icon={Building2} label="Companies involved" accent="text-success">
                    <ul className="space-y-1">
                      {companies.map((c, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-text-primary">
                          <Layers className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </DetailBlock>

                  {/* People involved */}
                  <DetailBlock icon={Users} label="People involved" accent="text-info">
                    <ul className="space-y-1">
                      {people.map((p, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-text-primary">
                          <Users className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </DetailBlock>

                  {/* Financial impact */}
                  <DetailBlock icon={DollarSign} label="Financial impact" accent="text-warning">
                    <p className="text-sm text-text-primary">{financialImpact}</p>
                  </DetailBlock>

                  {/* Lessons learned */}
                  <DetailBlock icon={Lightbulb} label="Lessons learned" accent="text-success">
                    <ul className="space-y-2">
                      {(lessons.length ? lessons : ['Every decision compounds — check the surrounding events for the full picture.']).map((lesson, i) => (
                        <li key={i} className="flex gap-2 text-sm text-text-secondary">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </DetailBlock>

                  {/* References */}
                  <DetailBlock icon={Link2} label="References & sources" accent="text-accent">
                    <ul className="space-y-2">
                      {references.map((ref, i) => (
                        <li key={i}>
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block rounded-lg border border-border/50 bg-surface p-3 transition-colors hover:border-accent/30"
                          >
                            <span className="block text-sm font-semibold text-text-primary group-hover:text-accent">
                              {ref.title}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wider text-text-muted">
                              {ref.publisher} · {ref.date}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </DetailBlock>

                  {/* Related startups */}
                  {related.length > 0 && (
                    <DetailBlock icon={Layers} label="Related startups" accent="text-purple">
                      <ul className="space-y-1">
                        {related.map((r, i) => (
                          <li key={i} className="text-sm text-text-primary">
                            {r.name}
                            {r.reason && <span className="mt-0.5 block text-xs text-text-muted">{r.reason}</span>}
                          </li>
                        ))}
                      </ul>
                    </DetailBlock>
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default TimelineEventPanel;
