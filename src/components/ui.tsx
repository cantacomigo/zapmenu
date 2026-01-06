import React from 'react';
import { Loader2, X, Upload, Trash2 } from 'lucide-react';
import { processImage } from '../utils/image';

// Button Component
export const Button = ({ children, variant = 'primary', size = 'md', className = '', isLoading = false, ...props }: any) => {
  const variants: any = {
    primary: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20 border-transparent',
    secondary: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 border-transparent',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border-transparent',
  };
  
  const sizes: any = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <button 
      disabled={isLoading}
      className={`inline-flex items-center justify-center font-black rounded-xl border transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

// Input Component
export const Input = ({ label, size = 'md', className = '', ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
    <input 
      className={`w-full bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500/20 transition-all font-medium text-slate-900 placeholder:text-slate-300 ${size === 'sm' ? 'px-4 py-2.5 text-xs' : 'px-4 py-3.5 text-sm'} ${className}`}
      {...props}
    />
  </div>
);

// Card Component
export const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white border border-slate-100 rounded-[24px] shadow-sm ${className}`}>
    {children}
  </div>
);

// Badge Component
export const Badge = ({ children, color = 'bg-slate-100 text-slate-600', className = '' }: any) => (
  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-transparent ${color} ${className}`}>
    {children}
  </span>
);

// Modal Component
export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-black text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// ImageUpload Component with Delete Functionality
export const ImageUpload = ({ label, value, onChange }: any) => {
  const [loading, setLoading] = React.useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await processImage(file);
      onChange(base64);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
      <div className="relative group">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all overflow-hidden">
          {value ? (
            <>
              <img src={value} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-[10px] font-black uppercase tracking-widest">Alterar Imagem</p>
              </div>
              <button 
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-colors z-10"
                title="Remover Imagem"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-slate-400">
              {loading ? <Loader2 className="w-6 h-6 animate-spin mb-2" /> : <Upload className="w-6 h-6 mb-2" />}
              <p className="text-[10px] font-black uppercase tracking-widest">Upload</p>
            </div>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handleFile} disabled={loading} />
        </label>
      </div>
    </div>
  );
};