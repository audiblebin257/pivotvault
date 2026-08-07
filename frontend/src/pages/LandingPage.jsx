import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Sparkles, TrendingUp, TrendingDown, AlertTriangle,
  BookOpen, Brain, Gauge, ArrowRight, Zap, LineChart, Clock,
  ChevronRight, Award, FileText, Lightbulb, Flame, Activity
} from 'lucide-react';
import StartupCard from '../components/StartupCard';
import { useBookmarks } from '../context/BookmarkContext';
import { useTheme } from '../context/ThemeContext';
import * as mockApi from '../lib/mockApi';

/* ============================================================================
   Mini Sparkline Component - minimal, editorial
============================================================================= */
const MiniSparkline = ({ data, color = 'primary', height = 28 }) => {
  if (!data || data.length < 2) return null;
  const width = 80;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const last = data[data.length - 1];
  const first = data[0];
  const positive = last >= first;

  const colorMap = {
    primary: 'rgb(var(--chart-primary))',
    accent: 'rgb(var(--chart-secondary))',
    success: 'rgb(var(--chart-positive))',
    danger: 'rgb(var(--chart-negative))',
    auto: positive ? 'rgb(var(--chart-positive))' : 'rgb(var(--chart-negative))'
  };
  const stroke = colorMap[color] || colorMap.primary;
  const areaFill = stroke.replace('rgb(', 'rgba(').replace(')', ', 0.08)');

  return (
    <svg width={width} height={height} className="shrink-0">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#sg-${color})`}
      />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle
        cx={width}
        cy={height - ((last - min) / range) * (height - 4) - 2}
        r="2.5"
        fill={stroke}
      />
    </svg>
  );
};

