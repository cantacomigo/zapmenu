"use client";

import React, { useState } from 'react';
import { db } from '../../services/db';
import { Button, Card, Input } from '../../components/ui';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminLoginProps {
  onLogin: (admin: any) => void;
  onBack: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const admin = await db.loginAdmin(email, password);
    setIsLoading(false);

    if (admin) {
        toast.success(`Bem-vindo, ${admin.name}`);
        onLogin(admin);
    } else {
        toast.error("E-mail ou senha inválidos.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8 bg-white border-none shadow-2xl">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Shield size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Painel Admin</h2>
            <p className="text-slate-500 text-sm mt-1">Acesso restrito ao ZapMenu Global.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            <Input 
                label="E-mail" 
                placeholder="admin@zapmenu.com" 
                value={email} 
                onChange={(e: any) => setEmail(e.target.value)} 
            />
            <Input 
                label="Senha" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e: any) => setPassword(e.target.value)} 
            />
            <Button type="submit" className="w-full py-4 bg-red-600 border-0" isLoading={isLoading}>
                Entrar no Sistema <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
        </form>

        <button onClick={onBack} className="w-full mt-6 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">
            Voltar
        </button>
      </Card>
    </div>
  );
};