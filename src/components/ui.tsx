import React, { useState } from 'react';
import { Loader2, X, Upload } from 'lucide-react';

// Button Component
export const Button = ({ children, variant = 'primary', size = 'md', isLoading = false, className = '', ...props }: any) => {
  const base = "inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-500",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base"
  };
  
  return (
    <button className={`${base} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`} disabled={isLoading} {...props}>
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      {children}
    </button>
  );
};

// Card Component
export const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

// Input Component
export const Input = ({ label, error, className = '', ...props }: any) => (
  <div className="w-full space-y-1.5">
    {label && <label className="block text-sm font-semibold text-slate-700 ml-1">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500 ml-1 font-medium">{error}</p>}
  </div>
);

// Modal Component
export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

// Badge Component
export const Badge = ({ children, color = 'bg-slate-100 text-slate-600' }: any) => (
  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-black/5 ${color}`}>
    {children}
  </span>
);

// Image Upload Component
export const ImageUpload = ({ label, value, onChange }: any) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result as string);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">{label}</label>}
      <div className="flex gap-4 items-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
          {value ? <img src={value} className="w-full h-full object-cover" /> : <Upload className="w-6 h-6 text-slate-300" />}
        </div>
        <label className="flex-1 cursor-pointer">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center hover:bg-slate-100 transition-all">
            <span className="text-sm font-bold text-slate-600">{isProcessing ? "Processando..." : "Selecionar Imagem"}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
          </div>
        </label>
      </div>
    </div>
  );
};

// Image processing helper
export const processImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
};