"use client";

import React, { useState } from 'react';
import { db } from '../../services/db';
import { Button, Card, Input } from '../../components/ui';
import { ChefHat, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface ManagerLoginProps {
  onLogin: (staff: any) => void;
  onBack: () => void;
}

export const ManagerLogin: React.FC<ManagerLoginProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const staff = await db.loginStaff(email, password);
    setIsLoading(false);

    if (staff) {
        toast.success(`Olá, ${staff.name}!`);
        onLogin(staff);
    } else {
        toast.error("E-mail ou senha incorretos.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8 bg-white border-slate-100 shadow-xl">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <ChefHat size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Portal da Loja</h2>
            <p className="text-slate-500 text-sm mt-1">Gerencie seu cardápio e pedidos.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            <Input 
                label="E-mail Corporativo" 
                placeholder="gerente@sualoja.com" 
                value={email} 
                onChange={(e: any) => setEmail(e.target.value)} 
            />
            <Input 
                label="Senha de Acesso" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e: any) => setPassword(e.target.value)} 
            />
            <Button type="submit" className="w-full py-4 bg-orange-600 border-0" isLoading={isLoading}>
                Acessar Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
        </form>

        <button onClick={onBack} className="w-full mt-6 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">
            Voltar
        </button>
      </Card>
    </div>
  );
};