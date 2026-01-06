"use client";

import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false, 
  ...props 
}: any) => {
  const baseClasses = "inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const variants: any = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-100",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600"
  };

  const sizes: any = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} 
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      {children}
    </button>
  );
};

export const Card = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

export const Input = ({ label, className = '', ...props }: any) => (
  <div className="space-y-1.5 w-full text-left">
    {label && <label className="block text-sm font-semibold text-slate-700 ml-1">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 placeholder:text-slate-400 ${className}`} 
      {...props} 
    />
  </div>
);

export const Badge = ({ children, color = 'bg-slate-100 text-slate-600', className = '' }: any) => (
  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${color} ${className}`}>
    {children}
  </span>
);

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 animate-in zoom-in duration-300 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
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

export const ImageUpload = ({ label, value, onChange }: any) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5 w-full text-left">
      {label && <label className="block text-sm font-semibold text-slate-700 ml-1">{label}</label>}
      <div className="relative group">
        <div className={`w-full h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-emerald-300 ${value ? 'border-none' : ''}`}>
          {value ? (
            <>
              <img src={value} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-xs font-bold">Alterar Imagem</p>
              </div>
            </>
          ) : (
            <div className="text-center">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload</p>
                </>
              )}
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={handleFile} 
          />
        </div>
      </div>
    </div>
  );
};