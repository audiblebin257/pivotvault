import React, { useState } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Share2, Sparkles, Bookmark, Settings, FileText,
  ChevronLeft, ChevronRight, ChevronDown, User, Plus
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useDesignSystem } from '../lib/design-system';

// Tree-branch sub-item component for expanded menu
const TreeSubItem = ({ path, label, icon: Icon, onClick, tour }) => {
  const { isBeige } = useDesignSystem();
  return (
    <div className="relative flex items-center pl-6 py-1 group">
      {/* Curved Tree Branch Connector Line */}
      <span className="absolute left-3.5 top-0 bottom-1/2 w-3 border-l-2 border-b-2 border-border/60 rounded-bl-lg pointer-events-none group-hover:border-accent/60 transition-colors" />
      
      <NavLink
        to={path}
        onClick={onClick}
        data-tour={tour}
        className={({ isActive }) => clsx(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 select-none",
          isActive
            ? (isBeige 
                ? "bg-surface-3 text-text-primary font-bold border-l-2 border-black pl-2 rounded-r-xl rounded-l-none" 
                : "bg-surface-3 text-text-primary font-bold border-l-2 border-white pl-2 rounded-r-xl rounded-l-none")
            : "text-text-secondary hover:text-text-primary hover:bg-surface-2/80"
        )}
      >
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />}
        <span className="truncate">{label}</span>
      </NavLink>
    </div>
  );
};

