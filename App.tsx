import React, { useState, useEffect } from 'react';
import MindMap from './components/MindMap';
import GuitarDetail from './components/GuitarDetail';
import { GuitarModel, NodeData } from './types';
import { GUITAR_DATA } from './constants';
import { GitGraph, Info } from 'lucide-react';
import { generateGuitarImage } from './services/geminiService';

function App() {
  // Deep clone initial data to state to allow mutation/updates
  const [treeData, setTreeData] = useState<NodeData>(JSON.parse(JSON.stringify(GUITAR_DATA)));
  const [selectedGuitar, setSelectedGuitar] = useState<GuitarModel | null>(null);

  const handleNodeSelect = (guitar: GuitarModel) => {
    setSelectedGuitar(guitar);
  };

  // Helper to find and update a node in the tree
  const updateTreeData = (root: NodeData, id: string, updates: Partial<GuitarModel>): NodeData => {
    const newRoot = { ...root };
    if (newRoot.data && newRoot.data.id === id) {
        newRoot.data = { ...newRoot.data, ...updates };
    }
    if (newRoot.children) {
        newRoot.children = newRoot.children.map(child => updateTreeData(child, id, updates));
    }
    return newRoot;
  };

  const handleGuitarUpdate = (id: string, updates: Partial<GuitarModel>) => {
    // Update Global Tree State
    setTreeData(prevData => updateTreeData(prevData, id, updates));
    
    // Update currently selected item so UI reflects changes immediately
    setSelectedGuitar(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
  };

  // --- Auto Generate Images Effect ---
  useEffect(() => {
    const autoGenerateImages = async () => {
        // Collect all leaf node models that need images
        const modelsToGenerate: GuitarModel[] = [];
        const findModels = (node: NodeData) => {
            if (node.type === 'model' && node.data && !node.data.imageUrl) {
                modelsToGenerate.push(node.data);
            }
            if (node.children) {
                node.children.forEach(findModels);
            }
        };
        findModels(treeData);

        // Process them sequentially to avoid hitting rate limits too hard (or parallel if safe)
        // Using Promise.all for better speed, assuming usage tier allows ~6 requests
        const promises = modelsToGenerate.map(async (model) => {
            const imgData = await generateGuitarImage(model.name);
            if (imgData) {
                handleGuitarUpdate(model.id, { imageUrl: imgData });
            }
        });
        
        await Promise.all(promises);
    };

    // Run once on mount (with a small timeout to let UI render first)
    const timer = setTimeout(() => {
        autoGenerateImages();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs once

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <GitGraph className="text-amber-500" size={28} />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
            GuitarGenealogy (吉他图谱)
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="hidden sm:inline">Powered by Google Gemini</span>
            <button 
                onClick={() => alert("图片正在自动生成中。浏览树状图探索经典电吉他。(Images are generating automatically. Navigate to explore.)")}
                className="p-2 hover:bg-slate-800 rounded-full transition"
            >
                <Info size={20} />
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex">
        <div className="flex-1 p-0 overflow-hidden">
            <MindMap data={treeData} onNodeSelect={handleNodeSelect} />
        </div>

        {/* Detail Panel */}
        <GuitarDetail 
          guitar={selectedGuitar} 
          onClose={() => setSelectedGuitar(null)} 
          onUpdate={handleGuitarUpdate}
        />
      </main>
    </div>
  );
}

export default App;
