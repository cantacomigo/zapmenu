"use client";

import React, { useState } from 'react';
import { db } from '../../services/db';
import { Button, Card, Input } from '../../components/ui';
import { Smartphone, Lock, ArrowRight, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomerLoginProps {
  onLogin: (customer: any) => void;
  onGoToRegister: () => void;
  onBack: () => void;
}

export const CustomerLogin: React.FC<CustomerLoginProps> = ({ onLogin, onGoToRegister, onBack }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
        toast.error("Preencha todos os campos.");
        return;
    }

    setIsLoading(true);
    const customer = await db.loginCustomer(phone, password);
    setIsLoading(false);

    if (customer) {
        toast.success(`Bem-vindo, ${customer.name}!`);
        onLogin(customer);
    } else {
        toast.error("Telefone ou senha incorretos.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8 bg-white border-slate-100 shadow-xl">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Smartphone size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Login do Cliente</h2>
            <p className="text-slate-500 text-sm mt-1">Acesse sua conta para fazer pedidos.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            <Input 
                label="WhatsApp" 
                placeholder="DDD + Número" 
                value={phone} 
                onChange={(e: any) => setPhone(e.target.value)} 
            />
            <Input 
                label="Senha" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e: any) => setPassword(e.target.value)} 
            />
            <Button type="submit" className="w-full py-4 bg-red-600 border-0" isLoading={isLoading}>
                Entrar <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 space-y-3">
            <button 
                onClick={onGoToRegister} 
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all"
            >
                <UserPlus size={14} /> Não tem conta? Cadastre-se
            </button>
            <button 
                onClick={onBack} 
                className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
                Voltar para o Início
            </button>
        </div>
      </Card>
    </div>
  );
};