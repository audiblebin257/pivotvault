import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Skull, Search, Zap, BarChart2, MessageSquare, Share2, X, Sparkles,
  Brain, GitCompare, ClipboardCheck,
  FileText, PanelLeftClose, PanelLeft, Ghost
} from 'lucide-react';
import { clsx } from 'clsx';

const SidebarItem = ({ item, isCollapsed, onClick }) => {
  const Icon = item.icon;
  
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      data-tour={item.tour}
      title={isCollapsed ? item.name : undefined}
      aria-label={item.name}
      className={({ isActive }) => clsx(
        "pv-nav-item relative group mb-1",
        isCollapsed ? "justify-center h-12 w-12 mx-auto" : "px-3 py-2.5 gap-3 mx-2",
        isActive 
          ? "pv-nav-item-active font-bold"
          : ""
      )}
    >
      {({ isActive }) => (
        <>
          <Icon className={clsx(
            "shrink-0 transition-transform duration-200 group-hover:scale-110", 
            isCollapsed ? "w-6 h-6" : "w-5 h-5",
            isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
          )} />
          
          {!isCollapsed && <span className="text-sm tracking-tight whitespace-nowrap">{item.name}</span>}
          
          {/* Active Indicator */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className={clsx(
                "absolute bg-accent rounded-full",
                isCollapsed ? "right-0 w-1 h-6" : "left-0 w-1 h-5"
              )}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}

        </>
      )}
    </NavLink>
  );
};

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();

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

  const coreNav = [
    { name: 'Explore', path: '/explore', icon: Search, tour: 'explore' },
    { name: 'AI Assistant', path: '/assistant', icon: Sparkles, tour: 'assistant' },
    { name: 'Risk Scanner', path: '/scan', icon: Zap, tour: 'scan' },
    { name: 'Founder Playbook', path: '/playbook', icon: ClipboardCheck, tour: 'playbook' },
  ];

  const analysisNav = [
    { name: 'Pitch Deck Autopsy', path: '/autopsy', icon: FileText, tour: 'autopsy' },
    { name: 'Competitor Compare', path: '/compare', icon: GitCompare },
    { name: 'Insights Dashboard', path: '/insights', icon: BarChart2, tour: 'insights' },
    { name: 'Startup Graph', path: '/graph', icon: Share2 },
  ];

  const learnNav = [
    { name: 'Failure Quiz', path: '/quiz', icon: Brain },
    { name: 'Founder Confessions', path: '/confessions', icon: MessageSquare },
    { name: 'Hall of Ghosts', path: '/ghosts', icon: Ghost },
  ];

  const renderSidebarContent = (collapsed, isDrawer = false) => (
    <div className="flex flex-col h-full">
      {/* Header with Logo & Toggle */}
      <div className={clsx(
        "flex items-center shrink-0 h-20 border-b border-border/40 mb-6",
        collapsed ? "justify-center" : "px-4 justify-between"
      )}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-3 group min-w-0">
            <div className="relative shrink-0">
              <Skull className="w-7 h-7 text-accent group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-accent/15 blur-lg rounded-full" />
            </div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="min-w-0"
            >
              <div className="font-display font-black text-lg tracking-tight text-text-primary leading-none truncate">PIVOTVAULT</div>
              <div className="text-[9px] text-text-muted font-bold mt-1 uppercase tracking-tighter">Failure Intel</div>
            </motion.div>
          </Link>
        )}

        <button
          type="button"
          onClick={() => isDrawer ? setIsMobileOpen(false) : setIsCollapsed(!collapsed)}
          aria-label={isDrawer ? 'Close navigation' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={isDrawer ? isMobileOpen : !collapsed}
          className={clsx('pv-btn-ghost pv-btn-icon h-9 w-9', !isDrawer && 'hidden lg:inline-flex')}
        >
          {isDrawer ? <X className="w-4 h-4" /> : collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border/40 px-2 py-2">
        <NavSection title="Core" items={coreNav} isCollapsed={collapsed} onItemClick={() => setIsMobileOpen(false)} />
        <NavSection title="Analysis" items={analysisNav} isCollapsed={collapsed} onItemClick={() => setIsMobileOpen(false)} />
        <NavSection title="Learn" items={learnNav} isCollapsed={collapsed} onItemClick={() => setIsMobileOpen(false)} />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="pv-desktop-sidebar hidden lg:flex">
        <div className="h-full w-full min-w-0 overflow-hidden">
          {renderSidebarContent(isCollapsed)}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
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

const NavSection = ({ title, items, isCollapsed, onItemClick }) => (
  <div className="mb-4">
    {!isCollapsed && (
      <div className="px-4 mb-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-60">
        {title}
      </div>
    )}
    <div className="space-y-0.5">
      {items.map((item) => (
        <SidebarItem key={item.path} item={item} isCollapsed={isCollapsed} onClick={onItemClick} />
      ))}
    </div>
  </div>
);

export default Sidebar;
