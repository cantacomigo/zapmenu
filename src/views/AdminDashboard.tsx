import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Restaurant, AdminUser } from '../types';
import { Button, Modal, Input } from '../components/ui';
import { RestaurantCard } from '../components/admin/RestaurantCard';
import { AdminsTab } from '../views/admin/AdminsTab';
import { Plus, LogOut, LayoutGrid, Users, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  onNavigate: (slug: string) => void;
  onManage: (id: string) => void;
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onManage, onBack }) => {
  const [activeTab, setActiveTab] = useState<'restaurants' | 'admins'>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRest, setCurrentRest] = useState<Partial<Restaurant>>({});
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const rests = await db.getRestaurants();
    setRestaurants(rests);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!currentRest.name || !currentRest.slug) {
        toast.error("Por favor, preencha o nome e o link (slug).");
        return;
    }
    if (isEditing && currentRest.id) {
        await db.updateRestaurant(currentRest as Restaurant);
        toast.success("Restaurante atualizado!");
    } else {
        await db.addRestaurant({ ...currentRest, isActive: true } as Restaurant);
        toast.success("Restaurante criado com sucesso!");
    }
    await fetchData();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente remover este estabelecimento? Esta ação não pode ser desfeita.")) {
        await db.deleteRestaurant(id);
        toast.success("Restaurante removido.");
        fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                <Shield className="w-6 h-6" />
             </div>
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">Central Administrativa</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={onBack}><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
        </div>

        <div className="flex gap-2 mb-8 bg-white p-1 rounded-xl border border-slate-100 w-fit shadow-sm">
          <button 
            onClick={() => setActiveTab('restaurants')} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition-all ${activeTab === 'restaurants' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutGrid size={14} /> Restaurantes
          </button>
          <button 
            onClick={() => setActiveTab('admins')} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition-all ${activeTab === 'admins' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={14} /> Equipe Admin
          </button>
        </div>

        {activeTab === 'restaurants' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-end">
              <Button onClick={() => { setIsEditing(false); setCurrentRest({}); setIsModalOpen(true); }}><Plus className="mr-2 w-4 h-4" /> Novo Restaurante</Button>
            </div>
            {isLoading ? (
                <div className="text-center py-20 text-slate-400 font-bold text-xs uppercase">Carregando estabelecimentos...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restaurants.map(rest => (
                    <RestaurantCard 
                      key={rest.id} 
                      rest={rest} 
                      onNavigate={onNavigate} 
                      onManage={onManage} 
                      onEdit={(r) => { setIsEditing(true); setCurrentRest(r); setIsModalOpen(true); }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
            )}
            {restaurants.length === 0 && !isLoading && (
                <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100 text-slate-400">
                    <p className="font-bold text-sm">Nenhum restaurante cadastrado.</p>
                </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
             <AdminsTab />
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Editar Restaurante" : "Novo Restaurante"}>
          <div className="space-y-4">
            <Input label="Nome da Loja" placeholder="Ex: Pizzaria do Vale" value={currentRest.name || ''} onChange={(e: any) => setCurrentRest({...currentRest, name: e.target.value})} />
            <Input label="Link da Loja (Slug)" placeholder="pizzaria-do-vale" value={currentRest.slug || ''} onChange={(e: any) => setCurrentRest({...currentRest, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} />
            <Input label="WhatsApp (DDD + Número)" placeholder="5511999999999" value={currentRest.phone || ''} onChange={(e: any) => setCurrentRest({...currentRest, phone: e.target.value})} />
            <Button className="w-full mt-2" onClick={handleSave}>{isEditing ? "Salvar Alterações" : "Criar Restaurante"}</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};