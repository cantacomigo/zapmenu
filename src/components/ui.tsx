import React from 'react';
import { Loader2, Upload, X } from 'lucide-react';

export const Button = ({ children, variant = 'primary', size = 'md', isLoading = false, className = '', ...props }: any) => {
  const base = "inline-flex items-center justify-center rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants: any = {
    primary: "bg-emerald-500 text-white hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 border-b-4 border-emerald-600 active:border-b-0 active:mt-1",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100/80 hover:text-slate-900",
    danger: "bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-100 shadow-sm",
    black: "bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20 border-b-4 border-slate-950 active:border-b-0 active:mt-1"
  };
  const sizes: any = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3.5 text-sm",
    lg: "px-8 py-4.5 text-base"
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={isLoading} {...props}>
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 ${className}`}>
    {children}
  </div>
);

export const Input = ({ label, error, className = '', ...props }: any) => (
  <div className="space-y-2 w-full">
    {label && <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>}
    <input 
      className={`w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-300 font-medium ${error ? 'border-red-500' : ''} ${className}`}
      {...props} 
    />
    {error && <p className="text-[10px] font-bold text-red-500 ml-1">{error}</p>}
  </div>
);

export const Badge = ({ children, color = 'bg-slate-100 text-slate-600' }: any) => (
  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-white/20 backdrop-blur-md ${color}`}>
    {children}
  </span>
);

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-8 border-b border-slate-50">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl transition-all"><X size={20} /></button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

export const ImageUpload = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
    {label && <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>}
    <div 
        onClick={() => {
            const url = prompt("Insira a URL da imagem:");
            if (url) onChange(url);
        }}
        className="h-40 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-500 transition-all group overflow-hidden relative shadow-inner"
    >
        {value ? (
            <>
                <img src={value} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all backdrop-blur-sm">
                    <Upload className="text-white mb-2" size={24} />
                    <span className="text-white text-xs font-bold">Alterar Imagem</span>
                </div>
            </>
        ) : (
            <>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
                </div>
                <span className="text-xs font-bold text-slate-400">Clique para colar URL</span>
            </>
        )}
    </div>
  </div>
);