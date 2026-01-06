import React from 'react';
import { Toaster } from 'react-hot-toast';

export const ToastProvider = () => (
  <Toaster 
    position="top-right"
    toastOptions={{
      duration: 4000,
      style: {
        background: '#fff',
        color: '#1e293b',
        borderRadius: '16px',
        padding: '12px 20px',
        fontWeight: '600',
        fontSize: '14px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      success: {
        iconTheme: {
          primary: '#059669',
          secondary: '#fff',
        },
      },
    }}
  />
);