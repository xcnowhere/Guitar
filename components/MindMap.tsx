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
    
    // Adjusted vertical height: Multiplier increased to 2.0 as requested
    const treeHeight = Math.max(innerHeight * 2.0, 1600); 
    
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

    // Links (Darker stroke for light theme)
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#9ca3af") // gray-400
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
          if (d.data.type === 'root') return '#d97706'; // amber-600
          if (d.data.brand === 'Fender') return '#2563eb'; // blue-600
          if (d.data.brand === 'Gibson') return '#dc2626'; // red-600
          return '#d1d5db'; // gray-300
      })
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .attr("class", "shadow-md")
      .style("filter", "drop-shadow(0px 2px 2px rgba(0,0,0,0.1))")
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
      // Increased font sizes as requested
      .style("font-size", d => d.data.type === 'root' ? "56px" : "42px")
      .style("font-weight", "bold")
      .style("pointer-events", "none");

    // Label Halo (White for light theme)
    labels.clone(true).lower()
      .attr("stroke", "#ffffff") // White stroke
      .attr("stroke-width", 8)
      .attr("fill", "none");
    
    // Label Text (Dark for light theme)
    labels.attr("fill", "#111827"); // gray-900

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

            // Card background (Dark Gray as requested)
            imgGroup.append("rect")
                .attr("width", imgW)
                .attr("height", imgH)
                .attr("rx", 12)
                .attr("fill", "#1f2937") // gray-800 Dark Gray background
                .attr("stroke", "#374151") // gray-700 border
                .attr("stroke-width", 2)
                .style("filter", "drop-shadow(0px 4px 6px rgba(0,0,0,0.1))");

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
        }
    });

  }, [dimensions, data, onNodeSelect]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-gray-100 rounded-xl border border-gray-200 shadow-inner overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-3 rounded-lg border border-gray-200 text-xs text-gray-600 pointer-events-none shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1 text-sm">吉他图谱 (Guitar Map)</h3>
            <p className="mb-1">🖱️ 拖动空白处平移 (Drag to pan)</p>
            <p className="mb-1">🔍 滚轮缩放 (Scroll to zoom)</p>
            <p className="mb-1">👆 点击节点查看详细 (Details)</p>
        </div>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block w-full h-full cursor-move" />
    </div>
  );
};

export default MindMap;