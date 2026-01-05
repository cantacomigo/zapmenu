import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { Category, MenuItem, Order, Restaurant, RestaurantStaff, Promotion, Giveaway } from '../types';
import { Button, Card, Input, Modal, Badge, ImageUpload, processImage } from '../components/ui';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Utensils, ClipboardList, LayoutDashboard, LogOut, Filter, X, Settings, Power, Clock, DollarSign, QrCode, Users, Shield, Key, Megaphone, Gift, Calendar, Trophy, Ticket, RefreshCw, CreditCard, Banknote, Wallet, ChevronDown, ImageIcon, Printer, BarChart3, TrendingUp, Package, AlertTriangle, MessageSquare, Upload, Loader2, Copy, Share2 } from 'lucide-react';

interface ManagerDashboardProps {
  restaurantId: string;
  onLogout: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ restaurantId, onLogout }) => {
  const [tab, setTab] = useState<'menu' | 'orders' | 'settings' | 'marketing' | 'reports' | 'customers'>('menu');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffList, setStaffList] = useState<RestaurantStaff[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  
  const [marketingTab, setMarketingTab] = useState<'promotions' | 'giveaways'>('promotions');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isGiveawayModalOpen, setIsGiveawayModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({});
  const [editingCategory, setEditingCategory] = useState<Partial<Category>>({});
  const [currentStaff, setCurrentStaff] = useState<Partial<RestaurantStaff>>({});
  const [currentPromo, setCurrentPromo] = useState<Partial<Promotion>>({});
  const [currentGiveaway, setCurrentGiveaway] = useState<Partial<Giveaway>>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingCarousel, setIsUploadingCarousel] = useState(false);

  const formatCurrency = (val: number | undefined | null) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);

  const refreshData = async () => {
    setCategories(await db.getCategories(restaurantId));
    setItems(await db.getMenuItems(restaurantId));
    setOrders(await db.getOrders(restaurantId));
    setStaffList(await db.getRestaurantStaff(restaurantId));
    setPromotions(await db.getPromotions(restaurantId));
    setGiveaways(await db.getGiveaways(restaurantId));
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

  const copyMenuUrl = () => {
      navigator.clipboard.writeText(menuUrl);
      toast.success("Link copiado para a área de transferência!");
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    const order = orders.find(o => o.id === orderId);
    if (order && restaurant) {
        await db.updateOrder({ ...order, status: newStatus });
        await refreshData();
        toast.success(`Pedido #${order.id.slice(0, 4)} atualizado para ${newStatus}`);
    }
  };

  const handleSaveSettings = async () => {
      if (restaurant) {
          setIsSavingSettings(true);
          const { error } = await db.updateRestaurant(restaurant);
          setIsSavingSettings(true);
          if (!error) {
              toast.success("Configurações salvas!");
          } else {
              toast.error("Erro ao salvar configurações.");
          }
          setIsSavingSettings(false);
      }
  };

  if (!restaurant) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-100">
                 <img src={restaurant.logo} className="w-full h-full object-cover" alt="logo" />
            </div>
            <div>
                 <h2 className="font-bold text-slate-800 leading-tight">{restaurant.name}</h2>
                 <p className="text-xs text-slate-400 font-medium">Gestão de Loja</p>
            </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
            <button onClick={() => setTab('menu')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'menu' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-50'}`}><Utensils className="w-5 h-5 mr-3" />Cardápio Digital</button>
            <button onClick={() => setTab('orders')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'orders' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-50'}`}><ClipboardList className="w-5 h-5 mr-3" />Pedidos</button>
            <button onClick={() => setTab('marketing')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'marketing' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-50'}`}><Megaphone className="w-5 h-5 mr-3" />Marketing</button>
            <button onClick={() => setTab('reports')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'reports' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-50'}`}><BarChart3 className="w-5 h-5 mr-3" />Relatórios</button>
            <button onClick={() => setTab('settings')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'settings' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-50'}`}><Settings className="w-5 h-5 mr-3" />Configurações</button>
        </nav>
        <div className="p-4 border-t border-slate-100">
            <button onClick={onLogout} className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"><LogOut className="w-5 h-5 mr-3" />Sair</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
            {tab === 'settings' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Configurações</h2>
                            <p className="text-slate-500 mt-1">Gerencie as informações e a divulgação do seu restaurante.</p>
                        </div>
                        <Button onClick={handleSaveSettings} isLoading={isSavingSettings}>{isSavingSettings ? 'Salvando...' : 'Salvar Alterações'}</Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="p-8">
                                <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2 mb-6">Informações Básicas</h3>
                                <div className="space-y-6">
                                    <Input label="Nome do Restaurante" value={restaurant.name} onChange={(e: any) => setRestaurant({...restaurant, name: e.target.value})} />
                                    <Input label="Endereço Completo" value={restaurant.address} onChange={(e: any) => setRestaurant({...restaurant, address: e.target.value})} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="WhatsApp (com DDD)" value={restaurant.phone} onChange={(e: any) => setRestaurant({...restaurant, phone: e.target.value})} />
                                        <Input label="Pedido Mínimo (R$)" type="number" value={restaurant.minOrderValue} onChange={(e: any) => setRestaurant({...restaurant, minOrderValue: Number(e.target.value)})} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-8">
                                <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2 mb-6">Aparência</h3>
                                <div className="space-y-8">
                                    <ImageUpload label="Logo da Marca" value={restaurant.logo} onChange={(val: string) => setRestaurant({...restaurant, logo: val})} />
                                    <ImageUpload label="Imagem de Capa" value={restaurant.coverImage} onChange={(val: string) => setRestaurant({...restaurant, coverImage: val})} />
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-8">
                            <Card className="p-8 bg-emerald-900 text-white border-emerald-800">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-emerald-500 rounded-lg"><QrCode className="w-5 h-5 text-white" /></div>
                                    <h3 className="font-bold text-lg">Seu QR Code</h3>
                                </div>
                                <div className="bg-white p-4 rounded-2xl flex justify-center mb-6">
                                    <QRCodeSVG value={menuUrl} size={160} />
                                </div>
                                <p className="text-emerald-100 text-sm mb-6 text-center">Imprima e coloque nas mesas para seus clientes acessarem o cardápio digital.</p>
                                <div className="space-y-3">
                                    <button onClick={copyMenuUrl} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-sm font-bold transition-colors">
                                        <Copy className="w-4 h-4" /> Copiar Link
                                    </button>
                                    <a href={menuUrl} target="_blank" className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors">
                                        <ExternalLink className="w-4 h-4" /> Visualizar Menu
                                    </a>
                                </div>
                            </Card>

                            <Card className="p-8">
                                <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2 mb-4">Link do Menu</h3>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 overflow-hidden">
                                    <span className="text-slate-500 text-xs truncate flex-1">{menuUrl}</span>
                                    <button onClick={copyMenuUrl} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Copy className="w-4 h-4" /></button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
            
            {tab !== 'settings' && (
                <div className="flex h-64 items-center justify-center text-slate-400">
                    Selecione a aba de Configurações para ver as melhorias deste passo.
                </div>
            )}
        </div>
      </main>
    </div>
  );
};