// Expandable Group item (e.g. Explore / AI Intelligence / Analysis)
const ExpandableNavGroup = ({ group, isCollapsed, onItemClick }) => {
  const location = useLocation();
  const Icon = group.icon;
  const isChildActive = group.items.some(sub => location.pathname === sub.path);
  const [isOpen, setIsOpen] = useState(isChildActive || group.defaultOpen);
  const [isHovered, setIsHovered] = useState(false);

  React.useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [isChildActive]);

  if (isCollapsed) {
    return (
      <div 
        className="relative mx-auto my-1 select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          aria-label={group.name}
          className={clsx(
            "w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200",
            isChildActive 
              ? "bg-surface-3 text-text-primary border border-border shadow-xs" 
              : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
          )}
        >
          <Icon className="w-5 h-5 shrink-0" />
        </button>

        {/* Collapsed Right Floating Popover Sub-Menu */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute left-full top-0 ml-3 w-48 p-2 bg-surface/95 backdrop-blur-xl border border-border shadow-elevated rounded-2xl z-50 space-y-1"
            >
              <div className="px-2.5 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border/40 mb-1">
                {group.name}
              </div>
              {group.items.map(sub => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  onClick={onItemClick}
                  data-tour={sub.tour}
                  className={({ isActive }) => clsx(
                    "flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                    isActive ? "bg-surface-3 text-text-primary font-bold" : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                  )}
                >
                  {sub.icon && <sub.icon className="w-3.5 h-3.5" />}
                  <span className="truncate">{sub.name}</span>
                </NavLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="mb-2 select-none">
      {/* Group Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200",
          isChildActive
            ? "bg-surface-2 text-text-primary border border-border/80 shadow-xs"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-2/60"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={clsx(
            "p-1.5 rounded-lg shrink-0 transition-colors",
            isChildActive ? "bg-surface-3 text-text-primary" : "bg-surface text-text-muted"
          )}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="truncate text-xs font-bold tracking-tight">{group.name}</span>
        </div>
        <ChevronDown className={clsx(
          "w-4 h-4 text-text-muted transition-transform duration-200 shrink-0",
          isOpen && "rotate-180 text-text-primary"
        )} />
      </button>

      {/* Accordion Branch Sub-List */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden relative pt-1"
          >
            {/* Vertical Guide Line */}
            <span className="absolute left-3.5 top-0 bottom-4 w-0.5 bg-border/40 pointer-events-none" />

            {group.items.map((sub) => (
              <TreeSubItem
                key={sub.path}
                path={sub.path}
                label={sub.name}
                icon={sub.icon}
                tour={sub.tour}
                onClick={onItemClick}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  React.useEffect(() => {
    if (!isMobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMobileOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen, setIsMobileOpen]);

  // Simplified Core Navigation — one cohesive product, no duplicate analysis pages
  const mainGroups = [
    {
      name: 'Core',
      icon: LayoutGridIcon,
      defaultOpen: true,
      items: [
        { name: 'Explore', path: '/explore', icon: Search, tour: 'explore' },
        { name: 'AI Research Assistant', path: '/assistant', icon: Sparkles, tour: 'assistant' },
        { name: 'Founder Intelligence Report', path: '/report', icon: FileText, tour: 'report' },
        { name: 'Startup Graph', path: '/graph', icon: Share2, tour: 'graph' },
        { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
        { name: 'Settings', path: '/settings', icon: Settings },
      ]
    }
  ];

  // Direct items section removed — navigation is now a single flat Core group.

  // Featured / Recent Founder Case Studies
  const featuredFounders = [
    { name: 'Quibi Postmortem', slug: 'quibi', avatar: 'Q', status: 'bg-danger' },
    { name: 'Theranos Autopsy', slug: 'theranos', avatar: 'T', status: 'bg-warning' },
    { name: 'WeWork Collapse', slug: 'wework', avatar: 'W', status: 'bg-success' },
  ];

  const userInitials = (user?.name || 'Andrew Smith')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const renderSidebarContent = (collapsed, isDrawer = false) => (
    <div className="relative flex flex-col h-full bg-bg text-text-primary border-r border-border select-none overflow-visible font-body transition-colors duration-200">
      {/* Edge Floating Collapse Toggle Button */}
      {!isDrawer && (
        <button
          type="button"
          onClick={() => setIsCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex absolute -right-3.5 top-6 z-50 w-7 h-7 rounded-full bg-surface border border-border shadow-elevated items-center justify-center text-text-secondary hover:text-text-primary hover:scale-110 transition-all duration-200"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Top Section: User Profile Card (Matches Image Header) */}
      <div className={clsx(
        "shrink-0 transition-all duration-200 p-4 border-b border-border/60",
        collapsed ? "flex justify-center" : ""
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative shrink-0 w-11 h-11 rounded-2xl bg-surface-3 border border-border text-text-primary font-display font-black text-sm flex items-center justify-center shadow-xs">
              {userInitials}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-bg" />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted truncate">FOUNDER / OPERATOR</span>
              <span className="text-sm font-bold text-text-primary truncate leading-tight">
                {user?.name || 'Andrew Smith'}
              </span>
            </div>
          </div>
        ) : (
          <div title={user?.name || 'Andrew Smith'} className="relative shrink-0 w-10 h-10 rounded-2xl bg-surface-3 border border-border text-text-primary font-display font-bold text-xs flex items-center justify-center">
            {userInitials}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-bg" />
          </div>
        )}
      </div>

      {/* Middle Navigation Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border/40 px-3 py-4 space-y-5">
        {/* MAIN Section */}
        <div>
          {!collapsed && (
            <div className="px-2 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">
              MAIN
            </div>
          )}
          <div className="space-y-1">
            {mainGroups.map((group) => (
              <ExpandableNavGroup
                key={group.name}
                group={group}
                isCollapsed={collapsed}
                onItemClick={() => setIsMobileOpen(false)}
              />
            ))}
          </div>
        </div>
        {/* FEATURED CASE STUDIES / MESSAGES LIST */}
        <div>

          {!collapsed && (
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">FEATURED VAULTS</span>
              <Plus className="w-3.5 h-3.5 text-text-muted cursor-pointer hover:text-text-primary" />
            </div>
          )}
          <div className="space-y-1.5">
            {featuredFounders.map((f) => (
              <Link
                key={f.slug}
                to={`/startup/${f.slug}`}
                onClick={() => setIsMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-surface-2/80 group",
                  collapsed ? "justify-center" : ""
                )}
              >
                <div className="relative shrink-0 w-8 h-8 rounded-full bg-surface-2 border border-border text-text-primary font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                  {f.avatar}
                  <span className={clsx("absolute bottom-0 right-0 w-2 h-2 rounded-full border border-bg", f.status)} />
                </div>
                {!collapsed && (
                  <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary truncate">
                    {f.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Floating CTA Card / Action Button (Matches Image Bottom Card) */}
      <div className="shrink-0 p-3 border-t border-border bg-bg">
        {!collapsed ? (
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card space-y-3">
            <div>
              <h4 className="text-sm font-bold text-text-primary leading-snug">Let's start!</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Generate a full Founder Intelligence Report for any idea, company or deck.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/report')}
              className="w-full h-11 rounded-xl bg-accent text-accent-contrast hover:bg-accent-2 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Generate Report</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/report')}
            title="Generate Intelligence Report"
            className="w-11 h-11 mx-auto rounded-xl bg-accent text-accent-contrast hover:bg-accent-2 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Container */}
      <aside className="pv-desktop-sidebar hidden lg:flex">
        <div className="h-full w-full min-w-0 overflow-visible">
          {renderSidebarContent(isCollapsed)}
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[70] w-[min(20rem,calc(100vw-3rem))] border-r border-border bg-bg shadow-elevated lg:hidden"
              aria-label="Primary navigation"
            >
              <div className="h-full w-full">
                {renderSidebarContent(false, true)}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Helper Grid icon for Main group header
function LayoutGridIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export default Sidebar;


