import React, { useState } from "react";
import { GitBranch, Copy, Check, Maximize2, X } from "lucide-react";

/**
 * Native Mermaid Diagram Parser & Vector SVG Renderer
 * Parses flowchart & sequence syntax without heavy external bundles
 */
export const MermaidDiagram = ({ code = "" }) => {
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const cleanCode = code.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseNodesAndEdges = (src) => {
    const lines = src.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("%%"));
    const isLR = src.includes("LR") || src.includes("graph LR");

    const nodeMap = new Map();
    const edges = [];

    const getNode = (id, label) => {
      const cleanId = id.trim();
      if (!nodeMap.has(cleanId)) {
        nodeMap.set(cleanId, {
          id: cleanId,
          label: label || cleanId,
          isDb: false,
          isDecision: false
        });
      } else if (label && nodeMap.get(cleanId).label === cleanId) {
        nodeMap.get(cleanId).label = label;
      }
      return nodeMap.get(cleanId);
    };

    for (const line of lines) {
      if (line.startsWith("graph") || line.startsWith("flowchart") || line.startsWith("sequenceDiagram")) {
        continue;
      }

      // Match A[Label] -->|text| B[Label] or A --> B
      const edgeRegex = /([\w-]+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\}|\[\((.*?)\)\])?\s*(-->|---|-.->|==>)\s*(?:\|(.*?)\|)?\s*([\w-]+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\}|\[\((.*?)\)\])?/;
      const match = line.match(edgeRegex);

      if (match) {
        const fromId = match[1];
        const fromLabel = match[2] || match[3] || match[4] || match[5] || fromId;
        const fromNode = getNode(fromId, fromLabel);
        if (match[5]) fromNode.isDb = true;
        if (match[4]) fromNode.isDecision = true;

        const edgeLabel = match[7] || "";

        const toId = match[8];
        const toLabel = match[9] || match[10] || match[11] || match[12] || toId;
        const toNode = getNode(toId, toLabel);
        if (match[12]) toNode.isDb = true;
        if (match[11]) toNode.isDecision = true;

        edges.push({
          from: fromId,
          to: toId,
          label: edgeLabel
        });
      } else {
        // Standalone node: A[Label]
        const singleMatch = line.match(/^([\w-]+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\}|\[\((.*?)\)\])$/);
        if (singleMatch) {
          const id = singleMatch[1];
          const label = singleMatch[2] || singleMatch[3] || singleMatch[4] || singleMatch[5] || id;
          const node = getNode(id, label);
          if (singleMatch[5]) node.isDb = true;
          if (singleMatch[4]) node.isDecision = true;
        }
      }
    }

    const nodes = Array.from(nodeMap.values());

    // Compute simple DAG ranks
    const inDegree = new Map();
    nodes.forEach((n) => inDegree.set(n.id, 0));
    edges.forEach((e) => inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1));

    const levels = new Map();
    const queue = nodes.filter((n) => inDegree.get(n.id) === 0);
    queue.forEach((n) => levels.set(n.id, 0));

    // Fallback if circular
    if (queue.length === 0 && nodes.length > 0) {
      levels.set(nodes[0].id, 0);
      queue.push(nodes[0]);
    }

    while (queue.length > 0) {
      const current = queue.shift();
      const currentLvl = levels.get(current.id) || 0;
      const outgoing = edges.filter((e) => e.from === current.id);
      for (const e of outgoing) {
        const nextLvl = currentLvl + 1;
        if (!levels.has(e.to) || levels.get(e.to) < nextLvl) {
          levels.set(e.to, nextLvl);
          const nextNode = nodeMap.get(e.to);
          if (nextNode && !queue.includes(nextNode)) {
            queue.push(nextNode);
          }
        }
      }
    }

    // Assign positions
    const levelBuckets = new Map();
    nodes.forEach((n) => {
      const lvl = levels.get(n.id) || 0;
      if (!levelBuckets.has(lvl)) levelBuckets.set(lvl, []);
      levelBuckets.get(lvl).push(n);
    });

    const nodeWidth = 140;
    const nodeHeight = 50;

    let maxX = 500;
    let maxY = 300;

    levelBuckets.forEach((bucket, lvl) => {
      const count = bucket.length;
      bucket.forEach((node, idx) => {
        if (isLR) {
          node.x = 40 + lvl * 190;
          node.y = 50 + idx * 80 + (count === 1 ? 40 : 0);
        } else {
          node.x = 40 + idx * 170 + (count === 1 ? 70 : 0);
          node.y = 40 + lvl * 100;
        }
        maxX = Math.max(maxX, node.x + nodeWidth + 60);
        maxY = Math.max(maxY, node.y + nodeHeight + 60);
      });
    });

    return { nodes, edges, width: maxX, height: maxY };
  };

  const { nodes, edges, width, height } = parseNodesAndEdges(cleanCode);

  const renderSvg = () => (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="overflow-visible">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#60A5FA" />
        </marker>
        <linearGradient id="nodeGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      {/* Edges */}
      {edges.map((e, idx) => {
        const from = nodes.find((n) => n.id === e.from);
        const to = nodes.find((n) => n.id === e.to);
        if (!from || !to) return null;

        const x1 = from.x + 70;
        const y1 = from.y + 25;
        const x2 = to.x + 70;
        const y2 = to.y + 25;

        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        return (
          <g key={idx}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38BDF8" strokeWidth="2" markerEnd="url(#arrow)" />
            {e.label && (
              <g transform={`translate(${mx}, ${my - 8})`}>
                <rect x="-30" y="-8" width="60" height="16" rx="4" fill="#0F172A" stroke="#334155" />
                <text x="0" y="4" fill="#93C5FD" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {e.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((n) => {
        const strokeColor = n.isDb ? "#F59E0B" : n.isDecision ? "#EC4899" : "#4F7CFF";
        return (
          <g key={n.id} transform={`translate(${n.x}, ${n.y})`} className="cursor-default">
            <rect
              width="140"
              height="50"
              rx={n.isDb ? 6 : n.isDecision ? 12 : 10}
              fill="url(#nodeGradDark)"
              stroke={strokeColor}
              strokeWidth="1.5"
            />
            {n.isDb && (
              <path d="M 0 10 Q 70 20 140 10" fill="none" stroke="#F59E0B" strokeWidth="1" />
            )}
            <text
              x="70"
              y="29"
              fill="#F8FAFC"
              fontSize="11"
              fontFamily="system-ui, sans-serif"
              fontWeight="600"
              textAnchor="middle"
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );

  return (
    <div className="my-4 rounded-2xl bg-[#0B0F19] border border-[#1E293B] p-4 shadow-sm space-y-3 overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 text-xs">
        <div className="flex items-center gap-1.5 text-violet-400 font-semibold font-mono text-[11px]">
          <GitBranch size={13} />
          <span>Architecture / Flowchart Diagram</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Expand Fullscreen"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={handleCopy}
            className="px-2 py-1 rounded-lg text-[11px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            title="Copy Mermaid Code"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Source"}</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto py-2 flex justify-center">
        <div style={{ minWidth: "320px", maxWidth: "100%", width: `${Math.min(width, 700)}px`, height: "auto" }}>
          {renderSvg()}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#0B0F19] border border-[#1E293B] rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 mb-4">
              <span className="text-sm font-bold text-white font-display">Diagram Inspector</span>
              <button
                onClick={() => setIsZoomed(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {renderSvg()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MermaidDiagram;