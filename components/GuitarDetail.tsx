import React, { useState, useEffect } from 'react';
import { GuitarModel } from '../types';
import { generateGuitarDetails, generateGuitarImage } from '../services/geminiService';
import { X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';

interface GuitarDetailProps {
  guitar: GuitarModel | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<GuitarModel>) => void;
}

const GuitarDetail: React.FC<GuitarDetailProps> = ({ guitar, onClose, onUpdate }) => {
  const [description, setDescription] = useState<string>('');
  const [loadingText, setLoadingText] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  const displayImage = guitar?.imageUrl;

  useEffect(() => {
    if (guitar) {
      if (!description && !guitar.description) {
         loadDescription(guitar.name);
      } else if (guitar.description) {
          setDescription(guitar.description);
      }
    } else {
        setDescription('');
    }
  }, [guitar?.id]);

  const loadDescription = async (name: string) => {
    setLoadingText(true);
    const text = await generateGuitarDetails(name);
    setDescription(text);
    // Cache description back to model so we don't regenerate
    onUpdate(name, { description: text }); 
    setLoadingText(false);
  };

  const handleGenerateImage = async () => {
    if (!guitar) return;
    setLoadingImage(true);
    const imgData = await generateGuitarImage(guitar.name);
    if (imgData) {
        onUpdate(guitar.id, { imageUrl: imgData });
    }
    setLoadingImage(false);
  };

  if (!guitar) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-slate-900 border-l border-slate-700 shadow-2xl transform transition-transform duration-300 z-50 overflow-y-auto flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{guitar.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Text Section (Now at the top) */}
        <div className="prose prose-invert prose-sm mb-8">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <FileText size={18} className="text-blue-400"/> 详细信息 (Details)
          </h3>
          {loadingText ? (
             <div className="flex items-center gap-2 text-slate-400 py-4">
               <Loader2 className="animate-spin" size={16} /> 正在整理资料...
             </div>
          ) : (
            <div className="text-slate-300 leading-relaxed whitespace-pre-line">
              {description || guitar.description}
            </div>
          )}
        </div>

        {/* Image Section (Now below text) */}
        <div className="mb-6 relative">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <ImageIcon size={18} className="text-purple-400"/> 外观 (Appearance)
          </h3>
          <div 
             className="bg-slate-800 rounded-lg aspect-[3/4] flex items-center justify-center overflow-hidden relative group border border-slate-700"
          >
            {loadingImage ? (
              <Loader2 className="animate-spin text-amber-500" size={48} />
            ) : displayImage ? (
              <img src={displayImage} alt={guitar.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                 <button 
                  onClick={handleGenerateImage}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                 >
                    <ImageIcon size={20} />
                    重新生成图片
                 </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GuitarDetail;