/* ============================================================================
   Network Graph Visualization for Hero
============================================================================= */
const StartupNetworkGraph = () => {
  const { theme } = useTheme();
  const nodes = [
    { x: 50, y: 50, size: 14, type: 'center', label: 'Founder' },
    { x: 20, y: 30, size: 9, type: 'investor', label: 'VC' },
    { x: 78, y: 25, size: 10, type: 'startup', label: 'Startup' },
    { x: 82, y: 68, size: 8, type: 'competitor', label: 'Comp' },
    { x: 25, y: 78, size: 7, type: 'tech', label: 'Stack' },
    { x: 55, y: 18, size: 6, type: 'market', label: 'Market' },
    { x: 45, y: 82, size: 8, type: 'failure', label: 'Risk' },
    { x: 92, y: 48, size: 5, type: 'investor', label: 'Angel' },
    { x: 8, y: 58, size: 6, type: 'startup', label: 'Acq' },
    { x: 68, y: 52, size: 7, type: 'competitor', label: 'Rival' },
    { x: 35, y: 15, size: 5, type: 'tech', label: 'AI' },
    { x: 12, y: 15, size: 4, type: 'market', label: 'SaaS' },
  ];

  const edges = [
    [0, 1], [0, 2], [0, 4], [0, 6],
    [2, 3], [2, 9], [2, 7],
    [1, 8], [1, 11],
    [4, 10], [4, 6],
    [5, 0], [5, 2],
    [9, 3], [8, 4]
  ];

  const getNodeStyle = (type) => {
    switch (type) {
      case 'center':
        return theme === 'beige'
          ? { fill: '#151515', stroke: '#151515', label: '#fff' }
          : { fill: '#fff', stroke: '#fff', label: '#121212' };
      case 'investor':
        return { fill: 'rgb(var(--chart-secondary))', stroke: 'rgb(var(--chart-secondary))', label: 'rgb(var(--color-accent))' };
      case 'startup':
        return theme === 'beige'
          ? { fill: '#151515', stroke: '#151515' }
          : { fill: '#fff', stroke: '#fff' };
      case 'competitor':
        return { fill: 'rgb(var(--chart-negative))', stroke: 'rgb(var(--chart-negative))' };
      case 'tech':
        return { fill: 'rgb(var(--chart-secondary))', stroke: 'rgb(var(--chart-secondary))' };
      case 'market':
        return { fill: 'rgb(var(--chart-positive))', stroke: 'rgb(var(--chart-positive))' };
      case 'failure':
        return { fill: 'rgb(var(--chart-negative))', stroke: 'rgb(var(--chart-negative))' };
      default:
        return { fill: 'rgb(var(--chart-neutral))', stroke: 'rgb(var(--chart-neutral))' };
    }
  };

  const edgeColor = theme === 'beige' ? 'rgba(21,21,21,0.12)' : 'rgba(255,255,255,0.1)';

  return (
    <div className="relative w-full h-full">
      {/* Decorative grid */}
      <div className="absolute inset-0 bg-theme-grid-fine rounded-2xl opacity-60" />

      {/* Pulse rings around center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <motion.div
          className="absolute rounded-full border border-accent/10"
          style={{
            width: 40, height: 40,
            left: -20, top: -20,
          }}
          animate={{ scale: [1, 3.5], opacity: [0.5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute rounded-full border border-accent/8"
          style={{
            width: 40, height: 40,
            left: -20, top: -20,
          }}
          animate={{ scale: [1, 2.8], opacity: [0.4, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
        />
      </div>

      <svg viewBox="0 0 100 100" className="relative w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Edges */}
        {edges.map(([a, b], i) => {
          const n1 = nodes[a];
          const n2 = nodes[b];
          return (
            <motion.line
              key={`e-${i}`}
              x1={n1.x} y1={n1.y}
              x2={n2.x} y2={n2.y}
              stroke={edgeColor}
              strokeWidth="0.35"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: i * 0.07, ease: "easeOut" }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const style = getNodeStyle(node.type);
          return (
            <motion.g
              key={`n-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.06, type: "spring", stiffness: 200 }}
            >
              <motion.circle
                cx={node.x} cy={node.y}
                r={node.size / 5}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={node.type === 'center' ? '0.25' : '0.1'}
                animate={{ y: [0, -0.8, 0] }}
                transition={{
                  duration: 4 + (i % 3),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15
                }}
              />
            </motion.g>
          );
        })}
      </svg>

      {/* Legend corner */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 text-[10px]">
        <div className="flex items-center gap-2 text-text-muted">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: theme === 'beige' ? '#151515' : '#fff' }} />
          <span className="font-medium">Startup</span>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'rgb(var(--color-accent))' }} />
          <span className="font-medium">Investor</span>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'rgb(var(--color-danger))' }} />
          <span className="font-medium">Risk Node</span>
        </div>
      </div>

      {/* AI badge top-right */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-border bg-surface/80 backdrop-blur-sm">
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: 'rgb(var(--color-success))' }} />
          <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: 'rgb(var(--color-success))' }} />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Live Intel</span>
      </div>
    </div>
  );
};

/* ============================================================================
   3D Glowing Geometric Crystal Component (Matches User Hero Mockup)
============================================================================= */
const GlowingGeometricCrystal = () => {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    let animId;
    const animate = () => {
      setAngle((prev) => (prev + 0.005) % (Math.PI * 2));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const phi = (1 + Math.sqrt(5)) / 2;
  const rawVertices = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ];

  const cosY = Math.cos(angle);
  const sinY = Math.sin(angle);
  const cosX = Math.cos(angle * 0.65);
  const sinX = Math.sin(angle * 0.65);

  const rotatedVertices = rawVertices.map(([x, y, z]) => {
    let x1 = x * cosY + z * sinY;
    let z1 = -x * sinY + z * cosY;
    let y2 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;
    return { x: x1, y: y2, z: z2 };
  });

  const scale = 95;
  const projected = rotatedVertices.map((v) => ({
    x: 200 + v.x * scale,
    y: 200 + v.y * scale,
    z: v.z
  }));

  const edges = [];
  for (let i = 0; i < rawVertices.length; i++) {
    for (let j = i + 1; j < rawVertices.length; j++) {
      const dx = rawVertices[i][0] - rawVertices[j][0];
      const dy = rawVertices[i][1] - rawVertices[j][1];
      const dz = rawVertices[i][2] - rawVertices[j][2];
      const distSq = dx * dx + dy * dy + dz * dz;
      if (Math.abs(distSq - 4) < 0.25) {
        edges.push([i, j]);
      }
    }
  }

  return (
    <div className="relative w-full max-w-[420px] aspect-square mx-auto flex items-center justify-center pointer-events-none select-none">
      {/* Outer ambient glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/25 via-amber-400/20 to-transparent blur-3xl animate-pulse" />
      <div className="absolute inset-10 rounded-full bg-amber-500/15 blur-2xl" />

      {/* 3D SVG Crystal */}
      <svg viewBox="0 0 400 400" className="relative w-full h-full filter drop-shadow-[0_0_35px_rgba(245,158,11,0.6)]">
        <defs>
          <linearGradient id="crystalGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Radiant Inner Core */}
        <circle cx="200" cy="200" r="75" fill="url(#coreGlow)" />
        <circle cx="200" cy="200" r="28" fill="#ffffff" className="opacity-95 blur-[2px]" />

        {/* 3D Wireframe Edges */}
        {edges.map(([p1, p2], idx) => {
          const v1 = projected[p1];
          const v2 = projected[p2];
          const avgZ = (v1.z + v2.z) / 2;
          const opacity = 0.4 + ((avgZ + 2) / 4) * 0.6;
          const strokeWidth = 1.5 + ((avgZ + 2) / 4) * 1.8;

          return (
            <line
              key={idx}
              x1={v1.x}
              y1={v1.y}
              x2={v2.x}
              y2={v2.y}
              stroke="url(#crystalGold)"
              strokeWidth={strokeWidth}
              strokeOpacity={opacity}
              strokeLinecap="round"
            />
          );
        })}

        {/* Vertex Points */}
        {projected.map((v, idx) => {
          const opacity = 0.5 + ((v.z + 2) / 4) * 0.5;
          const r = 3 + ((v.z + 2) / 4) * 2;
          return (
            <circle
              key={idx}
              cx={v.x}
              cy={v.y}
              r={r}
              fill="#ffffff"
              stroke="url(#crystalGold)"
              strokeWidth="1.5"
              fillOpacity={opacity}
            />
          );
        })}
      </svg>
    </div>
  );
};

/* ============================================================================
   Landing Page
============================================================================= */
const LandingPage = () => {
  const navigate = useNavigate();
  const { slugs: bookmarks } = useBookmarks();
  const [query, setQuery] = useState('');
  const [startups, setStartups] = useState([]);
  const [featuredStartups, setFeaturedStartups] = useState([]);
  const [recentStartups, setRecentStartups] = useState([]);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const s = mockApi.mockStartups || [];
    setStartups(s);
    setFeaturedStartups(s.filter(st => st.featured).slice(0, 4));
    setRecentStartups(s.slice(0, 6));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/explore?q=${encodeURIComponent(query)}`);
    }
  };

  const suggestedPrompts = [
    { icon: <AlertTriangle className="w-3.5 h-3.5" />, text: "Why did Quibi fail?", },
    { icon: <LineChart className="w-3.5 h-3.5" />, text: "Top SaaS failures 2024" },
    { icon: <Zap className="w-3.5 h-3.5" />, text: "Compare Theranos vs Juicero" },
    { icon: <FileText className="w-3.5 h-3.5" />, text: "Playbook for pre-seed startups" },
  ];

  const intelPulse = [
    { type: 'failure', tag: 'FINTECH', name: 'Plastiq', detail: '$538M raised — filed Chapter 11', time: '12m' },
    { type: 'analysis', tag: 'AI', name: 'Claude', detail: 'Risk score updated: 24 → 31', time: '34m' },
    { type: 'failure', tag: 'HEALTH', name: 'Olive AI', detail: '$852M burned — shutdown imminent', time: '1h' },
    { type: 'analysis', tag: 'CRYPTO', name: 'CoinList', detail: 'New competitor threat detected', time: '2h' },
    { type: 'failure', tag: 'SAAS', name: 'Hack the Planet', detail: 'Burn rate unsustainable', time: '3h' },
    { type: 'insight', tag: 'ECON', name: 'Q3 Trends', detail: 'PMF failure up 18% vs last quarter', time: '4h' },
    { type: 'analysis', tag: 'EDU', name: 'MasterClass', detail: 'Retention weakness flagged', time: '5h' },
    { type: 'failure', tag: 'ECOM', name: 'Fast', detail: 'Playbook analysis complete', time: '6h' },
  ];

  const kpiCards = [
    {
      label: 'Total Failures',
      value: '413',
      change: '+18',
      positive: false,
      spark: [20, 32, 28, 45, 42, 58, 62, 55, 72, 75],
      sub: 'This quarter',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    {
      label: 'Vaulted Startups',
      value: '413',
      change: '+214',
      positive: true,
      spark: [30, 34, 38, 42, 41, 46, 50, 54, 55, 60],
      sub: 'With postmortems',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      label: 'Avg. Risk Score',
      value: '68.4',
      change: '+3.2',
      positive: false,
      spark: [55, 58, 60, 62, 61, 65, 66, 67, 68, 68.4],
      sub: 'All analyzed startups',
      icon: <Gauge className="w-4 h-4" />
    },
    {
      label: 'AI Insights Generated',
      value: '48,209',
      change: '+1,204',
      positive: true,
      spark: [10, 18, 22, 28, 32, 38, 45, 48, 52, 56],
      sub: 'Last 30 days',
      icon: <Brain className="w-4 h-4" />
    }
  ];

  const aiInsights = [
    {
      eyebrow: 'TODAY\'S PATTERN',
      title: 'The "No Product-Market Fit" Death Spiral',
      description: '43% of failures this month share an identical pattern: premature scaling before 100 happy customers. Seen in Quibi, WeWork, and 127 others.',
      severity: 'high',
      stat: '43%',
      chartType: 'bar',
      data: [65, 42, 58, 71, 43]
    },
    {
      eyebrow: 'EMERGING RISK',
      title: 'Burn Rate Multiplier',
      description: 'Startups spending 3.2x revenue are 11x more likely to fail. Fintech leads with average 5.7x burn.',
      severity: 'medium',
      stat: '11x',
      chartType: 'line',
      data: [1.2, 1.8, 2.4, 2.6, 3.1, 2.9, 3.4, 3.2]
    },
    {
      eyebrow: 'MOST COMMON MISTAKE',
      title: 'Premature Scaling',
      description: 'The #1 killer of Series A startups. The pattern: raise → triple team size → burn 7x → no revenue → pivot too late.',
      severity: 'high',
      stat: '38%',
      chartType: 'donut',
      data: [38, 22, 18, 12, 10]
    },
    {
      eyebrow: 'INVESTMENT SIGNAL',
      title: 'AI Startup Failure Rate',
      description: 'AI startups failing at 2.1x rate vs 2023. Most common cause: no moat against foundation model providers.',
      severity: 'warning',
      stat: '2.1x',
      chartType: 'line',
      data: [8, 10, 14, 12, 17, 18, 22, 21]
    }
  ];

/* ============================================================================
   3D Glowing Geometric Crystal Component (Matches User Hero Mockup)
============================================================================= */
const GlowingGeometricCrystal = () => {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    let animId;
    const animate = () => {
      setAngle((prev) => (prev + 0.005) % (Math.PI * 2));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const phi = (1 + Math.sqrt(5)) / 2;
  const rawVertices = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ];

  const cosY = Math.cos(angle);
  const sinY = Math.sin(angle);
  const cosX = Math.cos(angle * 0.65);
  const sinX = Math.sin(angle * 0.65);

  const rotatedVertices = rawVertices.map(([x, y, z]) => {
    let x1 = x * cosY + z * sinY;
    let z1 = -x * sinY + z * cosY;
    let y2 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;
    return { x: x1, y: y2, z: z2 };
  });

  const scale = 95;
  const projected = rotatedVertices.map((v) => ({
    x: 200 + v.x * scale,
    y: 200 + v.y * scale,
    z: v.z
  }));

  const edges = [];
  for (let i = 0; i < rawVertices.length; i++) {
    for (let j = i + 1; j < rawVertices.length; j++) {
      const dx = rawVertices[i][0] - rawVertices[j][0];
      const dy = rawVertices[i][1] - rawVertices[j][1];
      const dz = rawVertices[i][2] - rawVertices[j][2];
      const distSq = dx * dx + dy * dy + dz * dz;
      if (Math.abs(distSq - 4) < 0.25) {
        edges.push([i, j]);
      }
    }
  }

  return (
    <div className="relative w-full max-w-[420px] aspect-square mx-auto flex items-center justify-center pointer-events-none select-none">
      {/* Outer ambient glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/25 via-amber-400/20 to-transparent blur-3xl animate-pulse" />
      <div className="absolute inset-10 rounded-full bg-amber-500/15 blur-2xl" />

      {/* 3D SVG Crystal */}
      <svg viewBox="0 0 400 400" className="relative w-full h-full filter drop-shadow-[0_0_35px_rgba(245,158,11,0.6)]">
        <defs>
          <linearGradient id="crystalGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Radiant Inner Core */}
        <circle cx="200" cy="200" r="75" fill="url(#coreGlow)" />
        <circle cx="200" cy="200" r="28" fill="#ffffff" className="opacity-95 blur-[2px]" />

        {/* 3D Wireframe Edges */}
        {edges.map(([p1, p2], idx) => {
          const v1 = projected[p1];
          const v2 = projected[p2];
          const avgZ = (v1.z + v2.z) / 2;
          const opacity = 0.4 + ((avgZ + 2) / 4) * 0.6;
          const strokeWidth = 1.5 + ((avgZ + 2) / 4) * 1.8;

          return (
            <line
              key={idx}
              x1={v1.x}
              y1={v1.y}
              x2={v2.x}
              y2={v2.y}
              stroke="url(#crystalGold)"
              strokeWidth={strokeWidth}
              strokeOpacity={opacity}
              strokeLinecap="round"
            />
          );
        })}

        {/* Vertex Points */}
        {projected.map((v, idx) => {
          const opacity = 0.5 + ((v.z + 2) / 4) * 0.5;
          const r = 3 + ((v.z + 2) / 4) * 2;
          return (
            <circle
              key={idx}
              cx={v.x}
              cy={v.y}
              r={r}
              fill="#ffffff"
              stroke="url(#crystalGold)"
              strokeWidth="1.5"
              fillOpacity={opacity}
            />
          );
        })}
      </svg>
    </div>
  );
};
  return (
    <div className="min-h-screen bg-bg">
      {/* ================================================================
         HERO SECTION (Matches User UI Mockup)
      ================================================================ */}
      <section className="relative overflow-hidden pt-10 md:pt-16 pb-20 md:pb-28 bg-hero-glow">
        {/* Decorative background grid */}
        <div className="absolute inset-0 bg-theme-grid opacity-30 pointer-events-none" style={{ maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)' }} />

        <div className="pv-content-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Headlines, Pill Search & Prompts */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7"
            >
              {/* Bold Split Headline */}
              <h1 className="text-[52px] sm:text-[68px] lg:text-[76px] font-display font-extrabold leading-[1.03] tracking-tight text-text-primary mb-4">
                Learn from <br />
                startup failures.
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl mb-8 font-normal">
                PivotVault: Intelligence platform to study failures, compare playbooks, and detect risks before they happen.
              </p>

              {/* Pill Search Bar (Matching Mockup) */}
              <form onSubmit={handleSearch} className="mb-6 max-w-2xl">
                <div className="relative flex items-center bg-surface border border-border/80 rounded-full p-1.5 pl-6 pr-2 shadow-card transition-all duration-200 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/20">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search 400+ startup failures, risks, and playbooks..."
                    className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm md:text-base text-text-primary placeholder:text-text-muted"
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-full bg-surface-2 hover:bg-accent text-text-muted hover:text-accent-contrast flex items-center justify-center transition-all duration-200 shrink-0"
                    aria-label="Search"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Suggested Prompt Chips (Matching Mockup) */}
              <div className="flex flex-wrap items-center gap-2.5 max-w-3xl">
                {suggestedPrompts.map((p, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.15 + i * 0.06 }}
                    onClick={() => {
                      setQuery(p.text);
                      navigate(`/explore?q=${encodeURIComponent(p.text)}`);
                    }}
                    className="px-4 py-2.5 rounded-2xl border border-border bg-surface-2/60 backdrop-blur-sm text-xs font-medium text-text-secondary transition-all duration-200 hover:border-accent/40 hover:text-text-primary hover:bg-surface"
                  >
                    {p.text}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Right Column: 3D Glowing Geometric Crystal Graphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 flex justify-center items-center"
            >
              <GlowingGeometricCrystal />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ================================================================
         LIVE INTEL PULSE TICKER
      ================================================================ */}
      <section className="border-y border-border bg-surface-2/40 overflow-hidden">
        <div className="pv-content-container flex items-stretch gap-0 py-0">
          <div className="shrink-0 flex items-center gap-2.5 pr-5 border-r border-border py-4 mr-5">
            <div className="relative">
              <Activity className="w-4 h-4 text-accent" />
              <span className="absolute inset-0 w-full h-full rounded-full animate-ping-subtle" style={{ background: 'rgb(var(--color-accent))', opacity: 0.3 }} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-secondary whitespace-nowrap">Live Intel Pulse</span>
          </div>
          <div className="ticker-wrap flex-1 py-4">
            <div className="flex gap-12 whitespace-nowrap animate-ticker w-max">
              {[...intelPulse, ...intelPulse, ...intelPulse].map((item, i) => (
                <div key={i} className="inline-flex items-center gap-3 shrink-0">
                  <span className={clsx(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                    item.type === 'failure' && "border-danger/25 text-danger bg-danger/10",
                    item.type === 'analysis' && "border-accent/30 text-accent bg-accent/10",
                    item.type === 'insight' && "border-success/30 text-success bg-success/10",
                  )}>
                    {item.tag}
                  </span>
                  <span className="text-[13px] font-semibold text-text-primary">{item.name}</span>
                  <span className="text-[12px] text-text-secondary">— {item.detail}</span>
                  <span className="text-[10px] text-text-muted font-mono ml-1">{item.time} ago</span>
                  {i % intelPulse.length !== intelPulse.length - 1 && (
                    <span className="text-border text-xs">•</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
         KPI CARDS
      ================================================================ */}
      <section className="pv-content-container py-14 md:py-18">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {kpiCards.map((k, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="pv-card p-5 md:p-6 relative overflow-hidden group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-surface-2/70 text-text-secondary">
                    {k.icon}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{k.label}</span>
                </div>
                <span className={clsx(
                  "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold",
                  k.positive
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-danger/10 text-danger border border-danger/20"
                )}>
                  {k.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {k.change}
                </span>
              </div>

              <div className="flex items-end justify-between mb-3">
                <div className="text-3xl md:text-[34px] font-display font-bold leading-none tracking-tight text-text-primary">
                  {k.value}
                </div>
                <MiniSparkline data={k.spark} color="auto" height={30} />
              </div>

              <div className="text-xs text-text-muted pt-2 border-t border-border/60">
                {k.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================================================================
         FEATURED POSTMORTEMS
      ================================================================ */}
      <section className="pv-content-container pb-16 md:pb-20">
        <div className="pv-section-title mb-8">
          <div>
            <div className="pv-eyebrow mb-2 text-accent">
              <FileText className="w-3.5 h-3.5 inline mr-2" strokeWidth={2.2} />
              Featured Postmortems
            </div>
            <h2 className="text-2xl md:text-[30px] font-display font-bold tracking-tight mb-1">
              Stories worth studying.
            </h2>
            <p className="text-sm md:text-base text-text-secondary">
              Deep-dive case studies written from real founder postmortems, investor reports, and SEC filings.
            </p>
          </div>
          <Link to="/explore" className="pv-btn-ghost text-sm gap-1.5 shrink-0 hidden sm:inline-flex">
            View all failures <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {featuredStartups.map((s, i) => {
            const hasBookmark = bookmarks.includes(s.id);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <StartupCard startup={s} layout="featured" hasBookmark={hasBookmark} />
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ================================================================
         AI INSIGHTS SECTION
      ================================================================ */}
      <section className="pv-content-container pb-16 md:pb-20">
        <div className="mb-8">
          <div className="pv-eyebrow mb-2 text-accent">
            <Brain className="w-3.5 h-3.5 inline mr-2" strokeWidth={2.2} />
            AI Insights Engine
          </div>
          <h2 className="text-2xl md:text-[30px] font-display font-bold tracking-tight mb-1">
            Patterns, not coincidences.
          </h2>
          <p className="text-sm md:text-base text-text-secondary max-w-2xl">
            Every failure is cross-referenced against 413 case studies. These are the recurring patterns emerging today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {aiInsights.map((ins, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={clsx(
                "pv-card p-6 relative overflow-hidden group",
                ins.severity === 'high' && "ring-1 ring-danger/10",
                ins.severity === 'warning' && "ring-1 ring-warning/10"
              )}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between mb-5 gap-4">
                <div className="flex-1">
                  <div className={clsx(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 border",
                    ins.severity === 'high' && "bg-danger/10 text-danger border-danger/25",
                    ins.severity === 'medium' && "bg-warning/10 text-warning border-warning/25",
                    ins.severity === 'warning' && "bg-accent/10 text-accent border-accent/25"
                  )}>
                    {ins.severity === 'high' && <AlertTriangle className="w-3 h-3" />}
                    {ins.eyebrow}
                  </div>
                  <h3 className="text-lg md:text-xl font-display font-bold tracking-tight leading-snug text-text-primary mb-2.5">
                    {ins.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {ins.description}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end">
                  <div className="text-4xl font-display font-bold leading-none tracking-tight" style={{ color: ins.severity === 'high' ? 'rgb(var(--color-danger))' : ins.severity === 'warning' ? 'rgb(var(--color-warning))' : 'rgb(var(--color-accent))' }}>
                    {ins.stat}
                  </div>
                </div>
              </div>

              {/* Mini Chart Area */}
              <div className="pt-4 border-t border-border/70">
                {ins.chartType === 'bar' && (
                  <div className="flex items-end gap-1.5 h-14">
                    {ins.data.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex-1 rounded-t-md transition-all duration-300 hover:opacity-80"
                        style={{
                          height: `${v}%`,
                          background: idx === ins.data.length - 1
                            ? 'rgb(var(--color-danger))'
                            : 'rgb(var(--color-text-primary))',
                          opacity: idx === ins.data.length - 1 ? 1 : 0.18 + idx * 0.1
                        }}
                      />
                    ))}
                  </div>
                )}
                {ins.chartType === 'line' && (
                  <div className="w-full h-14 flex items-center">
                    <MiniSparkline data={ins.data} color={ins.severity === 'high' ? 'danger' : 'accent'} height={48} />
                    <div className="flex-1" />
                    <MiniSparkline data={[...ins.data].reverse()} color="primary" height={48} />
                  </div>
                )}
                {ins.chartType === 'donut' && (
                  <div className="flex items-center justify-between gap-4 h-14">
                    <div className="relative w-14 h-14 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--color-border))" strokeWidth="4" />
                        {(() => {
                          const colors = ['danger', 'accent', 'primary', 'success', 'warning'];
                          let cumulative = 0;
                          const total = ins.data.reduce((a, b) => a + b, 0);
                          return ins.data.map((v, idx) => {
                            const pct = (v / total) * 100;
                            const dash = (pct / 100) * 100;
                            const el = (
                              <circle
                                key={idx}
                                cx="18" cy="18" r="15.9"
                                fill="none"
                                stroke={`rgb(var(--color-${colors[idx]}))`}
                                strokeWidth="4"
                                strokeDasharray={`${dash} ${100 - dash}`}
                                strokeDashoffset={-cumulative}
                                strokeLinecap="butt"
                              />
                            );
                            cumulative += dash;
                            return el;
                          });
                        })()}
                      </svg>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-y-1 gap-x-3 text-[11px]">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <span className="w-2 h-2 rounded-sm bg-danger" />
                        <span>Premature Scale</span>
                        <span className="ml-auto font-mono font-bold text-text-primary">38%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <span className="w-2 h-2 rounded-sm" style={{ background: 'rgb(var(--color-accent))' }} />
                        <span>No PMF</span>
                        <span className="ml-auto font-mono font-bold text-text-primary">22%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <span className="w-2 h-2 rounded-sm" style={{ background: 'rgb(var(--color-text-primary))' }} />
                        <span>Burn Out</span>
                        <span className="ml-auto font-mono font-bold text-text-primary">18%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <span className="w-2 h-2 rounded-sm bg-success" />
                        <span>Other</span>
                        <span className="ml-auto font-mono font-bold text-text-primary">22%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <button onClick={() => navigate('/insights')} className="mt-5 w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-surface-2/60 hover:bg-surface-2 transition-colors group">
                <span className="text-sm font-medium text-text-primary">Explore this dataset</span>
                <ChevronRight className="w-4 h-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================================================================
         RECENTLY VAULTED
      ================================================================ */}
      <section className="pv-content-container pb-20 md:pb-24">
        <div className="pv-section-title mb-8">
          <div>
            <div className="pv-eyebrow mb-2 text-accent">
              <Clock className="w-3.5 h-3.5 inline mr-2" strokeWidth={2.2} />
              Recently Vaulted
            </div>
            <h2 className="text-2xl md:text-[30px] font-display font-bold tracking-tight mb-1">
              Newly indexed failures.
            </h2>
            <p className="text-sm md:text-base text-text-secondary">
              Just-added postmortems and risk assessments fresh from the research vault.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recentStartups.map((s, i) => {
            const hasBookmark = bookmarks.includes(s.id);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
              >
                <StartupCard startup={s} layout="compact" hasBookmark={hasBookmark} />
              </motion.div>
            );
          })}
        </div>

        {/* CTA row */}
        <div className="mt-12 pv-card p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgb(var(--color-accent))/0.12), transparent 70%)' }} />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center relative">
            <div className="md:col-span-3">
              <div className="pv-eyebrow mb-3 text-accent">
                <Lightbulb className="w-3.5 h-3.5 inline mr-2" strokeWidth={2.2} />
                Stop learning the hard way.
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold tracking-tight leading-tight text-text-primary mb-3">
                Every failure is a tuition someone else already paid.
              </h3>
              <p className="text-base text-text-secondary leading-relaxed">
                Study 413 failed startups, run risk assessments on your own ideas, and generate data-backed playbooks.
              </p>
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row md:flex-col gap-3 md:items-end">
              <button onClick={() => navigate('/explore')} className="pv-btn-primary h-12 px-6 text-[14px] font-semibold md:min-w-[220px] justify-center">
                Explore the Vault
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <button onClick={() => navigate('/risk-scanner')} className="pv-btn-secondary h-12 px-6 text-[14px] font-semibold md:min-w-[220px] justify-center">
                <Zap className="w-4 h-4 mr-1.5" style={{ color: 'rgb(var(--color-accent))' }} />
                Risk-Scan My Idea
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

function clsx(...args) { return args.filter(Boolean).map(a => typeof a === 'string' ? a : Object.entries(a || {}).filter(([, v]) => v).map(([k]) => k).join(' ')).join(' '); }

export default LandingPage;
