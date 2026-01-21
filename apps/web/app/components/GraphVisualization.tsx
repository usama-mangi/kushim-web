'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Info, X, ExternalLink } from 'lucide-react';
import LinkExplanationPanel from '../../components/LinkExplanationPanel';
import { useA11yAnnounce } from '@/hooks/useA11y';

interface GraphNode {
  id: string;
  label: string;
  type: 'artifact' | 'group';
  group?: number;
  metadata?: any;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  confidence: number;
  signal: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface GraphVisualizationProps {
  data: GraphData;
}

export default function GraphVisualization({ data }: GraphVisualizationProps) {
  const graphRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<{ sourceId: string; targetId: string } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const announce = useA11yAnnounce();

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 80,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    const connectionCount = data.links.filter(
      (link) =>
        (typeof link.source === 'string' ? link.source : link.source.id) === node.id ||
        (typeof link.target === 'string' ? link.target : link.target.id) === node.id
    ).length;
    announce(`Selected ${node.label}, ${connectionCount} connections`, 'polite');
  }, [data.links, announce]);

  const handleNodeRightClick = useCallback((node: GraphNode) => {
    // Center on node
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(3, 1000);
      announce(`Focused on ${node.label}`, 'polite');
    }
  }, [announce]);

  const handleLinkClick = useCallback((link: GraphLink) => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    setSelectedLink({ sourceId, targetId });
    setSelectedNode(null); // Close node panel if open
  }, []);

  const getNodeColor = (node: GraphNode) => {
    if (node.type === 'group') return '#6366f1'; // indigo-500
    
    // Color by source platform
    const platform = node.metadata?.platform || node.metadata?.source;
    switch (platform?.toLowerCase()) {
      case 'github': return '#f97316'; // orange-500
      case 'jira': return '#0ea5e9'; // sky-500
      case 'slack': return '#a855f7'; // purple-500
      case 'google': return '#10b981'; // emerald-500
      default: return '#64748b'; // slate-500
    }
  };

  const getNodeSize = (node: GraphNode) => {
    if (node.type === 'group') return 8;
    
    // Size based on connections
    const connections = data.links.filter(
      (link) =>
        (typeof link.source === 'string' ? link.source : link.source.id) === node.id ||
        (typeof link.target === 'string' ? link.target : link.target.id) === node.id
    ).length;
    
    return Math.max(4, Math.min(12, 4 + connections));
  };

  const getLinkColor = (link: GraphLink) => {
    const confidence = link.confidence || 0;
    if (confidence > 0.7) return 'rgba(34, 197, 94, 0.6)'; // green
    if (confidence > 0.4) return 'rgba(251, 191, 36, 0.6)'; // yellow
    return 'rgba(148, 163, 184, 0.4)'; // slate
  };

  const getLinkWidth = (link: GraphLink) => {
    const confidence = link.confidence || 0;
    return Math.max(1, confidence * 3);
  };

  return (
    <div className="relative w-full h-full">
      <div 
        role="img" 
        aria-label={`Graph visualization showing ${data.nodes.length} artifacts and ${data.links.length} connections. Use mouse to explore or view the legend for details.`}
        aria-describedby="graph-legend"
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={data}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel={(node) => (node as GraphNode).label}
          nodeColor={(node) => getNodeColor(node as GraphNode)}
          nodeVal={(node) => getNodeSize(node as GraphNode)}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const typedNode = node as GraphNode;
            const label = typedNode.label;
            const fontSize = 12 / globalScale;
            const nodeSize = getNodeSize(typedNode);

            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI, false);
            ctx.fillStyle = getNodeColor(typedNode);
            ctx.fill();

            // Draw border for selected node
            if (selectedNode?.id === typedNode.id) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            }

            // Draw label
            if (globalScale > 1.5) {
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#e2e8f0';
              ctx.fillText(label, node.x!, node.y! + nodeSize + fontSize);
            }
          }}
          linkColor={(link) => getLinkColor(link as GraphLink)}
          linkWidth={(link) => getLinkWidth(link as GraphLink)}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={(link) => getLinkWidth(link as GraphLink)}
          linkDirectionalParticleSpeed={0.005}
          onNodeClick={handleNodeClick}
          onNodeRightClick={handleNodeRightClick}
          onLinkClick={handleLinkClick}
          onBackgroundClick={() => {
            setSelectedNode(null);
            setSelectedLink(null);
          }}
          cooldownTicks={100}
          backgroundColor="#020617"
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div 
          className="absolute top-4 right-4 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="false"
          aria-labelledby="node-details-title"
        >
          <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 id="node-details-title" className="font-bold text-white">Node Details</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 hover:bg-slate-800 rounded transition"
              aria-label="Close node details"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Title</div>
              <div className="font-semibold text-white">{selectedNode.label}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Type</div>
              <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded text-xs font-semibold capitalize">
                {selectedNode.type}
              </span>
            </div>

            {selectedNode.metadata?.platform && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Platform</div>
                <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-semibold capitalize">
                  {selectedNode.metadata.platform}
                </span>
              </div>
            )}

            {selectedNode.metadata?.artifactType && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Artifact Type</div>
                <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">
                  {selectedNode.metadata.artifactType}
                </span>
              </div>
            )}

            {selectedNode.metadata?.url && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Source</div>
                <a
                  href={selectedNode.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-indigo-400 hover:text-indigo-300 text-xs transition"
                  aria-label={`View ${selectedNode.label} in ${selectedNode.metadata.platform}`}
                >
                  View in platform
                  <ExternalLink className="w-3 h-3 ml-1" aria-hidden="true" />
                </a>
              </div>
            )}

            {selectedNode.metadata?.createdAt && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Created</div>
                <div className="text-xs text-slate-300">
                  {new Date(selectedNode.metadata.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Connections</div>
              <div className="text-sm text-white font-semibold">
                {data.links.filter(
                  (link) =>
                    (typeof link.source === 'string' ? link.source : link.source.id) === selectedNode.id ||
                    (typeof link.target === 'string' ? link.target : link.target.id) === selectedNode.id
                ).length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div 
        id="graph-legend"
        className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-sm"
        role="region"
        aria-label="Graph legend"
      >
        <div className="flex items-center text-xs text-slate-500 mb-3">
          <Info className="w-3 h-3 mr-1" aria-hidden="true" />
          Node Colors
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2" aria-hidden="true"></div>
            <span className="text-slate-300">GitHub <span className="sr-only">(Orange)</span></span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-sky-500 mr-2" aria-hidden="true"></div>
            <span className="text-slate-300">Jira <span className="sr-only">(Blue)</span></span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2" aria-hidden="true"></div>
            <span className="text-slate-300">Slack <span className="sr-only">(Purple)</span></span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2" aria-hidden="true"></div>
            <span className="text-slate-300">Google <span className="sr-only">(Green)</span></span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2" aria-hidden="true"></div>
            <span className="text-slate-300">Context Group <span className="sr-only">(Indigo)</span></span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center text-xs text-slate-500 mb-2">
            Link Strength
          </div>
          <div className="space-y-1">
            <div className="flex items-center text-xs">
              <div className="w-4 h-0.5 bg-green-500 mr-2" aria-hidden="true"></div>
              <span className="text-slate-300">High (&gt;70%) ✓</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-4 h-0.5 bg-yellow-500 mr-2" aria-hidden="true"></div>
              <span className="text-slate-300">Medium (40-70%) ~</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-4 h-0.5 bg-slate-500 mr-2" aria-hidden="true"></div>
              <span className="text-slate-300">Low (&lt;40%) ·</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-500" role="note">
          <div>Click: Select node</div>
          <div>Click link: View explanation</div>
          <div>Right-click: Focus node</div>
          <div>Drag: Move nodes</div>
          <div>Scroll: Zoom in/out</div>
        </div>
      </div>

      {/* Link Explanation Panel */}
      {selectedLink && (
        <LinkExplanationPanel
          sourceId={selectedLink.sourceId}
          targetId={selectedLink.targetId}
          onClose={() => setSelectedLink(null)}
        />
      )}
    </div>
  );
}
