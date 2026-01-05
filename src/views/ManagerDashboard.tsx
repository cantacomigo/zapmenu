import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/src/services/db';
import { Category, MenuItem, Order, Restaurant } from '@/src/types';
import { Button, Card, Input, Badge, ImageUpload } from '@/src/components/ui';
import { MenuTab } from '@/src/views/manager/MenuTab';
import { OrdersTab } from '@/src/views/manager/OrdersTab';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Utensils, ClipboardList, LogOut, Settings, QrCode, Copy, ExternalLink } from 'lucide-react';

interface ManagerDashboardProps {
  restaurantId: string;
  onLogout: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ restaurantId, onLogout }) => {
  const [tab, setTab] = useState<'menu' | 'orders' | 'settings'>('menu');
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

  if (!restaurant) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
             <img src={restaurant.logo} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
             <div className="truncate">
                 <h2 className="font-bold text-slate-800 leading-tight truncate">{restaurant.name}</h2>
                 <p className="text-xs text-slate-400">Gestor</p>
             </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
            <button onClick={() => setTab('menu')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'menu' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><Utensils className="w-5 h-5 mr-3" />Cardápio</button>
            <button onClick={() => setTab('orders')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'orders' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><ClipboardList className="w-5 h-5 mr-3" />Pedidos</button>
            <button onClick={() => setTab('settings')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'settings' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><Settings className="w-5 h-5 mr-3" />Configurações</button>
        </nav>
        <div className="p-4 border-t border-slate-100">
            <button onClick={onLogout} className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"><LogOut className="w-5 h-5 mr-3" />Sair</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
            {tab === 'menu' && <MenuTab restaurantId={restaurantId} categories={categories} items={items} onRefresh={refreshData} />}
            {tab === 'orders' && <OrdersTab orders={orders} onRefresh={refreshData} />}
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
                                <Input label="Nome" value={restaurant.name} onChange={(e: any) => setRestaurant({...restaurant, name: e.target.value})} />
                                <Input label="WhatsApp" value={restaurant.phone} onChange={(e: any) => setRestaurant({...restaurant, phone: e.target.value})} />
                                <Input label="Endereço" value={restaurant.address} onChange={(e: any) => setRestaurant({...restaurant, address: e.target.value})} />
                            </Card>
                            <Card className="p-8 space-y-6">
                                <h3 className="font-bold text-slate-900 text-lg">Aparência</h3>
                                <ImageUpload label="Logo" value={restaurant.logo} onChange={(val: string) => setRestaurant({...restaurant, logo: val})} />
                                <ImageUpload label="Capa" value={restaurant.coverImage} onChange={(val: string) => setRestaurant({...restaurant, coverImage: val})} />
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card className="p-8 bg-emerald-900 text-white text-center">
                                <QrCode className="w-10 h-10 mx-auto mb-4" />
                                <h3 className="font-bold text-lg mb-2">QR Code do Menu</h3>
                                <div className="bg-white p-4 rounded-2xl inline-block mb-4">
                                    <QRCodeSVG value={menuUrl} size={140} />
                                </div>
                                <Button className="w-full bg-emerald-500 hover:bg-emerald-400" onClick={() => {
                                    navigator.clipboard.writeText(menuUrl);
                                    toast.success("Link copiado!");
                                }}><Copy className="w-4 h-4 mr-2" /> Copiar Link</Button>
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