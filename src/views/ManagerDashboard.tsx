"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/src/services/db';
import { Category, MenuItem, Order, Restaurant } from '@/src/types';
import { Button, Card, Input, Badge, ImageUpload } from '@/src/components/ui';
import { MenuTab } from '@/src/views/manager/MenuTab';
import { OrdersTab } from '@/src/views/manager/OrdersTab';
import { CustomersTab } from '@/src/views/manager/CustomersTab';
import { ReportsTab } from '@/src/views/manager/ReportsTab';
import { MarketingTab } from '@/src/views/manager/MarketingTab';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Utensils, ClipboardList, LogOut, Settings, QrCode, Copy, ExternalLink, Users, BarChart3, Megaphone, Bell } from 'lucide-react';

interface ManagerDashboardProps {
  restaurantId: string;
  onLogout: () => void;
}

type TabType = 'menu' | 'orders' | 'customers' | 'reports' | 'marketing' | 'settings';

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ restaurantId, onLogout }) => {
  const [tab, setTab] = useState<TabType>('menu');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const refreshData = async () => {
    setCategories(await db.getCategories(restaurantId));
    setItems(await db.getMenuItems(restaurantId));
    setOrders(await db.getOrders(restaurantId));
  };

  useEffect(() => {
    const init = async () => {
        const restaurants = await db.getRestaurants();
        const r = restaurants.find(r => r.id === restaurantId);
        if (r) {
            setRestaurant(r);
            await refreshData();
        }
    };
    init();
  }, [restaurantId]);

  const menuUrl = useMemo(() => {
      if (!restaurant) return '';
      return `${window.location.origin}/#menu/${restaurant.slug}`;
  }, [restaurant]);

  if (!restaurant) return <div className="flex h-screen items-center justify-center bg-slate-50 animate-pulse text-slate-400 font-bold">CARREGANDO...</div>;

  const NavButton: React.FC<{ id: TabType, icon: any, label: string }> = ({ id, icon: Icon, label }) => (
    <button 
        onClick={() => setTab(id)} 
        className={`w-full flex items-center px-5 py-4 rounded-2xl text-sm font-bold transition-all relative group ${tab === id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'text-slate-500 hover:bg-slate-50'}`}
    >
        <Icon className={`w-5 h-5 mr-3 transition-colors ${tab === id ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
        {label}
        {tab === id && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50/50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-100 hidden lg:flex flex-col z-10">
        <div className="p-8 pb-4">
             <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                 <img src={restaurant.logo} className="w-12 h-12 rounded-2xl object-cover shadow-sm bg-white" />
                 <div className="truncate">
                     <h2 className="font-black text-slate-900 leading-tight truncate">{restaurant.name}</h2>
                     <Badge color="bg-emerald-100 text-emerald-700">Online</Badge>
                 </div>
             </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-4">Gestão de Operação</p>
            <NavButton id="menu" icon={Utensils} label="Cardápio" />
            <NavButton id="orders" icon={ClipboardList} label="Pedidos" />
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mt-8 mb-4">Relacionamento</p>
            <NavButton id="customers" icon={Users} label="Clientes" />
            <NavButton id="marketing" icon={Megaphone} label="Promoções" />
            <NavButton id="reports" icon={BarChart3} label="Relatórios" />
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mt-8 mb-4">Sistema</p>
            <NavButton id="settings" icon={Settings} label="Configurações" />
        </nav>

        <div className="p-6 border-t border-slate-50">
            <button onClick={onLogout} className="w-full flex items-center px-5 py-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all active:scale-95">
                <LogOut className="w-5 h-5 mr-3" />
                Sair do Sistema
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-20 px-8 py-5 flex justify-between items-center">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {tab === 'menu' ? 'Gestão de Cardápio' : 
                 tab === 'orders' ? 'Monitor de Pedidos' :
                 tab === 'customers' ? 'Base de Clientes' :
                 tab === 'marketing' ? 'Central de Marketing' :
                 tab === 'reports' ? 'Insights e Relatórios' : 'Configurações da Loja'}
            </h1>
            <div className="flex items-center gap-4">
                <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 relative">
                    <Bell size={20} />
                    <span className="absolute top-3 right-3 w-2 h-2 bg-pink-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="h-8 w-px bg-slate-100 mx-1"></div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-slate-900">Admin</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Loja Ativa</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20"></div>
                </div>
            </div>
        </header>

        <div className="max-w-6xl mx-auto p-8 md:p-12 animate-in fade-in duration-700">
            {tab === 'menu' && <MenuTab restaurantId={restaurantId} categories={categories} items={items} onRefresh={refreshData} />}
            {tab === 'orders' && <OrdersTab orders={orders} onRefresh={refreshData} />}
            {tab === 'customers' && <CustomersTab restaurantId={restaurantId} />}
            {tab === 'reports' && <ReportsTab restaurantId={restaurantId} />}
            {tab === 'marketing' && <MarketingTab restaurantId={restaurantId} />}
            {tab === 'settings' && (
                <div className="space-y-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Configurações Gerais</h2>
                            <p className="text-slate-500 mt-1 font-medium">Personalize a identidade da sua loja e regras de negócio.</p>
                        </div>
                        <Button 
                            className="w-full md:w-auto"
                            onClick={async () => {
                                setIsSavingSettings(true);
                                await db.updateRestaurant(restaurant);
                                setIsSavingSettings(false);
                                toast.success("Alterações salvas com sucesso!");
                            }} 
                            isLoading={isSavingSettings}
                        >Salvar Alterações</Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="p-10 space-y-8">
                                <div className="space-y-6">
                                    <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                        <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                                        Dados Públicos
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="Nome Fantasia" value={restaurant.name} onChange={(e: any) => setRestaurant({...restaurant, name: e.target.value})} />
                                        <Input label="Link da Loja (Slug)" value={restaurant.slug} onChange={(e: any) => setRestaurant({...restaurant, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="WhatsApp Comercial" value={restaurant.phone} onChange={(e: any) => setRestaurant({...restaurant, phone: e.target.value})} />
                                        <Input label="Endereço da Loja" value={restaurant.address} onChange={(e: any) => setRestaurant({...restaurant, address: e.target.value})} />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-50"></div>

                                <div className="space-y-6">
                                    <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                        <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                        Regras de Entrega
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="Pedido Mínimo (R$)" type="number" value={restaurant.minOrderValue || ''} onChange={(e: any) => setRestaurant({...restaurant, minOrderValue: Number(e.target.value)})} />
                                        <Input label="Taxa de Entrega (R$)" type="number" value={restaurant.deliveryFee || ''} onChange={(e: any) => setRestaurant({...restaurant, deliveryFee: Number(e.target.value)})} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-10 space-y-8">
                                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                    <div className="w-2 h-6 bg-pink-500 rounded-full"></div>
                                    Identidade Visual
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <ImageUpload label="Logo da Marca (Quadrado)" value={restaurant.logo} onChange={(val: string) => setRestaurant({...restaurant, logo: val})} />
                                    <ImageUpload label="Banner de Capa (Horizontal)" value={restaurant.coverImage} onChange={(val: string) => setRestaurant({...restaurant, coverImage: val})} />
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-8">
                            <Card className="p-10 bg-slate-900 text-white relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl transition-all group-hover:bg-emerald-500/40"></div>
                                <h3 className="font-black text-xl mb-2 relative z-10 tracking-tight">Cardápio Digital</h3>
                                <p className="text-slate-400 text-sm mb-8 relative z-10 font-medium">Divulgue seu link exclusivo ou imprima o QR Code para as mesas.</p>
                                
                                <div className="bg-white p-6 rounded-[2rem] inline-block mb-8 shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500">
                                    <QRCodeSVG value={menuUrl} size={180} />
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <Button className="w-full bg-emerald-500 hover:bg-emerald-400 border-none py-5" onClick={() => {
                                        navigator.clipboard.writeText(menuUrl);
                                        toast.success("Link copiado!");
                                    }}><Copy className="w-4 h-4 mr-2" /> Copiar Link</Button>
                                    
                                    <a href={menuUrl} target="_blank" className="flex items-center justify-center gap-2 py-3 text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest">
                                        Ver Cardápio Online <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </Card>

                            <Card className="p-10 border-dashed border-2 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4">
                                    <Settings className="text-slate-300" />
                                </div>
                                <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Suporte ZapMenu</h4>
                                <p className="text-xs text-slate-400 mt-2 font-medium">Precisa de ajuda para configurar? Entre em contato com nosso suporte.</p>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};