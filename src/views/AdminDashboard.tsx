import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Restaurant, AdminUser } from '../types';
import { Button, Card, Input, Modal, Badge, ImageUpload } from '../components/ui';
import { Plus, Trash2, ExternalLink, Building2, Search, LogOut, Edit2, Users, Store, Shield, Database, ChefHat } from 'lucide-react';

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
  
  // Restaurant Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRest, setCurrentRest] = useState<Partial<Restaurant>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Admin User Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<Partial<AdminUser>>({});
  const [isAdminEditing, setIsAdminEditing] = useState(false);

  const fetchData = async () => {
      setIsLoading(true);
      const rests = await db.getRestaurants();
      setRestaurants(rests);
      const ads = await db.getAdmins();
      setAdmins(ads);
      setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeed = async () => {
      if (confirm("Isso irá popular o banco de dados com dados de exemplo. Continuar?")) {
          setIsLoading(true);
          await db.seedDatabase();
          await fetchData();
          alert("Banco de dados populado com sucesso!");
      }
  };

  // --- Restaurant Handlers ---
  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentRest({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rest: Restaurant) => {
    setIsEditing(true);
    setCurrentRest({ ...rest });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentRest.name || !currentRest.slug || !currentRest.phone) return;
    
    if (isEditing && currentRest.id) {
        // Update existing
        await db.updateRestaurant(currentRest as Restaurant);
    } else {
        // Create new
        const restaurant: Restaurant = {
          name: currentRest.name,
          slug: currentRest.slug.toLowerCase().replace(/\s+/g, '-'),
          phone: currentRest.phone,
          address: currentRest.address || '',
          logo: currentRest.logo || `https://placehold.co/200x200/png?text=Logo`,
          coverImage: currentRest.coverImage || `https://placehold.co/800x300/png?text=Cover`,
          coverImages: currentRest.coverImages || [],
          isActive: true,
        } as Restaurant;
        await db.addRestaurant(restaurant);
    }

    await fetchData();
    setIsModalOpen(false);
    setCurrentRest({});
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este estabelecimento?")) {
      await db.deleteRestaurant(id);
      await fetchData();
    }
  };

  // Image Helper for Modal
  const handleAddCoverImage = (base64: string) => {
    const currentImages = currentRest.coverImages || (currentRest.coverImage ? [currentRest.coverImage] : []);
    const newImages = [...currentImages, base64];
    setCurrentRest({ ...currentRest, coverImages: newImages, coverImage: newImages[0] });
  };

  const handleRemoveCoverImage = (index: number) => {
    const currentImages = currentRest.coverImages || (currentRest.coverImage ? [currentRest.coverImage] : []);
    const newImages = currentImages.filter((_, i) => i !== index);
    setCurrentRest({ ...currentRest, coverImages: newImages, coverImage: newImages[0] || '' });
  };


  // --- Admin User Handlers ---
  const handleOpenCreateAdmin = () => {
    setIsAdminEditing(false);
    setCurrentAdmin({});
    setIsAdminModalOpen(true);
  };

  const handleOpenEditAdmin = (admin: AdminUser) => {
    setIsAdminEditing(true);
    setCurrentAdmin({ ...admin });
    setIsAdminModalOpen(true);
  };

  const handleSaveAdmin = async () => {
    if (!currentAdmin.name || !currentAdmin.email) return;

    if (isAdminEditing && currentAdmin.id) {
        await db.updateAdmin(currentAdmin as AdminUser);
    } else {
        const newAdmin: AdminUser = {
            name: currentAdmin.name,
            email: currentAdmin.email,
            role: currentAdmin.role || 'support',
            createdAt: Date.now()
        } as AdminUser;
        await db.addAdmin(newAdmin);
    }
    await fetchData();
    setIsAdminModalOpen(false);
    setCurrentAdmin({});
  };

  const handleDeleteAdmin = async (id: string) => {
      if (confirm("Remover este administrador?")) {
          await db.deleteAdmin(id);
          await fetchData();
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Painel Super Admin</h1>
            <p className="text-slate-500 mt-2 text-lg">Gerencie todos os recursos da plataforma.</p>
          </div>
          <div className="flex gap-2">
            {restaurants.length === 0 && (
                <Button variant="primary" onClick={handleSeed} isLoading={isLoading} className="bg-amber-500 hover:bg-amber-600 border-transparent text-white shadow-amber-500/20">
                    <Database className="w-5 h-5 mr-2" />
                    Restaurar Dados Demo
                </Button>
            )}
            <Button variant="secondary" onClick={onBack}>
                <LogOut className="w-5 h-5 mr-2" />
                Sair
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-sm">
            <button 
                onClick={() => setActiveTab('restaurants')}
                className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'restaurants' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
                <Store className="w-4 h-4 mr-2" />
                Estabelecimentos
            </button>
            <button 
                onClick={() => setActiveTab('admins')}
                className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'admins' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
                <Shield className="w-4 h-4 mr-2" />
                Administradores
            </button>
        </div>

        {/* RESTAURANTS TAB */}
        {activeTab === 'restaurants' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-end">
                    <Button size="lg" onClick={handleOpenCreate} className="shadow-lg shadow-emerald-500/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Restaurante
                    </Button>
                </div>

                {restaurants.length === 0 && !isLoading && (
                    <div className="text-center py-20 bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200">
                         <h3 className="text-xl font-bold text-slate-700">Nenhum estabelecimento encontrado</h3>
                         <p className="text-slate-500 mt-2 mb-6">Cadastre o primeiro restaurante ou restaure os dados de demonstração.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {restaurants.map((rest) => (
                        <div key={rest.id} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="h-40 bg-slate-100 overflow-hidden relative">
                            <img src={rest.coverImage} alt={rest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                            <div className="absolute bottom-4 right-4">
                                <Badge color={rest.isActive ? 'bg-emerald-500 text-white border-transparent shadow-lg' : 'bg-slate-500 text-white'}>
                                    {rest.isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </div>
                        </div>
                        <div className="px-6 relative">
                            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white -mt-10 relative z-10">
                            <img src={rest.logo} alt="logo" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        
                        <div className="p-6 pt-4">
                            <h3 className="text-xl font-bold text-slate-900 mb-1">{rest.name}</h3>
                            <p className="text-sm text-slate-500 mb-6 flex items-center font-medium bg-slate-50 py-1 px-3 rounded-lg w-fit">
                                <Building2 className="w-3.5 h-3.5 mr-2" /> /{rest.slug}
                            </p>
                            
                            <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1" onClick={() => onNavigate(rest.slug)}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Menu
                            </Button>
                            <Button variant="secondary" className="px-3" onClick={() => onManage(rest.id)} title="Gerenciar Painel">
                                <ChefHat className="w-4 h-4 text-slate-600" />
                            </Button>
                            <Button variant="ghost" className="px-3" onClick={() => handleOpenEdit(rest)} title="Editar">
                                <Edit2 className="w-4 h-4 text-slate-500 hover:text-emerald-600" />
                            </Button>
                            <Button variant="ghost" className="px-3 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(rest.id)} title="Excluir">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            </div>
                        </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* ADMINS TAB */}
        {activeTab === 'admins' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-end">
                    <Button size="lg" onClick={handleOpenCreateAdmin} className="shadow-lg shadow-emerald-500/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Administrador
                    </Button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Nome</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Função</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {admins.map(admin => (
                                <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-slate-900">{admin.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm text-slate-600 font-medium">
                                        {admin.email}
                                    </td>
                                    <td className="px-8 py-5">
                                        <Badge color={admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200'}>
                                            {admin.role === 'super_admin' ? 'Super Admin' : 'Suporte'}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenEditAdmin(admin)}>
                                                <Edit2 className="w-4 h-4 text-slate-500 hover:text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAdmin(admin.id)}>
                                                <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-600" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* RESTAURANT MODAL */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Editar Estabelecimento" : "Adicionar Estabelecimento"}>
          <div className="space-y-5">
            <Input 
              label="Nome do Restaurante" 
              value={currentRest.name || ''} 
              onChange={e => setCurrentRest({...currentRest, name: e.target.value})}
              placeholder="Ex: Pizzaria do João"
            />
            <Input 
              label="Slug (URL)" 
              value={currentRest.slug || ''} 
              onChange={e => setCurrentRest({...currentRest, slug: e.target.value})}
              placeholder="Ex: pizzaria-joao"
            />
             <Input 
              label="WhatsApp (apenas números, com DDD)" 
              value={currentRest.phone || ''} 
              onChange={e => setCurrentRest({...currentRest, phone: e.target.value})}
              placeholder="Ex: 5511999999999"
            />
            <Input 
              label="Endereço" 
              value={currentRest.address || ''} 
              onChange={e => setCurrentRest({...currentRest, address: e.target.value})}
            />
            
            <ImageUpload 
                label="Logo do Restaurante" 
                value={currentRest.logo} 
                onChange={val => setCurrentRest({...currentRest, logo: val})} 
            />
            
            <div className="w-full">
                <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Imagens de Capa (Carrossel)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    {(currentRest.coverImages || (currentRest.coverImage ? [currentRest.coverImage] : [])).map((img, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden h-24 border border-slate-200">
                            <img src={img} className="w-full h-full object-cover" />
                            <button 
                                onClick={() => handleRemoveCoverImage(idx)}
                                className="absolute top-1 right-1 bg-white text-red-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    <div className="h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center relative hover:bg-slate-100 transition-colors">
                            <div className="text-center pointer-events-none">
                                <Plus className="w-5 h-5 mx-auto text-slate-400" />
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Adicionar</span>
                            </div>
                            <div className="absolute inset-0 opacity-0 cursor-pointer">
                                <ImageUpload label="" value="" onChange={handleAddCoverImage} />
                            </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{isEditing ? "Salvar Alterações" : "Criar Estabelecimento"}</Button>
            </div>
          </div>
        </Modal>

        {/* ADMIN USER MODAL */}
        <Modal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} title={isAdminEditing ? "Editar Administrador" : "Novo Administrador"}>
            <div className="space-y-5">
                <Input 
                    label="Nome Completo" 
                    value={currentAdmin.name || ''} 
                    onChange={e => setCurrentAdmin({...currentAdmin, name: e.target.value})}
                />
                <Input 
                    label="Email" 
                    type="email"
                    value={currentAdmin.email || ''} 
                    onChange={e => setCurrentAdmin({...currentAdmin, email: e.target.value})}
                />
                <div className="w-full">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Função</label>
                    <div className="relative">
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none transition-all"
                            value={currentAdmin.role || 'support'}
                            onChange={e => setCurrentAdmin({...currentAdmin, role: e.target.value as any})}
                        >
                            <option value="super_admin">Super Admin</option>
                            <option value="support">Suporte</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                           <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>
                 </div>

                 <div className="pt-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setIsAdminModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveAdmin}>{isAdminEditing ? "Salvar" : "Criar"}</Button>
                 </div>
            </div>
        </Modal>

      </div>
    </div>
  );
};