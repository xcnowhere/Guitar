import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { NodeData, GuitarModel } from '../types';

interface MindMapProps {
  data: NodeData;
  onNodeSelect: (data: GuitarModel) => void;
}

interface TreeData extends NodeData {
  children?: TreeData[];
}

const MindMap: React.FC<MindMapProps> = ({ data, onNodeSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.offsetWidth,
          height: wrapperRef.current.offsetHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    
    // Increased bottom margin to fit vertical guitars
    const margin = { top: 80, right: 50, bottom: 350, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const root = d3.hierarchy<TreeData>(data);

    // Calculate required width based on leaf nodes
    const leafCount = root.leaves().length;
    const minWidthPerNode = 350; 
    const treeWidth = Math.max(innerWidth, leafCount * minWidthPerNode);
    const treeHeight = Math.max(innerHeight, 800);
    
    const treeLayout = d3.tree<TreeData>()
        .size([treeWidth, treeHeight])
        .separation((a, b) => (a.parent === b.parent ? 1.1 : 1.3)); 

    treeLayout(root);

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    if (root.x !== undefined) {
        const initialScale = 0.55; 
        const initialX = (width / 2) - (root.x * initialScale);
        const initialY = 50;
        svg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));
    }

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 3)
      .attr("d", d3.linkVertical<any, any>()
        .x(d => d.x)
        .y(d => d.y)
      );

    // Nodes
    const nodes = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", d => `node ${d.children ? "node-internal" : "node-leaf"} cursor-pointer`)
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Node Circle
    nodes.append("circle")
      .attr("r", d => d.data.type === 'root' ? 16 : 10) 
      .attr("fill", d => {
          if (d.data.type === 'root') return '#f59e0b';
          if (d.data.brand === 'Fender') return '#3b82f6';
          if (d.data.brand === 'Gibson') return '#ef4444';
          return '#94a3b8';
      })
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .on("click", (event, d) => {
        if (d.data.type === 'model' && d.data.data) {
          onNodeSelect(d.data.data);
        }
      });

    // Labels
    const labels = nodes.append("text")
      .attr("dy", "1.5em") 
      .attr("x", 0)
      .attr("text-anchor", "middle")
      .text(d => d.data.label)
      .style("font-size", d => d.data.type === 'root' ? "48px" : "36px")
      .style("font-weight", "bold")
      .style("pointer-events", "none");

    labels.clone(true).lower()
      .attr("stroke", "#020617")
      .attr("stroke-width", 8)
      .attr("fill", "none");
    
    labels.attr("fill", "#ffffff");

    // --- Render Images (Vertical aspect ratio for full guitar) ---
    nodes.each(function(d) {
        if (d.data.type === 'model' && d.data.data?.imageUrl) {
            const group = d3.select(this);
            // Vertical dimensions: 90px width x 180px height
            const imgW = 100;
            const imgH = 200;
            
            const imgY = 70;
            const imgX = -imgW / 2; 

            const imgGroup = group.append("g")
                .attr("transform", `translate(${imgX}, ${imgY})`)
                .style("cursor", "pointer")
                .on("click", (e) => {
                    e.stopPropagation();
                    if (d.data.type === 'model' && d.data.data) {
                        onNodeSelect(d.data.data);
                    }
                });

            const clipId = `clip-${d.data.id}`;
            imgGroup.append("clipPath")
                .attr("id", clipId)
                .append("rect")
                .attr("width", imgW)
                .attr("height", imgH)
                .attr("rx", 12);

            imgGroup.append("image")
                .attr("href", d.data.data.imageUrl)
                .attr("width", imgW)
                .attr("height", imgH)
                .attr("clip-path", `url(#${clipId})`)
                .attr("preserveAspectRatio", "xMidYMid slice");
            
            imgGroup.append("rect")
                .attr("width", imgW)
                .attr("height", imgH)
                .attr("rx", 12)
                .attr("fill", "none")
                .attr("stroke", "#fff")
                .attr("stroke-width", 3);
        }
    });

  }, [dimensions, data, onNodeSelect]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-950 rounded-xl border border-slate-800 shadow-inner overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur p-3 rounded-lg border border-slate-700 text-xs text-slate-300 pointer-events-none">
            <h3 className="font-bold text-slate-100 mb-1 text-sm">吉他图谱 (Guitar Map)</h3>
            <p className="mb-1">🖱️ 拖动空白处平移 (Drag to pan)</p>
            <p className="mb-1">🔍 滚轮缩放 (Scroll to zoom)</p>
            <p className="mb-1">👆 点击节点查看详细 (Details)</p>
        </div>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block w-full h-full cursor-move" />
    </div>
  );
};

export default MindMap;
