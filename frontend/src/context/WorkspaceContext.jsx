import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * WorkspaceContext unifies all AI tools (AI Research, Risk Scanner, Founder
 * Playbook, Pitch Deck Autopsy) into one continuous AI workspace.
 *
 * It holds:
 *  - profile: the active company/idea being analysed (name, idea, industry,
 *    businessModel, audience, teamSize, stage)
 *  - riskScore: the latest risk score from the Risk Scanner
 *  - analyses: a cross-tool log of prior analyses ({ tool, summary, ... })
 *
 * Every tool reads the profile to pre-fill its form and writes back whatever
 * it learns, so opening Founder Playbook after running the Risk Scanner already
 * knows the startup name, industry, business model, previous analysis and risk
 * score. The shared memory is also fed to the backend so the AI "remembers".
 */

const WorkspaceContext = createContext(null);

const STORAGE_KEY = 'pivotvault-workspace';

const EMPTY_PROFILE = {
  companyName: '',
  idea: '',
  industry: '',
  businessModel: '',
  audience: '',
  teamSize: '',
  stage: '',
};

const loadInitialState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { profile: { ...EMPTY_PROFILE }, riskScore: null, analyses: [] };
    const parsed = JSON.parse(raw);
    return {
      profile: { ...EMPTY_PROFILE, ...(parsed.profile || {}) },
      riskScore: parsed.riskScore ?? null,
      analyses: Array.isArray(parsed.analyses) ? parsed.analyses : [],
    };
  } catch {
    return { profile: { ...EMPTY_PROFILE }, riskScore: null, analyses: [] };
  }
};

export const WorkspaceProvider = ({ children }) => {
  const [state, setState] = useState(loadInitialState);

  // Persist to localStorage on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota / serialization errors
    }
  }, [state]);

  const { profile, riskScore, analyses } = state;

  /** Merge known fields into the active profile (ignores empty values). */
  const updateProfile = useCallback((partial = {}) => {
    setState((prev) => {
      const next = { ...prev.profile };
      Object.entries(partial).forEach(([key, value]) => {
        if (value !== undefined && value !== null && `${value}`.trim() !== '') {
          next[key] = value;
        }
      });
      return { ...prev, profile: next };
    });
  }, []);

  const setRiskScore = useCallback((score) => {
    setState((prev) => ({ ...prev, riskScore: score ?? prev.riskScore }));
  }, []);

  /**
   * Record an analysis run from any tool so the other tools (and the AI) can
   * reference it later. `profilePatch` merges into the shared profile.
   */
  const recordAnalysis = useCallback(({ tool, summary, riskScore: score, profilePatch = {} } = {}) => {
    setState((prev) => {
      const nextProfile = { ...prev.profile };
      Object.entries(profilePatch).forEach(([key, value]) => {
        if (value !== undefined && value !== null && `${value}`.trim() !== '') {
          nextProfile[key] = value;
        }
      });

      const entry = {
        tool,
        summary: (summary || '').slice(0, 600),
        riskScore: score ?? null,
        at: Date.now(),
      };

      // Keep only the most recent analysis per tool, newest last, max 6 total.
      const filtered = prev.analyses.filter((a) => a.tool !== tool);
      const analysesNext = [...filtered, entry].slice(-6);

      return {
        profile: nextProfile,
        riskScore: score ?? prev.riskScore,
        analyses: analysesNext,
      };
    });
  }, []);

  const clearWorkspace = useCallback(() => {
    setState({ profile: { ...EMPTY_PROFILE }, riskScore: null, analyses: [] });
  }, []);

  /** True when there is any meaningful active context worth showing/sharing. */
  const hasContext =
    !!(profile.idea || profile.companyName || profile.industry || profile.businessModel) ||
    riskScore != null ||
    analyses.length > 0;

  /**
   * Build a compact human-readable memory string describing the shared
   * workspace context (active company + prior analyses from other tools).
   * Pass `excludeTool` to omit the current tool's own prior summary.
   */
  const buildMemoryText = useCallback(
    (excludeTool) => {
      if (!hasContext) return '';
      const lines = [];
      const p = profile;
      const profileBits = [];
      if (p.companyName) profileBits.push(`Company: ${p.companyName}`);
      if (p.idea) profileBits.push(`Idea: ${p.idea}`);
      if (p.industry) profileBits.push(`Industry: ${p.industry}`);
      if (p.businessModel) profileBits.push(`Business Model: ${p.businessModel}`);
      if (p.audience) profileBits.push(`Target Audience: ${p.audience}`);
      if (p.stage) profileBits.push(`Stage: ${p.stage}`);
      if (p.teamSize) profileBits.push(`Team Size: ${p.teamSize}`);
      if (riskScore != null) profileBits.push(`Latest Risk Score: ${riskScore}/100`);

      if (profileBits.length) {
        lines.push('ACTIVE STARTUP WORKSPACE:');
        lines.push(profileBits.join('\n'));
      }

      const priorAnalyses = analyses.filter((a) => a.tool !== excludeTool && a.summary);
      if (priorAnalyses.length) {
        lines.push('\nPRIOR ANALYSES FROM OTHER TOOLS (use them for continuity):');
        priorAnalyses.forEach((a) => {
          lines.push(`- [${a.tool}]${a.riskScore != null ? ` (risk ${a.riskScore}/100)` : ''}: ${a.summary}`);
        });
      }

      return lines.join('\n').trim();
    },
    [analyses, hasContext, profile, riskScore]
  );

  /**
   * Returns a `history`-compatible array that injects the shared workspace
   * memory as a leading `system` turn, followed by the tool's own local
   * conversation history. Backends already render `${role}: ${content}`.
   */
  const getSharedHistory = useCallback(
    (localHistory = [], excludeTool) => {
      const memory = buildMemoryText(excludeTool);
      const memoryTurn = memory
        ? [{ role: 'system', content: `Shared AI workspace memory (continuous session across tools):\n${memory}` }]
        : [];
      return [...memoryTurn, ...localHistory];
    },
    [buildMemoryText]
  );

  const value = {
    profile,
    riskScore,
    analyses,
    hasContext,
    updateProfile,
    setRiskScore,
    recordAnalysis,
    clearWorkspace,
    buildMemoryText,
    getSharedHistory,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
};

export default WorkspaceContext;
