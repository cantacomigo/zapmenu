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
import { Utensils, ClipboardList, LogOut, Settings, QrCode, Copy, ExternalLink, Users, BarChart3, Megaphone } from 'lucide-react';

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

  if (!restaurant) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  const NavButton: React.FC<{ id: TabType, icon: any, label: string }> = ({ id, icon: Icon, label }) => (
    <button 
        onClick={() => setTab(id)} 
        className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === id ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
    >
        <Icon className={`w-5 h-5 mr-3 ${tab === id ? 'text-emerald-600' : 'text-slate-400'}`} />
        {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
             <img src={restaurant.logo} className="w-10 h-10 rounded-xl object-cover shadow-sm bg-slate-100" />
             <div className="truncate">
                 <h2 className="font-bold text-slate-800 leading-tight truncate">{restaurant.name}</h2>
                 <p className="text-xs text-slate-400 font-medium">Gestor da Loja</p>
             </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
            <NavButton id="menu" icon={Utensils} label="Cardápio Digital" />
            <NavButton id="orders" icon={ClipboardList} label="Pedidos Recentes" />
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

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
            {tab === 'menu' && <MenuTab restaurantId={restaurantId} categories={categories} items={items} onRefresh={refreshData} />}
            {tab === 'orders' && <OrdersTab orders={orders} onRefresh={refreshData} restaurantName={restaurant.name} />}
            {tab === 'customers' && <CustomersTab restaurantId={restaurantId} />}
            {tab === 'reports' && <ReportsTab restaurantId={restaurantId} />}
            {tab === 'marketing' && <MarketingTab restaurantId={restaurantId} />}
            {tab === 'settings' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-start">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Configurações</h2>
                        <Button onClick={async () => {
                            setIsSavingSettings(true);
                            await db.updateRestaurant(restaurant);
                            setIsSavingSettings(false);
                            toast.success("Configurações salvas!");
                        }} isLoading={isSavingSettings}>Salvar Alterações</Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="p-8 space-y-6">
                                <h3 className="font-bold text-slate-900 text-lg">Informações Básicas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Nome da Loja" value={restaurant.name} onChange={(e: any) => setRestaurant({...restaurant, name: e.target.value})} />
                                    <Input label="WhatsApp (DDD + Número)" value={restaurant.phone} onChange={(e: any) => setRestaurant({...restaurant, phone: e.target.value})} />
                                </div>
                                <Input label="Endereço Completo" value={restaurant.address} onChange={(e: any) => setRestaurant({...restaurant, address: e.target.value})} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Pedido Mínimo (R$)" type="number" value={restaurant.minOrderValue || ''} onChange={(e: any) => setRestaurant({...restaurant, minOrderValue: Number(e.target.value)})} />
                                    <Input label="Taxa de Entrega (R$)" type="number" value={restaurant.deliveryFee || ''} onChange={(e: any) => setRestaurant({...restaurant, deliveryFee: Number(e.target.value)})} />
                                </div>
                                <Input label="Chave Pix para Pagamento" value={restaurant.pixKey || ''} onChange={(e: any) => setRestaurant({...restaurant, pixKey: e.target.value})} placeholder="E-mail, CPF ou Celular" />
                            </Card>
                            <Card className="p-8 space-y-6">
                                <h3 className="font-bold text-slate-900 text-lg">Identidade Visual</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <ImageUpload label="Logo da Marca" value={restaurant.logo} onChange={(val: string) => setRestaurant({...restaurant, logo: val})} />
                                    <ImageUpload label="Banner de Capa" value={restaurant.coverImage} onChange={(val: string) => setRestaurant({...restaurant, coverImage: val})} />
                                </div>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card className="p-8 bg-slate-900 text-white text-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <QrCode size={120} />
                                </div>
                                <h3 className="font-bold text-lg mb-2 relative z-10">Seu Cardápio Digital</h3>
                                <p className="text-slate-400 text-sm mb-6 relative z-10">Compartilhe o link ou imprima o QR Code.</p>
                                <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-xl relative z-10">
                                    <QRCodeSVG value={menuUrl} size={160} />
                                </div>
                                <div className="space-y-3 relative z-10">
                                    <Button className="w-full bg-emerald-500 hover:bg-emerald-400 border-none" onClick={() => {
                                        navigator.clipboard.writeText(menuUrl);
                                        toast.success("Link copiado para a área de transferência!");
                                    }}><Copy className="w-4 h-4 mr-2" /> Copiar Link</Button>
                                    <a href={menuUrl} target="_blank" className="block text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest">
                                        Visualizar Cardápio <ExternalLink className="w-3 h-3 inline ml-1" />
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