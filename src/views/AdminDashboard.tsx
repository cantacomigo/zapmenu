import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Restaurant, AdminUser } from '../types';
import { Button, Modal, Input } from '../components/ui';
import { RestaurantCard } from '../components/admin/RestaurantCard';
import { Plus, LogOut } from 'lucide-react';
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
          <h1 className="text-3xl font-extrabold text-slate-900">Administração ZapMenu</h1>
          <Button variant="secondary" onClick={onBack}><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
        </div>

        <div className="flex gap-2 mb-8 bg-white p-1 rounded-xl border border-slate-200 w-fit">
          <button onClick={() => setActiveTab('restaurants')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'restaurants' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Estabelecimentos</button>
          <button onClick={() => setActiveTab('admins')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'admins' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Administradores</button>
        </div>

        {activeTab === 'restaurants' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => { setIsEditing(false); setCurrentRest({}); setIsModalOpen(true); }}><Plus className="mr-2" /> Novo Estabelecimento</Button>
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
                      onEdit={(r) => { setIsEditing(true); setCurrentRest(r); setIsModalOpen(true); }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
            )}
            {restaurants.length === 0 && !isLoading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
                    Nenhum restaurante cadastrado.
                </div>
            )}
          </div>
        )}

        {activeTab === 'admins' && (
             <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
                 <p className="text-slate-500">Gestão de administradores em breve.</p>
             </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Editar Restaurante" : "Novo Restaurante"}>
          <div className="space-y-4">
            <Input label="Nome da Loja" placeholder="Ex: Pizzaria do Vale" value={currentRest.name || ''} onChange={(e: any) => setCurrentRest({...currentRest, name: e.target.value})} />
            <Input label="Link da Loja (Slug)" placeholder="pizzaria-do-vale" value={currentRest.slug || ''} onChange={(e: any) => setCurrentRest({...currentRest, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} />
            <Input label="WhatsApp (DDD + Número)" placeholder="5511999999999" value={currentRest.phone || ''} onChange={(e: any) => setCurrentRest({...currentRest, phone: e.target.value})} />
            <Button className="w-full" onClick={handleSave}>{isEditing ? "Salvar Alterações" : "Criar Restaurante"}</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};