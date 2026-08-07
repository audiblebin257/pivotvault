import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, User, Bookmark, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const SettingsRow = ({ icon: Icon, title, description, children }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 sm:p-6">
    <div className="flex items-start gap-3.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 border border-border text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-bold text-text-primary">{title}</h3>
        <p className="mt-0.5 text-sm text-text-muted">{description}</p>
      </div>
    </div>
    <div className="shrink-0 sm:pl-4">{children}</div>
  </div>
);

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthed, logout } = useAuth();
  const isDark = theme === 'blue';

  const initials = (user?.name || 'Founder')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-bg">
      <div className="pv-content-container py-12 max-w-3xl">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase text-text-muted tracking-[0.2em] mb-2">Account</div>
          <h1 className="text-4xl font-display font-bold text-text-primary mb-3">Settings</h1>
          <p className="text-text-secondary text-lg">Manage your profile, appearance and account.</p>
        </div>

        <div className="space-y-6">
          {/* Profile card */}
          <div className="pv-card p-6 sm:p-8">
            <div className="flex items-center gap-5">
              <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent/15 border border-accent/30 font-display text-xl font-black text-accent">
                {initials}
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success border-2 border-bg" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">FOUNDER / OPERATOR</div>
                <div className="truncate font-display text-xl font-bold text-text-primary">
                  {user?.name || 'Guest Founder'}
                </div>
                <div className="text-sm text-text-muted">{user?.email || 'Not signed in'}</div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-border/60 pt-5">
              <Link to="/bookmarks" className="pv-btn-secondary">
                <Bookmark className="h-4 w-4" />
                My Bookmarks
              </Link>
              {isAuthed && (
                <button type="button" onClick={logout} className="pv-btn-danger">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Appearance */}
          <div className="pv-card divide-y divide-border/50">
            <SettingsRow
              icon={isDark ? Moon : Sun}
              title="Appearance"
              description={isDark ? 'Dark — Founder Intelligence Terminal' : 'Light — Warm Research Paper'}
            >
              <button
                type="button"
                onClick={toggleTheme}
                className="relative inline-flex h-8 w-14 items-center rounded-full border border-border bg-surface-2 transition-colors"
                aria-label="Toggle theme"
                aria-pressed={!isDark}
              >
                <span
                  className={clsx(
                    'grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-contrast shadow transition-transform duration-200',
                    isDark ? 'translate-x-1' : 'translate-x-7'
                  )}
                >
                  {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                </span>
              </button>
            </SettingsRow>

            <SettingsRow
              icon={ShieldCheck}
              title="Privacy"
              description="Your workspace context and analysis history are stored locally in your browser."
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-success">
                Local only
              </span>
            </SettingsRow>

            <SettingsRow
              icon={Sparkles}
              title="AI Capabilities"
              description="Founder Intelligence Reports, event-scoped timeline chat, and the research assistant."
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                Enabled
              </span>
            </SettingsRow>
          </div>

          {/* About */}
          <div className="pv-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 border border-accent/25 text-accent">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">About PivotVault</h3>
                <p className="text-sm text-text-muted">Where Startup Lessons Live Forever</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              PivotVault is a startup-failure intelligence platform. Explore documented postmortems, generate
              Founder Intelligence Reports, and learn from the failures of others before making your own.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
