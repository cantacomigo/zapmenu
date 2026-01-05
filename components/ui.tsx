import React, { ReactNode, useRef, useState } from 'react';
import { Loader2, Upload, Image as ImageIcon, X } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', className = '', isLoading, disabled, ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-5 py-2.5 rounded-xl",
    lg: "px-6 py-3.5 text-lg rounded-2xl"
  };

  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 focus:ring-emerald-500 border border-transparent",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm focus:ring-slate-500",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 focus:ring-red-500",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500",
    dark: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 focus:ring-slate-900"
  };

  return (
    <button 
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">{label}</label>}
      <input 
        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'} ${className}`} 
        {...props} 
      />
      {error && <p className="mt-1.5 ml-1 text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
};

// Image processing utility
export const processImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // Resize to max 1200px width for optimization
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG at 80% quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const ImageUpload: React.FC<{ 
  label: string; 
  value?: string; 
  onChange: (base64: string) => void 
}> = ({ label, value, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
        const processed = await processImage(file);
        onChange(processed);
      } catch (error) {
        console.error("Image processing error:", error);
        alert("Erro ao processar imagem.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">{label}</label>
      <div 
        className="relative w-full h-40 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 hover:border-emerald-400 transition-all flex flex-col items-center justify-center cursor-pointer group overflow-hidden bg-slate-50"
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center text-emerald-600">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm font-medium">Otimizando...</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <span className="text-white font-medium flex items-center"><Upload className="w-4 h-4 mr-2" /> Alterar Imagem</span>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
             <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-5 h-5" />
             </div>
             <p className="text-sm font-medium text-slate-600">Clique para enviar uma imagem</p>
             <p className="text-xs text-slate-400 mt-1">PNG, JPG ou GIF</p>
          </div>
        )}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
          disabled={isProcessing}
        />
      </div>
    </div>
  );
};

export const Card: React.FC<{ children: ReactNode; className?: string; noPadding?: boolean }> = ({ children, className = '', noPadding = false }) => (
  <div className={`bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden ${className}`}>
    <div className={noPadding ? '' : 'p-6'}>
      {children}
    </div>
  </div>
);

export const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: ReactNode 
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-white/20">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white/50 backdrop-blur-xl sticky top-0 z-10">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Badge: React.FC<{ children: ReactNode, color?: string }> = ({ children, color = 'bg-emerald-100 text-emerald-800 border-emerald-200' }) => (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      {children}
    </span>
);