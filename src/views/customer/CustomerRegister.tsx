"use client";

import React, { useState } from 'react';
import { db } from '../../services/db';
import { Button, Card, Input } from '../../components/ui';
import { UserPlus, MapPin, Smartphone, Lock, User, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomerRegisterProps {
  onRegister: (customer: any) => void;
  onBackToLogin: () => void;
}

export const CustomerRegister: React.FC<CustomerRegisterProps> = ({ onRegister, onBackToLogin }) => {
  const [formData, setFormData] = useState({
      name: '',
      phone: '',
      password: '',
      address: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.password || !formData.address) {
        toast.error("Preencha todos os campos obrigatórios.");
        return;
    }

    setIsLoading(true);
    const customer = await db.registerCustomer(formData);
    setIsLoading(false);

    if (customer) {
        toast.success("Conta criada com sucesso!");
        onRegister(customer);
    } else {
        toast.error("Erro ao criar conta. Tente outro telefone.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8 bg-white border-slate-100 shadow-xl">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <UserPlus size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Criar Conta</h2>
            <p className="text-slate-500 text-sm mt-1">Junte-se ao ZapMenu para pedir rápido.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
            <Input 
                label="Nome Completo" 
                placeholder="Ex: Maria Silva" 
                value={formData.name} 
                onChange={(e: any) => setFormData({...formData, name: e.target.value})} 
            />
            <Input 
                label="WhatsApp" 
                placeholder="DDD + Número" 
                value={formData.phone} 
                onChange={(e: any) => setFormData({...formData, phone: e.target.value})} 
            />
            <Input 
                label="Endereço de Entrega" 
                placeholder="Rua, Número, Bairro" 
                value={formData.address} 
                onChange={(e: any) => setFormData({...formData, address: e.target.value})} 
            />
            <Input 
                label="Sua Senha" 
                type="password" 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={(e: any) => setFormData({...formData, password: e.target.value})} 
            />
            <Button type="submit" className="w-full py-4 bg-red-600 border-0 mt-2" isLoading={isLoading}>
                Finalizar Cadastro
            </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50">
            <button 
                onClick={onBackToLogin} 
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-slate-500 font-bold text-xs hover:bg-slate-50 transition-all"
            >
                <ArrowLeft size={14} /> Já tenho conta
            </button>
        </div>
      </Card>
    </div>
  );
};