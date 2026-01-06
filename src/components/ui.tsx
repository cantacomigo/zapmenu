import React, { useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { processImage } from '../utils/image';

export const Button = ({ children, variant = 'primary', size = 'md', className = '', isLoading = false, ...props }: any) => {
  const base = "inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl";
  const variants: any = {
    primary: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };
  const sizes: any = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base"
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={isLoading} {...props}>
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};

export const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

export const Input = ({ label, error, className = '', ...props }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
    <input 
      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500/50 transition-all text-sm font-medium"
      {...props}
    />
    {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
  </div>
);

export const Badge = ({ children, color = 'bg-slate-100 text-slate-600', className = '' }: any) => (
  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-transparent ${color} ${className}`}>
    {children}
  </span>
);

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="p-6 flex justify-between items-center border-b border-slate-50">
          <h3 className="font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const ImageUpload = ({ label, value, onChange }: any) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
        const compressed = await processImage(file);
        onChange(compressed);
      } catch (err) {
        console.error("Erro ao processar imagem", err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        {value ? (
          <div className="relative w-full h-32 rounded-2xl overflow-hidden border-2 border-slate-100">
            <img src={value} className="w-full h-full object-cover" />
            <button 
              type="button"
              onClick={() => onChange('')}
              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-red-300 transition-all">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Clique para subir foto</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFile} disabled={isProcessing} />
          </label>
        )}
      </div>
    </div>
  );
};