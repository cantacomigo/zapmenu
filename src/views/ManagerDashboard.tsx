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

  if (!restaurant) return <div className="flex h-screen items-center justify-center bg-slate-50 text-xs font-bold text-slate-400">CARREGANDO...</div>;

  const NavButton: React.FC<{ id: TabType, icon: any, label: string }> = ({ id, icon: Icon, label }) => (
    <button 
        onClick={() => setTab(id)} 
        className={`w-full flex items-center px-4 py-3 rounded-xl text-xs font-bold transition-all relative group ${tab === id ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' : 'text-slate-500 hover:bg-slate-50'}`}
    >
        <Icon className={`w-4 h-4 mr-3 ${tab === id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
        {label}
        {tab === id && <div className="absolute right-3 w-1 h-1 rounded-full bg-white"></div>}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50/50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 hidden lg:flex flex-col z-10">
        <div className="p-6 pb-4">
             <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                 <img src={restaurant.logo} className="w-10 h-10 rounded-xl object-cover shadow-sm bg-white" />
                 <div className="truncate">
                     <h2 className="text-sm font-black text-slate-900 leading-tight truncate">{restaurant.name}</h2>
                     <Badge color="bg-red-100 text-red-700" className="text-[10px] py-0">Online</Badge>
                 </div>
             </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Operação</p>
            <NavButton id="menu" icon={Utensils} label="Cardápio" />
            <NavButton id="orders" icon={ClipboardList} label="Pedidos" />
            
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mt-6 mb-2">Relacionamento</p>
            <NavButton id="customers" icon={Users} label="Clientes" />
            <NavButton id="marketing" icon={Megaphone} label="Promoções" />
            <NavButton id="reports" icon={BarChart3} label="Relatórios" />
            
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mt-6 mb-2">Sistema</p>
            <NavButton id="settings" icon={Settings} label="Configurações" />
        </nav>

        <div className="p-4 border-t border-slate-50">
            <button onClick={onLogout} className="w-full flex items-center px-4 py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all">
                <LogOut className="w-4 h-4 mr-3" />
                Sair
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-20 px-6 py-4 flex justify-between items-center">
            <h1 className="text-base font-black text-slate-900 tracking-tight">
                {tab === 'menu' ? 'Cardápio' : 
                 tab === 'orders' ? 'Pedidos' :
                 tab === 'customers' ? 'Clientes' :
                 tab === 'marketing' ? 'Marketing' :
                 tab === 'reports' ? 'Relatórios' : 'Configurações'}
            </h1>
            <div className="flex items-center gap-3">
                <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 relative">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="h-6 w-px bg-slate-100 mx-1"></div>
                <div className="flex items-center gap-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-900 leading-none">Admin</p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-md"></div>
                </div>
            </div>
        </header>

        <div className="max-w-6xl mx-auto p-6 md:p-8 animate-in fade-in duration-700">
            {tab === 'menu' && <MenuTab restaurantId={restaurantId} categories={categories} items={items} onRefresh={refreshData} />}
            {tab === 'orders' && <OrdersTab orders={orders} onRefresh={refreshData} />}
            {tab === 'customers' && <CustomersTab restaurantId={restaurantId} />}
            {tab === 'reports' && <ReportsTab restaurantId={restaurantId} />}
            {tab === 'marketing' && <MarketingTab restaurantId={restaurantId} />}
            {tab === 'settings' && (
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Configurações</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Identidade da sua loja e regras de negócio.</p>
                        </div>
                        <Button 
                            size="sm"
                            className="w-full md:w-auto bg-red-600 border-0"
                            onClick={async () => {
                                setIsSavingSettings(true);
                                await db.updateRestaurant(restaurant);
                                setIsSavingSettings(false);
                                toast.success("Salvo!");
                            }} 
                            isLoading={isSavingSettings}
                        >Salvar Alterações</Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-red-500 rounded-full"></div>
                                        Dados Gerais
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="Nome Fantasia" size="sm" value={restaurant.name} onChange={(e: any) => setRestaurant({...restaurant, name: e.target.value})} />
                                        <Input label="Link da Loja" size="sm" value={restaurant.slug} onChange={(e: any) => setRestaurant({...restaurant, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="WhatsApp" size="sm" value={restaurant.phone} onChange={(e: any) => setRestaurant({...restaurant, phone: e.target.value})} />
                                        <Input label="Endereço" size="sm" value={restaurant.address} onChange={(e: any) => setRestaurant({...restaurant, address: e.target.value})} />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-50"></div>

                                <div className="space-y-4">
                                    <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
                                        Entrega
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="Pedido Mínimo" size="sm" type="number" value={restaurant.minOrderValue || ''} onChange={(e: any) => setRestaurant({...restaurant, minOrderValue: Number(e.target.value)})} />
                                        <Input label="Taxa" size="sm" type="number" value={restaurant.deliveryFee || ''} onChange={(e: any) => setRestaurant({...restaurant, deliveryFee: Number(e.target.value)})} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 space-y-6">
                                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-red-600 rounded-full"></div>
                                    Visual
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ImageUpload label="Logo" value={restaurant.logo} onChange={(val: string) => setRestaurant({...restaurant, logo: val})} />
                                    <ImageUpload label="Banner" value={restaurant.coverImage} onChange={(val: string) => setRestaurant({...restaurant, coverImage: val})} />
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="p-6 bg-slate-900 text-white relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/20 rounded-full blur-3xl"></div>
                                <h3 className="font-black text-base mb-1 relative z-10">Link Direto</h3>
                                <p className="text-slate-400 text-[10px] mb-6 relative z-10 font-medium">QR Code para mesas ou link social.</p>
                                
                                <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-xl relative z-10">
                                    <QRCodeSVG value={menuUrl} size={140} />
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <Button size="sm" className="w-full bg-red-600 border-none py-3" onClick={() => {
                                        navigator.clipboard.writeText(menuUrl);
                                        toast.success("Copiado!");
                                    }}><Copy className="w-3.5 h-3.5 mr-2" /> Copiar Link</Button>
                                    
                                    <a href={menuUrl} target="_blank" className="flex items-center justify-center gap-2 py-2 text-[10px] font-black text-red-500 uppercase tracking-widest">
                                        Ver Online <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
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