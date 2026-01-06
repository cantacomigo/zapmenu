import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/src/services/db';
import { Category, MenuItem, Order, Restaurant } from '@/src/types';
import { Button, Card, Input, Badge } from '@/src/components/ui';
import { ImageUpload } from '@/src/components/ImageUpload';
import { MenuTab } from '@/src/views/manager/MenuTab';
import { OrdersTab } from '@/src/views/manager/OrdersTab';
import { CustomersTab } from '@/src/views/manager/CustomersTab';
import { ReportsTab } from '@/src/views/manager/ReportsTab';
import { MarketingTab } from '@/src/views/manager/MarketingTab';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Utensils, ClipboardList, LogOut, Settings, QrCode, Copy, ExternalLink, Users, BarChart3, Megaphone, Clock, Menu, X } from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const refreshData = async () => {
    setCategories(await db.getCategories(restaurantId));
    setItems(await db.getMenuItems(restaurantId));
    setOrders(await db.getOrders(restaurantId));
  };

  useEffect(() => {
    const init = async () => {
        const r = await db.getRestaurantById(restaurantId);
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

  if (!restaurant) return <div className="flex h-screen items-center justify-center">Carregando painel...</div>;

  const NavButton: React.FC<{ id: TabType, icon: any, label: string, hideLabel?: boolean }> = ({ id, icon: Icon, label, hideLabel }) => (
    <button 
        onClick={() => {
            setTab(id);
            setIsMobileMenuOpen(false);
        }} 
        className={`flex flex-col md:flex-row items-center justify-center md:justify-start px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all ${tab === id ? 'bg-emerald-50 text-emerald-700 md:shadow-sm md:border border-emerald-100' : 'text-slate-400 md:text-slate-600 hover:bg-slate-50 border border-transparent'}`}
    >
        <Icon className={`w-6 h-6 md:w-5 md:h-5 md:mr-3 ${tab === id ? 'text-emerald-600' : 'text-slate-400'}`} />
        {!hideLabel && <span className="text-[10px] md:text-sm font-bold md:font-semibold mt-1 md:mt-0">{label}</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col z-20">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
             <img src={restaurant.logo} className="w-10 h-10 rounded-xl object-cover shadow-sm bg-slate-100" />
             <div className="truncate">
                 <h2 className="font-bold text-slate-800 leading-tight truncate">{restaurant.name}</h2>
                 <p className="text-xs text-slate-400 font-medium">Gestor da Loja</p>
             </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
            <NavButton id="menu" icon={Utensils} label="Cardápio" />
            <NavButton id="orders" icon={ClipboardList} label="Pedidos" />
            <NavButton id="customers" icon={Users} label="Clientes" />
            <NavButton id="reports" icon={BarChart3} label="Relatórios" />
            <NavButton id="marketing" icon={Megaphone} label="Marketing" />
            <div className="pt-4 mt-4 border-t border-slate-100">
                <NavButton id="settings" icon={Settings} label="Configurações" />
            </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
            <button onClick={onLogout} className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogOut className="w-5 h-5 mr-3" />
                Sair do Painel
            </button>
        </div>
      </aside>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header Mobile */}
        <header className="md:hidden bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center z-30">
            <div className="flex items-center gap-2">
                <img src={restaurant.logo} className="w-8 h-8 rounded-lg object-cover" />
                <h1 className="font-black text-slate-900 text-sm tracking-tight truncate max-w-[150px]">{restaurant.name}</h1>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setTab('settings')} className={`p-2 rounded-lg ${tab === 'settings' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'}`}>
                    <Settings size={20} />
                </button>
                <button onClick={onLogout} className="p-2 text-slate-400">
                    <LogOut size={20} />
                </button>
            </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 pb-20 md:pb-0">
          <div className="max-w-6xl mx-auto p-4 md:p-12">
              {tab === 'menu' && <MenuTab restaurantId={restaurantId} categories={categories} items={items} onRefresh={refreshData} />}
              {tab === 'orders' && (
                  <OrdersTab 
                      orders={orders} 
                      onRefresh={refreshData} 
                      restaurantName={restaurant.name} 
                      restaurantLogo={restaurant.logo}
                  />
              )}
              {tab === 'customers' && <CustomersTab restaurantId={restaurantId} />}
              {tab === 'reports' && <ReportsTab restaurantId={restaurantId} />}
              {tab === 'marketing' && <MarketingTab restaurantId={restaurantId} />}
              {tab === 'settings' && (
                  <div className="space-y-8">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Configurações</h2>
                          <Button className="w-full md:w-auto" onClick={async () => {
                              setIsSavingSettings(true);
                              await db.updateRestaurant(restaurant);
                              setIsSavingSettings(false);
                              toast.success("Configurações salvas!");
                          }} isLoading={isSavingSettings}>Salvar Alterações</Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                          <div className="lg:col-span-2 space-y-6">
                              <Card className="p-6 md:p-8 space-y-6">
                                  <h3 className="font-bold text-slate-900 text-lg">Informações da Loja</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <Input label="Nome da Loja" value={restaurant.name} onChange={(e: any) => setRestaurant({...restaurant, name: e.target.value})} />
                                      <Input label="WhatsApp da Loja" value={restaurant.phone} onChange={(e: any) => setRestaurant({...restaurant, phone: e.target.value})} />
                                  </div>
                                  <Input label="Endereço Físico" value={restaurant.address} onChange={(e: any) => setRestaurant({...restaurant, address: e.target.value})} />
                                  
                                  <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-slate-100 space-y-4">
                                      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                          <Clock className="w-4 h-4 text-emerald-600" /> Horário de Funcionamento
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                          <Input label="Abre às" type="time" value={restaurant.openingTime || '08:00'} onChange={(e: any) => setRestaurant({...restaurant, openingTime: e.target.value})} />
                                          <Input label="Fecha às" type="time" value={restaurant.closingTime || '22:00'} onChange={(e: any) => setRestaurant({...restaurant, closingTime: e.target.value})} />
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <Input label="Pedido Mínimo (R$)" type="number" value={restaurant.minOrderValue || ''} onChange={(e: any) => setRestaurant({...restaurant, minOrderValue: Number(e.target.value)})} />
                                      <Input label="Taxa de Entrega (R$)" type="number" value={restaurant.deliveryFee || ''} onChange={(e: any) => setRestaurant({...restaurant, deliveryFee: Number(e.target.value)})} />
                                  </div>
                                  <Input label="Chave Pix (Recebimentos)" value={restaurant.pixKey || ''} onChange={(e: any) => setRestaurant({...restaurant, pixKey: e.target.value})} placeholder="CPF, E-mail ou Celular" />
                              </Card>
                              <Card className="p-6 md:p-8 space-y-6">
                                  <h3 className="font-bold text-slate-900 text-lg">Visual e Identidade</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                      <ImageUpload label="Logo (Quadrado)" value={restaurant.logo} onChange={(val: string) => setRestaurant({...restaurant, logo: val})} />
                                      <ImageUpload label="Capa do Cardápio" value={restaurant.coverImage} onChange={(val: string) => setRestaurant({...restaurant, coverImage: val})} />
                                  </div>
                              </Card>
                          </div>
                          <div className="space-y-6">
                              <Card className="p-8 bg-slate-900 text-white text-center relative overflow-hidden">
                                  <div className="absolute -top-10 -right-10 p-4 opacity-5">
                                      <QrCode size={200} />
                                  </div>
                                  <h3 className="font-bold text-lg mb-2">QR Code da Loja</h3>
                                  <p className="text-slate-400 text-xs mb-6">Imprima e coloque nas mesas ou balcão.</p>
                                  <div className="bg-white p-4 rounded-3xl inline-block mb-6 shadow-2xl">
                                      <QRCodeSVG value={menuUrl} size={140} />
                                  </div>
                                  <div className="space-y-3">
                                      <Button className="w-full bg-emerald-500 hover:bg-emerald-400 border-none font-black uppercase text-[10px] tracking-widest py-3" onClick={() => {
                                          navigator.clipboard.writeText(menuUrl);
                                          toast.success("Link copiado!");
                                      }}><Copy className="w-3.5 h-3.5 mr-2" /> Copiar Link</Button>
                                      <a href={menuUrl} target="_blank" className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:underline">
                                          Testar Cardápio <ExternalLink className="w-3 h-3 inline ml-1" />
                                      </a>
                                  </div>
                              </Card>
                          </div>
                      </div>
                  </div>
              )}
          </div>
        </main>

        {/* Bottom Navigation Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-2 flex justify-around items-center z-40 shadow-[0_-5px_15px_-3px_rgba(0,0,0,0.05)]">
            <NavButton id="menu" icon={Utensils} label="Cardápio" />
            <NavButton id="orders" icon={ClipboardList} label="Pedidos" />
            <NavButton id="reports" icon={BarChart3} label="Relatórios" />
            <NavButton id="marketing" icon={Megaphone} label="Marketing" />
        </nav>
      </div>
    </div>
  );
};