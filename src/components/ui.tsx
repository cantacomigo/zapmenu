import React from 'react';
import { Loader2, Upload, X } from 'lucide-react';

export const Button = ({ children, variant = 'primary', size = 'md', isLoading = false, className = '', ...props }: any) => {
  const base = "inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants: any = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white",
    black: "bg-slate-900 text-white hover:bg-slate-800"
  };
  const sizes: any = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base"
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={isLoading} {...props}>
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

export const Input = ({ label, error, className = '', ...props }: any) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="block text-sm font-semibold text-slate-700 ml-1">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${error ? 'border-red-500' : ''} ${className}`}
      {...props} 
    />
    {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
  </div>
);

export const Badge = ({ children, color = 'bg-slate-100 text-slate-600' }: any) => (
  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-transparent ${color}`}>
    {children}
  </span>
);

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const ImageUpload = ({ label, value, onChange }: any) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-semibold text-slate-700 ml-1">{label}</label>}
    <div 
        onClick={() => {
            const url = prompt("Insira a URL da imagem:");
            if (url) onChange(url);
        }}
        className="h-32 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-emerald-500 transition-all group overflow-hidden relative"
    >
        {value ? (
            <>
                <img src={value} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-xs font-bold">Trocar Imagem</span>
                </div>
            </>
        ) : (
            <>
                <Upload className="w-8 h-8 text-slate-300 group-hover:text-emerald-500 mb-2" />
                <span className="text-xs font-medium text-slate-400">Clique para inserir URL</span>
            </>
        )}
    </div>
  </div>
);