import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Boxes, X, Gauge } from 'lucide-react';
import { clsx } from 'clsx';
import { useWorkspace } from '../context/WorkspaceContext';

/**
 * Slim "Active Workspace" context bar shown across the AI tools. It surfaces the
 * shared startup context (company / idea / industry / business model) plus the
 * latest risk score, making the separate tools feel like one continuous AI
 * workspace. Renders nothing when there is no active context.
 */
const Chip = ({ label, value }) => (
  <div className="flex items-baseline gap-1.5 min-w-0">
    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted shrink-0">{label}</span>
    <span className="text-sm font-semibold text-text-primary truncate">{value}</span>
  </div>
);

const WorkspaceBar = () => {
  const { profile, riskScore, hasContext, clearWorkspace } = useWorkspace();

  return (
    <AnimatePresence>
      {hasContext && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-8"
        >
          <div className="pv-card px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-accent/20 bg-surface/40">
            <div className="flex items-center gap-2 shrink-0">
              <Boxes className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Active Workspace</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 flex-1 min-w-0">
              {profile.companyName && <Chip label="Company" value={profile.companyName} />}
              {profile.idea && <Chip label="Idea" value={profile.idea} />}
              {profile.industry && <Chip label="Industry" value={profile.industry} />}
              {profile.businessModel && <Chip label="Model" value={profile.businessModel} />}
              {profile.stage && <Chip label="Stage" value={profile.stage} />}
            </div>

            {riskScore != null && (
              <div className="flex items-center gap-2 shrink-0">
                <Gauge
                  className={clsx(
                    'w-4 h-4',
                    riskScore > 70 ? 'text-danger' : riskScore > 40 ? 'text-accent' : 'text-success'
                  )}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Risk</span>
                <span
                  className={clsx(
                    'text-sm font-data font-bold',
                    riskScore > 70 ? 'text-danger' : riskScore > 40 ? 'text-accent' : 'text-success'
                  )}
                >
                  {riskScore}/100
                </span>
              </div>
            )}

            <button
              onClick={clearWorkspace}
              title="Clear workspace context"
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-danger transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkspaceBar;
