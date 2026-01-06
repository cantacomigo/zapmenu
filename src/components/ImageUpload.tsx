import React, { useState } from 'react';
import { Camera, Loader2, UploadCloud } from 'lucide-react';
import { processImage } from '../utils/imageProcessor';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (base64: string) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, value, onChange, className = "" }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const compressed = await processImage(file);
      onChange(compressed);
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-bold text-slate-700 ml-1">{label}</label>
      <div className="relative group">
        <div className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all group-hover:border-emerald-300 group-hover:bg-emerald-50/30">
          {value ? (
            <img src={value} className="w-full h-full object-cover" alt="Preview" />
          ) : (
            <>
              <UploadCloud className="w-8 h-8 text-slate-300 mb-2 group-hover:text-emerald-400 group-hover:scale-110 transition-all" />
              <span className="text-xs font-medium text-slate-400">Clique para enviar</span>
            </>
          )}
          
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Otimizando...</span>
            </div>
          )}

          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </div>
        
        {value && !isProcessing && (
            <div className="absolute bottom-2 right-2 p-1.5 bg-white shadow-md rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Camera size={14} />
            </div>
        )}
      </div>
    </div>
  );
};