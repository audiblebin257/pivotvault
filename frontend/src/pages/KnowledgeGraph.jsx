import React from 'react';
import { Link } from 'react-router-dom';
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
import { ZoomIn, ZoomOut, RotateCcw, Building2, MapPin, Skull, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';
import api from '../lib/api';

// Node color definitions
const getNodeColors = (d) => {
  if (d.type === 'center' || d.type === 'shutdown' || d.name === 'Shutdown') {
    return { fill: '#EF4444', stroke: '#F87171', glow: 'rgba(239, 68, 68, 0.6)' };
  } else if (d.type === 'mistake' || d.type === 'failure_reason') {
    return { fill: '#F59E0B', stroke: '#FBBF24', glow: null };
  } else if (d.type === 'startup' || d.type === 'company') {
    return { fill: '#8B5CF6', stroke: '#A78BFA', glow: null };
  }
  return { fill: '#8B5CF6', stroke: '#A78BFA', glow: null };
};

const KnowledgeGraph = () => {
  const containerRef = React.useRef(null);
  const svgRef = React.useRef(null);
  const zoomRef = React.useRef(null);
  const [data, setData] = React.useState(null);
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const { theme } = useTheme();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/graph/edges');
        setData(response.data);
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  React.useEffect(() => {
    if (!data || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Process data to ensure all nodes are connected and shutdown node is present
    let processedNodes = [...data.nodes];
    let processedLinks = [...data.links];

    // Ensure we have a shutdown node
    let shutdownNode = processedNodes.find(n => n.name === 'Shutdown' || n.type === 'shutdown');
    if (!shutdownNode) {
      shutdownNode = {
        id: 'shutdown',
        name: 'Shutdown',
        type: 'shutdown'
      };
      processedNodes.push(shutdownNode);
    }

    // Ensure all failure reasons connect to shutdown node
    const failureNodes = processedNodes.filter(n => 
      n.type === 'mistake' || n.type === 'failure_reason'
    );
    failureNodes.forEach(node => {
      const linkExists = processedLinks.some(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return (
          (sourceId === node.id && targetId === shutdownNode.id) ||
          (targetId === node.id && sourceId === shutdownNode.id)
        );
      });
      if (!linkExists) {
        processedLinks.push({
          source: node.id,
          target: shutdownNode.id,
          weight: 1
        });
      }
    });

    // Ensure all startups connect to at least one failure reason
    const startupNodes = processedNodes.filter(n => 
      n.type === 'startup' || n.type === 'company'
    );
    startupNodes.forEach(startup => {
      const isConnected = processedLinks.some(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return sourceId === startup.id || targetId === startup.id;
      });
      if (!isConnected && failureNodes.length > 0) {
        processedLinks.push({
          source: startup.id,
          target: failureNodes[0].id,
          weight: 1
        });
      }
    });

    // Clear previous svg
    select(containerRef.current).selectAll("svg").remove();

    const svg = select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    svgRef.current = svg.node();

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3Zoom()
      .scaleExtent([0.2, 5])
      .on("zoom", (event) => g.attr("transform", event.transform));

    zoomRef.current = zoom;
    svg.call(zoom);

    const simulation = forceSimulation(processedNodes)
      .force("link", forceLink(processedLinks).id(d => d.id).distance(200))
      .force("charge", forceManyBody().strength(-600))
      .force("center", forceCenter(width / 2, height / 2))
      .force("x", forceX(width / 2).strength(0.03))
      .force("y", forceY(height / 2).strength(0.03))
      .force("collide", forceCollide().radius(40));

    // Links with theme-aware colors
    const link = g.append("g")
      .attr("stroke", theme === 'blue' ? '#E5E7EB' : '#1F2937')
      .attr("stroke-opacity", theme === 'blue' ? 0.35 : 0.45)
      .selectAll("line")
      .data(processedLinks)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.weight || 1) * 2);

    // Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(processedNodes)
      .join("g")
      .call(d3Drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (event, d) => {
        if (d.type === 'startup' || d.type === 'company') setSelectedNode(d);
      });

    // Add glow for shutdown node
    node.filter(d => d.name === 'Shutdown' || d.type === 'shutdown')
      .append("circle")
      .attr("r", 24)
      .attr("fill", "none")
      .attr("stroke", "rgba(239, 68, 68, 0.3)")
      .attr("stroke-width", 8)
      .style("filter", "blur(4px)");

    // Node circles/shapes with theme-aware colors
    node.append("circle")
      .attr("r", d => d.type === 'startup' || d.type === 'company' ? 16 : d.type === 'mistake' || d.type === 'failure_reason' ? 12 : 18)
      .attr("fill", d => getNodeColors(d).fill)
      .attr("stroke", d => getNodeColors(d).stroke)
      .attr("stroke-width", 3)
      .style("cursor", d => (d.type === 'startup' || d.type === 'company') ? 'pointer' : 'default')
      .on("mouseenter", function(event, d) {
        select(this)
          .transition()
          .duration(200)
          .attr("r", d => (d.type === 'startup' || d.type === 'company' ? 20 : d.type === 'mistake' || d.type === 'failure_reason' ? 16 : 22));
      })
      .on("mouseleave", function(event, d) {
        select(this)
          .transition()
          .duration(200)
          .attr("r", d => (d.type === 'startup' || d.type === 'company' ? 16 : d.type === 'mistake' || d.type === 'failure_reason' ? 12 : 18));
      });

    // Labels with theme-aware colors
    node.append("text")
      .text(d => d.name)
      .attr("x", 22)
      .attr("y", 5)
      .attr("fill", theme === 'blue' ? '#F3F4F6' : '#111827')
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("font-family", "Plus Jakarta Sans")
      .style("pointer-events", "none")
      .style("text-shadow", theme === 'blue' 
        ? "0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)" 
        : "0 1px 3px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.7)");

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

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
      {/* Sidebar UI */}
      <div className="absolute top-6 left-6 z-10 space-y-4">
        <div className="pv-card p-6 max-w-xs">
          <h1 className="text-xl font-display font-bold text-text-primary mb-2">Failure Knowledge Graph</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            Visualizing connections between <span className="text-accent font-bold">Startups</span>, 
            the <span className="text-warning font-bold">Mistakes</span> they made, and their 
            <span className="text-danger font-bold"> Outcome</span>.
          </p>
        </div>

        <div className="pv-card p-2 flex gap-2">
          <button 
            onClick={handleZoomIn}
            className="pv-btn-icon"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button 
            onClick={handleZoomOut}
            className="pv-btn-icon"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button 
            onClick={handleResetZoom}
            className="pv-btn-icon"
            aria-label="Reset View"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Selected Node Info Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="absolute top-6 right-6 bottom-6 w-80 pv-card p-6 z-20 flex flex-col"
          >
            <button 
              onClick={() => setSelectedNode(null)}
              className="pv-btn-icon absolute top-4 right-4"
              aria-label="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
            
            <Logo
              name={selectedNode.name}
              size="lg"
              className="mb-6"
            />
            
            <h2 className="text-xl font-display font-bold text-text-primary mb-1">{selectedNode.name}</h2>
            {selectedNode.status && (
              <div className="bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit mb-6">
                {selectedNode.status}
              </div>
            )}

            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Building2 className="w-4 h-4 text-accent shrink-0" />
                {selectedNode.industry}
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                {selectedNode.country || 'India'}
              </div>
            </div>

            <Link
              to={`/startup/${selectedNode.slug}`}
              className="mt-auto pv-btn-primary flex items-center justify-center gap-2"
            >
              View Full Postmortem
              <Skull className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/80 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin" />
            <div className="text-sm font-data text-accent tracking-widest uppercase">Initializing Force Layout...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraph;
