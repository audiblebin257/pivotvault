import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { drag as d3Drag } from 'd3-drag';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceX,
  forceY,
  forceCollide
} from 'd3-force';
import 'd3-transition';
import { ZoomIn, ZoomOut, RotateCcw, Building2, MapPin, Skull, X, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';
import api from '../lib/api';

// Node colors based on group type
const getNodeColor = (d) => {
  const colors = {
    1: { fill: '#C99134', stroke: '#E5B26A', glow: 'rgba(201,145,52,0.4)' }, // Company
    2: { fill: '#3B82F6', stroke: '#60A5FA', glow: null }, // Industry
    3: { fill: '#10B981', stroke: '#34D399', glow: null }, // Technology
    4: { fill: '#8B5CF6', stroke: '#A78BFA', glow: null }, // Market
    5: { fill: '#F59E0B', stroke: '#FBBF24', glow: null }, // Product
    6: { fill: '#06B6D4', stroke: '#22D3EE', glow: null }, // Accelerator
    7: { fill: '#EC4899', stroke: '#F472B6', glow: null }, // Founder
    8: { fill: '#64748B', stroke: '#94A3B8', glow: null }, // Investor
    9: { fill: '#EF4444', stroke: '#F87171', glow: 'rgba(239,68,68,0.4)' }, // Failure
  };
  return colors[d.group] || colors[1];
};

const KnowledgeGraph = () => {
  const { companyId } = useParams();
  const containerRef = React.useRef(null);
  const svgRef = React.useRef(null);
  const zoomRef = React.useRef(null);
  const [data, setData] = React.useState(null);
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { theme } = useTheme();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        let url = '/graph/data';
        if (companyId) url += `?companyId=${companyId}`;
        const response = await api.get(url);
        setData(response.data);
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId]);

  React.useEffect(() => {
    if (!data || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clear previous
    select(containerRef.current).selectAll("svg").remove();

    const svg = select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    svgRef.current = svg.node();

    const g = svg.append("g");

    const zoom = d3Zoom()
      .scaleExtent([0.2, 5])
      .on("zoom", (event) => g.attr("transform", event.transform));

    zoomRef.current = zoom;
    svg.call(zoom);

    const processedNodes = [...data.nodes];
    const processedLinks = [...data.links];

    const simulation = forceSimulation(processedNodes)
      .force("link", forceLink(processedLinks).id(d => d.id).distance(180))
      .force("charge", forceManyBody().strength(-800))
      .force("center", forceCenter(width / 2, height / 2))
      .force("x", forceX(width / 2).strength(0.03))
      .force("y", forceY(height / 2).strength(0.03))
      .force("collide", forceCollide().radius(d => d.group === 1 ? 35 : 25));

    const link = g.append("g")
      .attr("stroke", theme === 'blue' ? '#4b5563' : '#cbd5e1')
      .attr("stroke-opacity", 0.5)
      .selectAll("line")
      .data(processedLinks)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value || 1) * 2.5);

    const node = g.append("g")
      .selectAll("g")
      .data(processedNodes)
      .join("g")
      .call(d3Drag()
        .on("start", (event) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on("drag", (event) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on("end", (event) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }))
      .on("click", (event, d) => setSelectedNode(d));

    // Add circles
    node.append("circle")
      .attr("r", d => d.group === 9 ? 22 : (d.group === 1 ? 20 : 16))
      .attr("fill", d => getNodeColor(d).fill)
      .attr("stroke", d => getNodeColor(d).stroke)
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        select(this).transition().duration(200).attr("r", d.group === 9 ? 26 : (d.group === 1 ? 24 : 20));
      })
      .on("mouseleave", function (event, d) {
        select(this).transition().duration(200).attr("r", d.group === 9 ? 22 : (d.group === 1 ? 20 : 16));
      });

    // Labels
    node.append("text")
      .text(d => d.label || d.name)
      .attr("x", 26)
      .attr("y", 5)
      .attr("fill", theme === 'blue' ? '#f4f4f5' : '#111827')
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("font-family", "'Space Grotesk', sans-serif")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [data, theme]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, zoomIdentity);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-bg">
      <div className="absolute top-6 left-6 z-10 space-y-4">
        <div className="pv-card p-6 max-w-xs">
          <h1 className="text-xl font-display font-bold text-text-primary mb-2">Startup Knowledge Graph</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            Visualizing connections between <span className="text-[#C99134] font-bold">Startups</span>, 
            <span className="text-[#EC4899] font-bold"> Founders</span>, <span className="text-[#3B82F6] font-bold"> Industries</span>, and more!
          </p>
        </div>
        <div className="pv-card p-2 flex gap-2">
          <button onClick={handleZoomIn} className="pv-btn-icon" aria-label="Zoom In">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={handleZoomOut} className="pv-btn-icon" aria-label="Zoom Out">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={handleResetZoom} className="pv-btn-icon" aria-label="Reset View">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full" />

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="absolute top-6 right-6 bottom-6 w-80 pv-card p-6 z-20"
          >
            <button onClick={() => setSelectedNode(null)} className="pv-btn-icon absolute top-4 right-4">
              <X className="w-4 h-4" />
            </button>
            <Logo name={selectedNode.label || selectedNode.name} size="lg" className="mb-6" />
            <h2 className="text-xl font-display font-bold text-text-primary mb-1">{selectedNode.label || selectedNode.name}</h2>
            {selectedNode.type && (
              <div className="text-xs font-bold text-accent uppercase tracking-widest mb-3">{selectedNode.type}</div>
            )}
            {selectedNode.status && (
              <div className="bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit mb-6">{selectedNode.status}</div>
            )}
            {selectedNode.type === 'COMPANY' && selectedNode.slug && (
              <Link to={`/startup/${selectedNode.slug}`} className="pv-btn-primary w-full mt-8 flex items-center justify-center">
                View Postmortem
                <Skull className="w-4 h-4 ml-2" />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/80 z-50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraph;
