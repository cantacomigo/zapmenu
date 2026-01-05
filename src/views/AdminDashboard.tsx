import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Restaurant, AdminUser } from '../types';
import { Button, Modal, Input } from '../components/ui';
import { RestaurantCard } from '../components/admin/RestaurantCard';
import { Plus, LogOut } from 'lucide-react';

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
    if (!currentRest.name || !currentRest.slug) return;
    if (isEditing && currentRest.id) {
        await db.updateRestaurant(currentRest as Restaurant);
    } else {
        await db.addRestaurant({ ...currentRest, isActive: true } as Restaurant);
    }
    await fetchData();
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Admin ZapMenu</h1>
          <Button variant="secondary" onClick={onBack}><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
        </div>

        <div className="flex gap-2 mb-8 bg-white p-1 rounded-xl border border-slate-200 w-fit">
          <button onClick={() => setActiveTab('restaurants')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'restaurants' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Estabelecimentos</button>
          <button onClick={() => setActiveTab('admins')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'admins' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Admins</button>
        </div>

        {activeTab === 'restaurants' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => { setIsEditing(false); setCurrentRest({}); setIsModalOpen(true); }}><Plus className="mr-2" /> Novo</Button>
            </div>
            {isLoading ? (
                <div className="text-center py-20 text-slate-400">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restaurants.map(rest => (
                    <RestaurantCard 
                      key={rest.id} 
                      rest={rest} 
                      onNavigate={onNavigate} 
                      onManage={onManage} 
                      onEdit={(r) => { setIsEditing(true); setCurrentRest(r); setIsModalOpen(true); }}
                      onDelete={async (id) => { if(confirm("Remover?")) { await db.deleteRestaurant(id); fetchData(); } }}
                    />
                  ))}
                </div>
            )}
          </div>
        )}

        {activeTab === 'admins' && (
             <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
                 <p className="text-slate-500">Gestão de administradores em breve.</p>
             </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Restaurante">
          <div className="space-y-4">
            <Input label="Nome" value={currentRest.name || ''} onChange={e => setCurrentRest({...currentRest, name: e.target.value})} />
            <Input label="Slug" value={currentRest.slug || ''} onChange={e => setCurrentRest({...currentRest, slug: e.target.value})} />
            <Input label="WhatsApp" value={currentRest.phone || ''} onChange={e => setCurrentRest({...currentRest, phone: e.target.value})} />
            <Button className="w-full" onClick={handleSave}>Salvar</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};