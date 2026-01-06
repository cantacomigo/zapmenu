"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Restaurant, AdminUser } from '../types';
import { Button, Modal, Input, Card, Badge } from '../components/ui';
import { RestaurantCard } from '../components/admin/RestaurantCard';
import { Plus, LogOut, Shield, Mail, Trash2, UserPlus, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  onNavigate: (slug: string) => void;
  onManage: (id: string) => void;
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onManage, onBack }) => {
  const [activeTab, setActiveTab] = useState<'restaurants' | 'admins'>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [currentRest, setCurrentRest] = useState<Partial<Restaurant>>({});
  const [isEditingRest, setIsEditingRest] = useState(false);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState<Partial<AdminUser>>({ role: 'support' });

  const fetchData = async () => {
    setIsLoading(true);
    if (activeTab === 'restaurants') {
      const rests = await db.getRestaurants();
      setRestaurants(rests);
    } else {
      const adminList = await db.getAdmins();
      setAdmins(adminList);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleSaveRest = async () => {
    if (!currentRest.name || !currentRest.slug) {
        toast.error("Nome e Slug são obrigatórios.");
        return;
    }
    if (isEditingRest && currentRest.id) {
        await db.updateRestaurant(currentRest as Restaurant);
        toast.success("Restaurante atualizado!");
    } else {
        await db.addRestaurant({ ...currentRest, isActive: true } as Restaurant);
        toast.success("Novo restaurante cadastrado!");
    }
    await fetchData();
    setIsRestModalOpen(false);
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email) {
        toast.error("Nome e E-mail são obrigatórios.");
        return;
    }
    await db.addAdmin(newAdmin);
    toast.success("Novo administrador adicionado!");
    await fetchData();
    setIsAdminModalOpen(false);
    setNewAdmin({ role: 'support' });
  };

  const handleDeleteAdmin = async (id: string) => {
      if (confirm("Remover este administrador? Esta ação não pode ser desfeita.")) {
          await db.deleteAdmin(id);
          toast.success("Administrador removido.");
          fetchData();
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                  <Shield size={20} />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin <span className="text-red-600">ZapMenu</span></h1>
          </div>
          <Button variant="secondary" onClick={onBack}><LogOut className="mr-2 h-4 w-4" /> Sair do Painel</Button>
        </div>

        <div className="flex gap-2 mb-8 bg-white p-1 rounded-2xl border border-slate-200 w-fit shadow-sm">
          <button 
            onClick={() => setActiveTab('restaurants')} 
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'restaurants' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Building2 className="w-4 h-4 inline mr-2" /> Estabelecimentos
          </button>
          <button 
            onClick={() => setActiveTab('admins')} 
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'admins' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Shield className="w-4 h-4 inline mr-2" /> Administradores
          </button>
        </div>

        {activeTab === 'restaurants' ? (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => { setIsEditingRest(false); setCurrentRest({}); setIsRestModalOpen(true); }} className="bg-red-600 hover:bg-red-700">
                  <Plus className="mr-2 w-4 h-4" /> Novo Estabelecimento
              </Button>
            </div>
            {isLoading ? (
                <div className="text-center py-20 text-slate-400">Carregando estabelecimentos...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restaurants.map(rest => (
                    <RestaurantCard 
                      key={rest.id} 
                      rest={rest} 
                      onNavigate={onNavigate} 
                      onManage={onManage} 
                      onEdit={(r) => { setIsEditingRest(true); setCurrentRest(r); setIsRestModalOpen(true); }}
                      onDelete={async (id) => { if(confirm("Remover este restaurante permanentemente?")) { await db.deleteRestaurant(id); fetchData(); } }}
                    />
                  ))}
                </div>
            )}
          </div>
        ) : (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <Button onClick={() => setIsAdminModalOpen(true)} className="bg-slate-900 hover:bg-slate-800">
                        <UserPlus className="mr-2 w-4 h-4" /> Convidar Administrador
                    </Button>
                </div>
                
                {isLoading ? (
                    <div className="text-center py-20 text-slate-400">Carregando administradores...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {admins.map(admin => (
                            <Card key={admin.id} className="p-6 flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                    <Shield size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 truncate">{admin.name}</h3>
                                    <p className="text-xs text-slate-500 truncate flex items-center mt-0.5">
                                        <Mail className="w-3 h-3 mr-1" /> {admin.email}
                                    </p>
                                    <div className="mt-2">
                                        <Badge color={admin.role === 'super_admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                                            {admin.role === 'super_admin' ? 'Super Admin' : 'Suporte'}
                                        </Badge>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Remover acesso"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* MODAL RESTAURANTE */}
        <Modal isOpen={isRestModalOpen} onClose={() => setIsRestModalOpen(false)} title={isEditingRest ? "Editar Restaurante" : "Novo Restaurante"}>
          <div className="space-y-4">
            <Input label="Nome da Loja" value={currentRest.name || ''} onChange={e => setCurrentRest({...currentRest, name: e.target.value})} placeholder="Ex: Burguer King" />
            <Input label="Slug (Link Único)" value={currentRest.slug || ''} onChange={e => setCurrentRest({...currentRest, slug: e.target.value})} placeholder="ex: burguer-king" />
            <Input label="WhatsApp (DDD + Número)" value={currentRest.phone || ''} onChange={e => setCurrentRest({...currentRest, phone: e.target.value})} placeholder="5511999999999" />
            <Input label="Endereço" value={currentRest.address || ''} onChange={e => setCurrentRest({...currentRest, address: e.target.value})} placeholder="Rua das Flores, 123" />
            <Button className="w-full bg-red-600 hover:bg-red-700 py-4 mt-2" onClick={handleSaveRest}>
                {isEditingRest ? "Salvar Alterações" : "Cadastrar Restaurante"}
            </Button>
          </div>
        </Modal>

        {/* MODAL ADMIN */}
        <Modal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} title="Novo Administrador">
            <div className="space-y-4">
                <Input label="Nome Completo" value={newAdmin.name || ''} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} placeholder="Nome do membro" />
                <Input label="E-mail" value={newAdmin.email || ''} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} placeholder="admin@zapmenu.com" />
                <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700 ml-1">Nível de Acesso</label>
                    <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
                        value={newAdmin.role}
                        onChange={e => setNewAdmin({...newAdmin, role: e.target.value as any})}
                    >
                        <option value="support">Suporte (Acesso Limitado)</option>
                        <option value="super_admin">Super Admin (Acesso Total)</option>
                    </select>
                </div>
                <Button className="w-full bg-slate-900 hover:bg-slate-800 py-4 mt-2" onClick={handleAddAdmin}>
                    Adicionar à Equipe
                </Button>
            </div>
        </Modal>
      </div>
    </div>
  );
};