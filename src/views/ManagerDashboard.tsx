import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { Category, MenuItem, Order, Restaurant, RestaurantStaff, Promotion, Giveaway } from '../types';
import { Button, Card, Input, Modal, Badge, ImageUpload, processImage } from '../components/ui';
import { Plus, Edit2, Trash2, Utensils, ClipboardList, LayoutDashboard, LogOut, Filter, X, Settings, Power, Clock, DollarSign, QrCode, Users, Shield, Key, Megaphone, Gift, Calendar, Trophy, Ticket, RefreshCw, CreditCard, Banknote, Wallet, ChevronDown, ImageIcon, Printer, BarChart3, TrendingUp, Package, AlertTriangle, MessageSquare, Upload, Loader2 } from 'lucide-react';

interface ManagerDashboardProps {
  restaurantId: string;
  onLogout: () => void;
}

interface Participant {
    name: string;
    phone: string;
    orderCount: number;
}

interface DailySales {
    date: string;
    total: number;
    count: number;
}

interface CustomerStat {
    phone: string;
    name: string;
    totalSpent: number;
    orderCount: number;
    lastOrder: number;
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
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isGiveawayModalOpen, setIsGiveawayModalOpen] = useState(false);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({});
  const [editingCategory, setEditingCategory] = useState<Partial<Category>>({});
  const [currentStaff, setCurrentStaff] = useState<Partial<RestaurantStaff>>({});
  const [currentPromo, setCurrentPromo] = useState<Partial<Promotion>>({});
  const [currentGiveaway, setCurrentGiveaway] = useState<Partial<Giveaway>>({});
  const [drawParticipants, setDrawParticipants] = useState<Participant[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawWinner, setDrawWinner] = useState<Participant | null>(null);
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
            const initialOrders = await db.getOrders(r.id);
            setLastOrderCount(initialOrders.length);
        }
    };
    init();
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
  }, [restaurantId]);

  useEffect(() => {
      const interval = setInterval(async () => {
          const currentOrders = await db.getOrders(restaurantId);
          setLastOrderCount(prevCount => {
              if (currentOrders.length > prevCount) {
                  const newOrder = currentOrders[0];
                  if ("Notification" in window && Notification.permission === "granted") {
                      const notif = new Notification("Novo Pedido Recebido! 🔔", {
                          body: `#${newOrder.id.slice(0, 4)} - ${newOrder.customerName} (${formatCurrency(newOrder.total)})`,
                          tag: 'new-order-alert',
                          icon: '/favicon.ico' 
                      });
                      notif.onclick = () => { window.focus(); setTab('orders'); };
                  }
                  setOrders(currentOrders);
                  return currentOrders.length;
              }
              if (currentOrders.length !== prevCount) {
                  setOrders(currentOrders);
                  return currentOrders.length;
              }
              return prevCount;
          });
      }, 5000); 
      return () => clearInterval(interval);
  }, [restaurantId]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filterStatus !== 'all' && order.status !== filterStatus) return false;
      const orderDate = new Date(Number(order.createdAt));
      if (dateRange.start) {
        const start = new Date(dateRange.start + 'T00:00:00');
        if (orderDate < start) return false;
      }
      if (dateRange.end) {
        const end = new Date(dateRange.end + 'T23:59:59');
        if (orderDate > end) return false;
      }
      return true;
    }).sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  }, [orders, filterStatus, dateRange]);

  const salesData = useMemo(() => {
      const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'confirmed');
      const totalRevenue = completedOrders.reduce((acc, o) => acc + o.total, 0);
      const averageTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
      const dailyMap = new Map<string, DailySales>();
      completedOrders.forEach(o => {
          const date = new Date(o.createdAt).toLocaleDateString('pt-BR');
          const current = dailyMap.get(date) || { date, total: 0, count: 0 };
          current.total += o.total;
          current.count += 1;
          dailyMap.set(date, current);
      });
      const dailyChart = Array.from(dailyMap.values()).sort((a,b) => {
          const [da, ma, ya] = a.date.split('/');
          const [db, mb, yb] = b.date.split('/');
          return new Date(`${ya}-${ma}-${da}`).getTime() - new Date(`${yb}-${mb}-${db}`).getTime();
      });
      return { totalRevenue, averageTicket, totalOrders: completedOrders.length, dailyChart };
  }, [orders]);

  const customerStats = useMemo(() => {
      const map = new Map<string, CustomerStat>();
      orders.forEach(o => {
          const phone = o.customerPhone.replace(/\D/g, '');
          const existing = map.get(phone) || { 
              phone: o.customerPhone, 
              name: o.customerName, 
              totalSpent: 0, 
              orderCount: 0, 
              lastOrder: 0 
          };
          if (o.status !== 'cancelled') {
              existing.totalSpent += o.total;
              existing.orderCount += 1;
          }
          if (o.createdAt > existing.lastOrder) existing.lastOrder = o.createdAt;
          existing.name = o.customerName;
          map.set(phone, existing);
      });
      return Array.from(map.values()).sort((a,b) => b.lastOrder - a.lastOrder);
  }, [orders]);

  const printOrderReceipt = (order: Order) => {
      if (!restaurant) return;
      const w = window.open('', '_blank', 'width=320,height=600');
      if (!w) { alert("Permita pop-ups para imprimir o cupom."); return; }
      
      const itemsHtml = order.items.map(i => `
        <div class="item">
            <span style="flex: 1;">${i.quantity}x ${i.name}</span>
            <span style="white-space: nowrap;">${formatCurrency(i.price * i.quantity)}</span>
        </div>
        ${i.notes ? `<div class="notes">Obs: ${i.notes}</div>` : ''}
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Pedido #${order.id.slice(0,4)}</title>
            <style>
                @page { margin: 0; }
                body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0; padding: 5mm; font-size: 12px; line-height: 1.2; color: black; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 8px 0; }
                .item { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
                .notes { font-size: 11px; font-style: italic; margin-left: 10px; margin-bottom: 4px; }
                .total { font-size: 16px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 10px; }
                .footer { text-align: center; font-size: 10px; margin-top: 15px; }
                .header { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 5px; }
                .meta { font-size: 11px; margin-bottom: 5px; }
                @media print { body { width: auto; } }
            </style>
        </head>
        <body>
            <div class="header">${restaurant.name}</div>
            <div class="center meta">${restaurant.address}</div>
            <div class="center meta">Tel: ${restaurant.phone}</div>
            <div class="divider"></div>
            <div class="bold" style="font-size: 14px;">PEDIDO #${order.id.slice(0,4)}</div>
            <div class="meta">${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString()}</div>
            <div class="divider"></div>
            <div class="bold">CLIENTE</div>
            <div>${order.customerName}</div>
            <div>${order.customerPhone}</div>
            ${order.customerAddress ? `<div>${order.customerAddress}</div>` : ''}
            <div class="divider"></div>
            <div class="bold" style="margin-bottom: 5px;">ITENS</div>
            ${itemsHtml}
            <div class="divider"></div>
            <div class="item"><span>Subtotal</span><span>${formatCurrency(order.total - (restaurant.deliveryFee || 0))}</span></div>
            <div class="item"><span>Taxa Entrega</span><span>${formatCurrency(restaurant.deliveryFee || 0)}</span></div>
            <div class="total"><span>TOTAL</span><span>${formatCurrency(order.total)}</span></div>
            <div class="divider"></div>
            <div class="center bold">PAGAMENTO</div>
            <div class="center">${getPaymentLabel(order.paymentMethod)}</div>
            ${order.paymentDetails ? `<div class="center" style="font-size: 11px;">(${order.paymentDetails})</div>` : ''}
            <div class="footer"><p>Obrigado pela preferência!</p><p>zapmenu.com.br</p></div>
            <script>window.onload = function() { setTimeout(() => { window.print(); }, 500); }</script>
        </body>
        </html>`;
        
      w.document.write(html);
      w.document.close();
  };

  const sendWhatsAppMessage = (order: Order) => {
        if(!restaurant) return;
        let message = '';
        const firstName = order.customerName.split(' ')[0];
        if (order.status === 'confirmed') {
            message = `Olá *${firstName}*! 👋\n\nO *${restaurant.name}* confirma o recebimento do seu pedido.\n✅ Já estamos preparando tudo com carinho!\n\nAvisaremos assim que sair para entrega.`;
        } else if (order.status === 'completed') {
             message = `Olá *${firstName}*! 🛵\n\nSeu pedido saiu para entrega (ou foi retirado).\nMuito obrigado pela preferência!\n\n😋 *Bom apetite!*`;
        } else if (order.status === 'cancelled') {
             message = `Olá *${firstName}*.\n\nInfelizmente tivemos um problema e seu pedido no *${restaurant.name}* precisou ser cancelado.\nPor favor, entre em contato conosco para mais detalhes.`;
        } else {
             message = `Olá *${firstName}*, aqui é do *${restaurant.name}*. Sobre seu pedido #${order.id.slice(0,4)}...`;
        }
        let phone = order.customerPhone.replace(/\D/g, '');
        if (phone.length <= 11) phone = `55${phone}`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    const order = orders.find(o => o.id === orderId);
    if (order && restaurant) {
        await db.updateOrder({ ...order, status: newStatus });
        await refreshData();
        if (newStatus === 'confirmed') {
            if(confirm("Pedido Confirmado!\nDeseja imprimir o cupom para a cozinha? 🖨️")) {
                printOrderReceipt(order);
            }
        }
    }
  };

  const getPaymentIcon = (method: string) => {
      switch(method) {
          case 'pix': return <QrCode className="w-4 h-4 text-emerald-500" />;
          case 'credit': return <CreditCard className="w-4 h-4 text-purple-500" />;
          case 'debit': return <CreditCard className="w-4 h-4 text-blue-500" />;
          case 'cash': return <Banknote className="w-4 h-4 text-green-600" />;
          default: return <Wallet className="w-4 h-4 text-slate-400" />;
      }
  };
  const getPaymentLabel = (method: string) => {
      switch(method) { case 'pix': return 'Pix'; case 'credit': return 'Crédito'; case 'debit': return 'Débito'; case 'cash': return 'Dinheiro'; default: return method; }
  };

  const handleAddCoverImage = (base64: string) => {
      if (!restaurant) return;
      const currentImages = restaurant.coverImages || [restaurant.coverImage];
      const newImages = [...currentImages, base64];
      setRestaurant({ ...restaurant, coverImages: newImages, coverImage: newImages[0] });
  };

  const handleRemoveCoverImage = (index: number) => {
      if (!restaurant) return;
      const currentImages = restaurant.coverImages || [restaurant.coverImage];
      const newImages = currentImages.filter((_, i) => i !== index);
      setRestaurant({ ...restaurant, coverImages: newImages, coverImage: newImages[0] || '' });
  };

  const handleSaveItem = async () => {
    if (!currentItem.name || !currentItem.price || !currentItem.categoryId) return;
    const item: MenuItem = {
      id: currentItem.id || undefined, 
      restaurantId: restaurantId,
      categoryId: currentItem.categoryId,
      name: currentItem.name,
      description: currentItem.description || '',
      price: Number(currentItem.price),
      image: currentItem.image || `https://placehold.co/300x300/png?text=Product`,
      available: currentItem.available !== undefined ? currentItem.available : true,
      stock: currentItem.stock,
    } as MenuItem;
    await db.saveMenuItem(item);
    await refreshData();
    setIsItemModalOpen(false);
    setCurrentItem({});
  };

  const handleDeleteItem = async (id: string) => { if(confirm("Excluir item?")) { await db.deleteMenuItem(id); await refreshData(); } };
  const handleToggleAvailability = async (item: MenuItem) => { const updated = { ...item, available: !item.available }; await db.saveMenuItem(updated); await refreshData(); };
  
  const handleSaveCategory = async () => {
    if (editingCategory && editingCategory.name?.trim()) {
        if (editingCategory.id) await db.updateCategory(editingCategory as Category);
        else await db.addCategory({ restaurantId, name: editingCategory.name } as Category);
        await refreshData(); setEditingCategory({}); setIsCategoryModalOpen(false);
    }
  };
  
  const handleDeleteCategory = async (catId: string) => {
      const hasItems = items.some(i => i.categoryId === catId);
      if (hasItems) { alert("Não é possível excluir uma categoria que possui produtos."); return; }
      if (confirm("Tem certeza que deseja excluir esta categoria?")) { await db.deleteCategory(catId); await refreshData(); }
  };
  
  const handleSaveSettings = async () => {
      if (restaurant) {
          setIsSavingSettings(true);
          const { error } = await db.updateRestaurant(restaurant);
          setIsSavingSettings(false);
          if (error) {
              alert(`Erro ao salvar configurações: ${error.message || 'Erro desconhecido'}`);
          } else {
              alert("Configurações atualizadas com sucesso!");
          }
      }
  };

  const handleSaveStaff = async () => {
      if (!currentStaff.name || !currentStaff.email) { alert("Nome e Email são obrigatórios."); return; }
      const staff: RestaurantStaff = {
          id: currentStaff.id || undefined, restaurantId: restaurantId, name: currentStaff.name, email: currentStaff.email,
          password: currentStaff.password || '123456', role: currentStaff.role || 'manager', createdAt: Date.now()
      } as RestaurantStaff;
      await db.saveRestaurantStaff(staff); await refreshData(); setIsStaffModalOpen(false); setCurrentStaff({});
  };
  
  const handleDeleteStaff = async (id: string) => { if (confirm("Remover este membro da equipe?")) { await db.deleteRestaurantStaff(id); await refreshData(); } };
  
  const handleSavePromo = async () => {
      if (!currentPromo.title || !currentPromo.discountedPrice) { alert("Título e Preço Promocional são obrigatórios."); return; }
      const promo: Promotion = {
          id: currentPromo.id || undefined, restaurantId: restaurantId, title: currentPromo.title, description: currentPromo.description || '',
          originalPrice: currentPromo.originalPrice ? Number(currentPromo.originalPrice) : undefined, discountedPrice: Number(currentPromo.discountedPrice),
          image: currentPromo.image || `https://placehold.co/300x300/png?text=Promo`, isActive: currentPromo.isActive !== undefined ? currentPromo.isActive : true,
      } as Promotion;
      await db.savePromotion(promo); await refreshData(); setIsPromoModalOpen(false); setCurrentPromo({});
  };
  
  const handleDeletePromo = async (id: string) => { if(confirm("Excluir promoção?")) { await db.deletePromotion(id); await refreshData(); setIsPromoModalOpen(false); } };
  
  const handleSaveGiveaway = async () => {
      if (!currentGiveaway.title || !currentGiveaway.drawDate || !currentGiveaway.prize) { alert("Preencha todos os campos obrigatórios."); return; }
      const giveaway: Giveaway = {
          id: currentGiveaway.id || undefined, restaurantId: restaurantId, title: currentGiveaway.title, description: currentGiveaway.description || '',
          prize: currentGiveaway.prize, drawDate: currentGiveaway.drawDate, image: currentGiveaway.image || `https://placehold.co/300x300/png?text=Sorteio`,
          isActive: currentGiveaway.isActive !== undefined ? currentGiveaway.isActive : true,
      } as Giveaway;
      await db.saveGiveaway(giveaway); await refreshData(); setIsGiveawayModalOpen(false); setCurrentGiveaway({});
  };
  
  const handleDeleteGiveaway = async (id: string) => { if(confirm("Excluir sorteio?")) { await db.deleteGiveaway(id); await refreshData(); setIsGiveawayModalOpen(false); } };
  
  const openDrawModal = (giveaway: Giveaway) => {
      setCurrentGiveaway(giveaway);
      const drawDate = new Date(giveaway.drawDate + 'T23:59:59');
      const oneWeekAgo = new Date(drawDate); oneWeekAgo.setDate(drawDate.getDate() - 7);
      const eligibleOrders = orders.filter(o => { const orderDate = new Date(o.createdAt); return orderDate >= oneWeekAgo && orderDate <= drawDate; });
      const uniqueParticipants = new Map<string, Participant>();
      eligibleOrders.forEach(order => {
          if (!uniqueParticipants.has(order.customerPhone)) { uniqueParticipants.set(order.customerPhone, { name: order.customerName, phone: order.customerPhone, orderCount: 1 }); } 
          else { const p = uniqueParticipants.get(order.customerPhone)!; p.orderCount += 1; uniqueParticipants.set(order.customerPhone, p); }
      });
      setDrawParticipants(Array.from(uniqueParticipants.values())); setDrawWinner(null); setIsDrawModalOpen(true);
  };
  
  const performDraw = async () => {
      if (drawParticipants.length === 0) return;
      setIsDrawing(true); let counter = 0;
      const interval = setInterval(() => {
          const randomIndex = Math.floor(Math.random() * drawParticipants.length);
          setDrawWinner(drawParticipants[randomIndex]); counter++;
          if (counter > 20) { clearInterval(interval); finishDraw(); }
      }, 100);
  };
  
  const finishDraw = async () => {
      const winnerIndex = Math.floor(Math.random() * drawParticipants.length); const winner = drawParticipants[winnerIndex];
      setDrawWinner(winner); setIsDrawing(false);
      if (currentGiveaway.id) {
          const updatedGiveaway: Giveaway = { ...(currentGiveaway as Giveaway), winnerName: winner.name, winnerPhone: winner.phone, drawnAt: Date.now(), isActive: false };
          await db.saveGiveaway(updatedGiveaway); await refreshData();
          if (winner.phone && restaurant) {
              const message = `🎉 Parabéns *${winner.name}*! 🥳\n\nVocê foi o(a) ganhador(a) do sorteio da semana no *${restaurant.name}*!\n\n🏆 *Prêmio:* ${updatedGiveaway.prize}\n\nEntre em contato conosco para combinar a retirada do seu prêmio.\n\nObrigado por ser nosso cliente!`;
              let phone = winner.phone.replace(/\D/g, ''); if (phone.length <= 11) phone = `55${phone}`;
              const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
              setTimeout(() => { if(confirm(`O sorteio foi realizado com sucesso!\nGanhador: ${winner.name}\n\nDeseja enviar a mensagem de parabéns no WhatsApp agora?`)) { window.open(url, '_blank'); } }, 500);
          }
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
            <button onClick={() => setTab('menu')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'menu' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-50'}`}><Utensils className={`w-5 h-5 mr-3 ${tab === 'menu' ? 'text-emerald-500' : 'text-slate-400'}`} />Cardápio Digital</button>
            <button onClick={() => setTab('orders')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'orders' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-50'}`}><ClipboardList className={`w-5 h-5 mr-3 ${tab === 'orders' ? 'text-emerald-500' : 'text-slate-400'}`} />Pedidos Recentes</button>
            <button onClick={() => setTab('customers')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'customers' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-50'}`}><Users className={`w-5 h-5 mr-3 ${tab === 'customers' ? 'text-emerald-500' : 'text-slate-400'}`} />Clientes</button>
            <button onClick={() => setTab('reports')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'reports' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-50'}`}><BarChart3 className={`w-5 h-5 mr-3 ${tab === 'reports' ? 'text-emerald-500' : 'text-slate-400'}`} />Relatórios</button>
            <button onClick={() => setTab('marketing')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'marketing' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-50'}`}><Megaphone className={`w-5 h-5 mr-3 ${tab === 'marketing' ? 'text-emerald-500' : 'text-slate-400'}`} />Marketing</button>
            <button onClick={() => setTab('settings')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'settings' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-50'}`}><Settings className={`w-5 h-5 mr-3 ${tab === 'settings' ? 'text-emerald-500' : 'text-slate-400'}`} />Configurações</button>
        </nav>
        <div className="p-4 border-t border-slate-100">
            <button onClick={onLogout} className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"><LogOut className="w-5 h-5 mr-3" />Sair</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
            {tab === 'menu' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                         <div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Cardápio</h2>
                            <p className="text-slate-500 mt-1">Gerencie seus produtos, estoque e categorias.</p>
                         </div>
                         <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => { setEditingCategory({}); setIsCategoryModalOpen(true); }}><Plus className="w-5 h-5 mr-2" />Nova Categoria</Button>
                            <Button onClick={() => { setCurrentItem({}); setIsItemModalOpen(true); }} className="shadow-lg shadow-emerald-500/20"><Plus className="w-5 h-5 mr-2" />Novo Item</Button>
                         </div>
                    </div>
                    {categories.map(cat => (
                        <div key={cat.id} className="space-y-5">
                            <div className="flex items-center gap-3 group bg-white p-3 rounded-xl border border-transparent hover:border-slate-200 hover:shadow-sm transition-all">
                                <h3 className="text-xl font-bold text-slate-800 pl-2">{cat.name}</h3>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                    <button onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {items.filter(i => i.categoryId === cat.id).map(item => (
                                    <div key={item.id} className={`group bg-white p-4 rounded-2xl border transition-all duration-300 flex gap-5 ${item.available ? 'border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-200' : 'border-slate-100 opacity-60 bg-slate-50'}`}>
                                        <div className="w-24 h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative">
                                            <img src={item.image} className={`w-full h-full object-cover transition-transform duration-500 ${item.available ? 'group-hover:scale-110' : 'grayscale'}`} alt={item.name} />
                                            {(item.stock !== undefined && item.stock !== null && item.stock <= 5) && (
                                                <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center">
                                                    <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                                                    {item.stock === 0 ? 'Esgotado' : `Restam ${item.stock}`}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-900 truncate pr-2 text-lg">{item.name}</h4>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleToggleAvailability(item)} className={`p-2 rounded-lg transition-colors ${item.available ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}><Power className="w-4 h-4" /></button>
                                                        <button onClick={() => { setCurrentItem(item); setIsItemModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                                            </div>
                                            <div className="flex justify-between items-end mt-2">
                                                <span className="font-bold text-emerald-600 text-lg">{formatCurrency(item.price)}</span>
                                                {item.stock !== undefined && (
                                                    <span className="text-xs font-medium text-slate-400 flex items-center"><Package className="w-3 h-3 mr-1" /> Estoque: {item.stock}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'orders' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div><h2 className="text-3xl font-bold text-slate-900 tracking-tight">Pedidos</h2><p className="text-slate-500 mt-1">Gerencie o fluxo de pedidos em tempo real.</p></div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-5 items-end">
                         <div className="w-full md:w-auto">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center"><Filter className="w-3 h-3 mr-1" /> Status</label>
                            <div className="relative">
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full md:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none font-semibold text-slate-700 cursor-pointer transition-all">
                                    <option value="all">Todos os Status</option><option value="pending">Pendente</option><option value="confirmed">Confirmado</option><option value="completed">Concluído</option><option value="cancelled">Cancelado</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                         </div>
                         {(filterStatus !== 'all' || dateRange.start || dateRange.end) && (
                             <button onClick={() => { setFilterStatus('all'); setDateRange({start: '', end: ''}); }} className="md:ml-auto flex items-center px-4 py-2.5 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"><X className="w-4 h-4 mr-2" /> Limpar Filtros</button>
                         )}
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider pl-8">Cliente</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Itens</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Pagamento</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrders.length === 0 ? ( <tr><td colSpan={6} className="px-8 py-16 text-center text-slate-500">Nenhum pedido encontrado</td></tr> ) : filteredOrders.map(order => (
                                    <tr key={order.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-5 pl-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200">{order.customerName.charAt(0).toUpperCase()}</div>
                                                <div><div className="font-bold text-slate-900">{order.customerName}</div><div className="text-xs text-slate-400 font-medium flex items-center mt-0.5">{order.customerPhone}</div></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 max-w-xs"><div className="text-sm text-slate-600 font-medium line-clamp-2">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</div><div className="text-xs text-slate-400 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1" />{new Date(Number(order.createdAt)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div></td>
                                        <td className="px-6 py-5"><div className="flex items-center gap-2 mb-1"><div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">{getPaymentIcon(order.paymentMethod)}</div><span className="text-sm font-semibold text-slate-700">{getPaymentLabel(order.paymentMethod)}</span></div>{order.paymentDetails && (<div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded w-fit">{order.paymentDetails}</div>)}</td>
                                        <td className="px-6 py-5"><div className="font-bold text-emerald-600 text-lg">{formatCurrency(order.total)}</div></td>
                                        <td className="px-6 py-5">
                                            <div className="relative w-fit group/status">
                                                <select value={order.status} onChange={(e) => handleUpdateStatus(order.id, e.target.value as any)} className={`appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-bold border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 transition-all uppercase tracking-wide ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 focus:ring-emerald-500' : order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200 focus:ring-red-500' : order.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-200 focus:ring-blue-500' : 'bg-amber-100 text-amber-800 border-amber-200 focus:ring-amber-500'}`}><option value="pending">Pendente</option><option value="confirmed">Confirmado</option><option value="completed">Concluído</option><option value="cancelled">Cancelado</option></select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2"><ChevronDown className="w-3 h-3 text-slate-500" /></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => sendWhatsAppMessage(order)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Enviar WhatsApp"><MessageSquare className="w-5 h-5" /></button><button onClick={() => printOrderReceipt(order)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" title="Imprimir Cupom"><Printer className="w-5 h-5" /></button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'customers' && ( <div className="space-y-8 animate-in fade-in duration-500"><div><h2 className="text-3xl font-bold text-slate-900 tracking-tight">Gerenciamento de Clientes</h2><p className="text-slate-500 mt-1">Base de clientes construída a partir do histórico de pedidos.</p></div><div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"><table className="w-full text-left border-collapse"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider pl-8">Cliente</th><th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone</th><th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Pedidos Feitos</th><th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Gasto</th><th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Última Compra</th></tr></thead><tbody className="divide-y divide-slate-100">{customerStats.map(customer => (<tr key={customer.phone} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-5 pl-8"><div className="font-bold text-slate-900">{customer.name}</div></td><td className="px-6 py-5 text-sm text-slate-600">{customer.phone}</td><td className="px-6 py-5"><div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{customer.orderCount}</div></td><td className="px-6 py-5 font-bold text-emerald-600">{formatCurrency(customer.totalSpent)}</td><td className="px-6 py-5 text-sm text-slate-500">{new Date(customer.lastOrder).toLocaleDateString()}</td></tr>))}</tbody></table></div></div> )}
            {tab === 'reports' && ( <div className="space-y-8 animate-in fade-in duration-500"><div><h2 className="text-3xl font-bold text-slate-900 tracking-tight">Relatórios de Vendas</h2><p className="text-slate-500 mt-1">Visão geral do desempenho.</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-500 text-sm uppercase">Faturamento Total</h3><div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><DollarSign className="w-5 h-5" /></div></div><p className="text-3xl font-bold text-slate-900">{formatCurrency(salesData.totalRevenue)}</p></div><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-500 text-sm uppercase">Total de Pedidos</h3><div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><ClipboardList className="w-5 h-5" /></div></div><p className="text-3xl font-bold text-slate-900">{salesData.totalOrders}</p></div><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-500 text-sm uppercase">Ticket Médio</h3><div className="p-2 bg-purple-100 text-purple-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div></div><p className="text-3xl font-bold text-slate-900">{formatCurrency(salesData.averageTicket)}</p></div></div><div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"><h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-slate-400" />Vendas por Dia</h3><div className="h-64 flex items-end gap-4">{salesData.dailyChart.length === 0 ? (<div className="w-full h-full flex items-center justify-center text-slate-400">Sem dados suficientes</div>) : salesData.dailyChart.slice(-7).map((d, i) => (<div key={i} className="flex-1 flex flex-col items-center group relative"><div className="w-full bg-emerald-500 rounded-t-lg transition-all duration-500 group-hover:bg-emerald-600 relative" style={{ height: `${(d.total / (Math.max(...salesData.dailyChart.map(x=>x.total)) || 1)) * 100}%`, minHeight: '4px' }}><div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">{formatCurrency(d.total)} ({d.count} pedidos)</div></div><p className="text-xs font-bold text-slate-500 mt-2 rotate-0 truncate w-full text-center">{d.date.split('/')[0]}/{d.date.split('/')[1]}</p></div>))}</div></div></div> )}
            {tab === 'marketing' && ( <div className="space-y-8 animate-in fade-in duration-500"><div><h2 className="text-3xl font-bold text-slate-900 tracking-tight">Marketing</h2><p className="text-slate-500 mt-1">Crie promoções e sorteios.</p></div><div className="flex p-1 bg-slate-100 rounded-xl w-fit"><button onClick={() => setMarketingTab('promotions')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${marketingTab === 'promotions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Promoções</button><button onClick={() => setMarketingTab('giveaways')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${marketingTab === 'giveaways' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sorteios</button></div>{marketingTab === 'promotions' && (<div className="animate-in fade-in slide-in-from-left-4 duration-300"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2"><div className="p-2 bg-pink-100 text-pink-600 rounded-lg"><Megaphone className="w-5 h-5" /></div><h3 className="text-xl font-bold text-slate-900">Promoções Ativas</h3></div><Button onClick={() => { setCurrentPromo({}); setIsPromoModalOpen(true); }} className="bg-pink-600 hover:bg-pink-500 shadow-pink-500/20"><Plus className="w-4 h-4 mr-2" /> Nova Promoção</Button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{promotions.map(promo => (<div key={promo.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group"><div className="h-32 bg-slate-100 relative"><img src={promo.image} className="w-full h-full object-cover" /><div className="absolute top-2 right-2"><Badge color={promo.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>{promo.isActive ? 'Ativa' : 'Pausada'}</Badge></div></div><div className="p-4"><h4 className="font-bold text-lg text-slate-900 mb-1">{promo.title}</h4><div className="flex items-center gap-2 text-sm mb-3">{promo.originalPrice != null && <span className="text-slate-400 line-through">R$ {Number(promo.originalPrice).toFixed(2)}</span>}<span className="font-bold text-pink-600 text-lg">R$ {Number(promo.discountedPrice).toFixed(2)}</span></div><div className="flex justify-end gap-2 border-t border-slate-100 pt-3"><button onClick={() => { setCurrentPromo(promo); setIsPromoModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDeletePromo(promo.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></div></div>))}</div></div>)} {marketingTab === 'giveaways' && (<div className="animate-in fade-in slide-in-from-right-4 duration-300"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2"><div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Gift className="w-5 h-5" /></div><h3 className="text-xl font-bold text-slate-900">Sorteios</h3></div><Button onClick={() => { setCurrentGiveaway({}); setIsGiveawayModalOpen(true); }} className="bg-purple-600 hover:bg-purple-500 shadow-purple-500/20"><Plus className="w-4 h-4 mr-2" /> Novo Sorteio</Button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{giveaways.map(giveaway => (<div key={giveaway.id} className="flex bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all relative"><div className="w-32 bg-slate-100 relative shrink-0"><img src={giveaway.image} className="w-full h-full object-cover" /></div><div className="p-4 flex-1 flex flex-col"><div className="flex justify-between items-start"><h4 className="font-bold text-lg text-slate-900">{giveaway.title}</h4><Badge color={giveaway.winnerName ? 'bg-purple-100 text-purple-700 border-purple-200' : (giveaway.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>{giveaway.winnerName ? 'Finalizado' : (giveaway.isActive ? 'Aberto' : 'Inativo')}</Badge></div><p className="text-sm font-semibold text-purple-600 mt-1 mb-2">Prêmio: {giveaway.prize}</p>{giveaway.winnerName ? (<div className="bg-purple-50 p-2 rounded-lg border border-purple-100 mb-2"><p className="text-xs text-purple-800 font-bold flex items-center"><Trophy className="w-3 h-3 mr-1" /> Ganhador(a):</p><p className="text-sm text-slate-700">{giveaway.winnerName}</p></div>) : (<div className="flex items-center text-xs text-slate-500 mb-3"><Calendar className="w-3 h-3 mr-1" /> Sorteio: {new Date(giveaway.drawDate).toLocaleDateString()}</div>)}<div className="mt-auto flex justify-between items-center pt-2">{giveaway.isActive && !giveaway.winnerName && (<button onClick={() => openDrawModal(giveaway)} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 flex items-center shadow-sm"><Ticket className="w-3 h-3 mr-1" /> Sortear</button>)}<div className="flex gap-2 ml-auto"><button onClick={() => { setCurrentGiveaway(giveaway); setIsGiveawayModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDeleteGiveaway(giveaway.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></div></div></div>))}</div></div>)}</div>)}
            
            {tab === 'settings' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Configurações</h2>
                        <p className="text-slate-500 mt-1">Gerencie as informações do seu estabelecimento.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                             <div className="space-y-6">
                                <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">Informações Básicas</h3>
                                <Input label="Nome do Restaurante" value={restaurant.name} onChange={e => setRestaurant({...restaurant, name: e.target.value})} />
                                <Input label="WhatsApp (com DDD)" value={restaurant.phone} onChange={e => setRestaurant({...restaurant, phone: e.target.value})} />
                                <Input label="Endereço Completo" value={restaurant.address} onChange={e => setRestaurant({...restaurant, address: e.target.value})} />
                                <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2 pt-4">Regras de Negócio</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700 ml-1">Taxa de Entrega (R$)</label>
                                        <div className="relative"><DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="number" step="0.50" value={restaurant.deliveryFee || 0} onChange={e => setRestaurant({...restaurant, deliveryFee: parseFloat(e.target.value)})} className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700 ml-1">Pedido Mínimo (R$)</label>
                                        <div className="relative"><DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="number" step="1.00" value={restaurant.minOrderValue || 0} onChange={e => setRestaurant({...restaurant, minOrderValue: parseFloat(e.target.value)})} className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700 ml-1">Tempo Estimado</label>
                                        <div className="relative"><Clock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="text" placeholder="Ex: 40-50 min" value={restaurant.estimatedTime || ''} onChange={e => setRestaurant({...restaurant, estimatedTime: e.target.value})} className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700 ml-1">Chave Pix</label>
                                        <div className="relative"><QrCode className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="text" placeholder="Pix Key" value={restaurant.pixKey || ''} onChange={e => setRestaurant({...restaurant, pixKey: e.target.value})} className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></div>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2 pt-4">Aparência</h3>
                                <div className="space-y-6">
                                    <ImageUpload label="Logo do Restaurante" value={restaurant.logo} onChange={val => setRestaurant({...restaurant, logo: val})} />
                                    <div className="w-full">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Imagens de Capa (Carrossel)</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                            {(restaurant.coverImages && restaurant.coverImages.length > 0 ? restaurant.coverImages : [restaurant.coverImage]).map((img, idx) => (
                                                <div key={idx} className="relative group rounded-xl overflow-hidden h-24 border border-slate-200">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <button onClick={() => handleRemoveCoverImage(idx)} className="absolute top-1 right-1 bg-white text-red-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                            <label className={`h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center relative hover:bg-slate-100 transition-colors cursor-pointer group ${isUploadingCarousel ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                 {isUploadingCarousel ? <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /> : <><Plus className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform mb-1" /><span className="text-[10px] text-slate-400 font-bold uppercase">Adicionar</span></>}
                                                 <input type="file" accept="image/*" className="hidden" disabled={isUploadingCarousel} onChange={async (e) => { const file = e.target.files?.[0]; if (file) { setIsUploadingCarousel(true); try { const base64 = await processImage(file); handleAddCoverImage(base64); } catch (error) { alert("Erro ao processar imagem"); } finally { setIsUploadingCarousel(false); } } }} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-slate-100 flex justify-end">
                                    <Button onClick={handleSaveSettings} isLoading={isSavingSettings}>{isSavingSettings ? 'Salvando...' : 'Salvar Configurações'}</Button>
                                </div>
                             </div>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-fit">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <div><h3 className="font-bold text-slate-900 text-lg">Gerenciamento de Equipe</h3><p className="text-sm text-slate-500">Adicione usuários para acessar este painel.</p></div>
                                <Button size="sm" onClick={() => { setCurrentStaff({}); setIsStaffModalOpen(true); }} className="shadow-emerald-500/20"><Plus className="w-4 h-4 mr-1" /> Novo</Button>
                            </div>
                            <div className="space-y-4">
                                {staffList.map(staff => (
                                    <div key={staff.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-emerald-200 transition-all">
                                        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 font-bold border border-slate-200">{staff.name.charAt(0)}</div><div><p className="font-bold text-slate-800 text-sm">{staff.name}</p><p className="text-xs text-slate-500">{staff.email}</p></div></div>
                                        <div className="flex items-center gap-2"><Badge color={staff.role === 'manager' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>{staff.role === 'manager' ? 'Gerente' : staff.role === 'kitchen' ? 'Cozinha' : 'Garçom'}</Badge><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setCurrentStaff(staff); setIsStaffModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDeleteStaff(staff.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></div></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title={currentItem.id ? "Editar Produto" : "Novo Produto"}>
                <div className="space-y-5">
                    <div className="flex items-center gap-4 mb-2"><div className="flex-1"><Input label="Nome do Produto" value={currentItem.name || ''} onChange={e => setCurrentItem({...currentItem, name: e.target.value})} placeholder="Ex: X-Bacon" /></div><div className="w-auto"><label className="block text-sm font-semibold text-slate-700 mb-1.5 text-center">Disponível</label><button onClick={() => setCurrentItem(prev => ({...prev, available: !prev.available}))} className={`w-full h-[50px] px-4 rounded-xl border flex items-center justify-center transition-all ${currentItem.available !== false ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}><Power className="w-5 h-5" /></button></div></div>
                    <div className="grid grid-cols-2 gap-5"><Input label="Preço (R$)" type="number" step="0.50" value={currentItem.price || ''} onChange={e => setCurrentItem({...currentItem, price: Number(e.target.value)})} /><div className="w-full"><label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Categoria</label><div className="relative"><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none transition-all" value={currentItem.categoryId || ''} onChange={e => setCurrentItem({...currentItem, categoryId: e.target.value})}><option value="">Selecione...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" /></div></div></div>
                    <Input label="Descrição" value={currentItem.description || ''} onChange={e => setCurrentItem({...currentItem, description: e.target.value})} placeholder="Ingredientes, detalhes..." />
                    <Input label="Estoque Atual (Opcional)" type="number" placeholder="Deixe vazio para infinito" value={currentItem.stock !== undefined ? currentItem.stock : ''} onChange={e => setCurrentItem({...currentItem, stock: e.target.value ? Number(e.target.value) : undefined})} />
                    <ImageUpload label="Imagem do Produto" value={currentItem.image} onChange={val => setCurrentItem({...currentItem, image: val})} />
                    <div className="flex justify-end pt-6 gap-3"><Button variant="ghost" onClick={() => setIsItemModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveItem}>Salvar Alterações</Button></div>
                </div>
            </Modal>

            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={editingCategory.id ? "Editar Categoria" : "Nova Categoria"}>
                <div className="space-y-5"><Input label="Nome da Categoria" value={editingCategory.name || ''} onChange={e => setEditingCategory(prev => ({...prev, name: e.target.value}))} placeholder="Ex: Bebidas, Lanches..." /><div className="flex justify-end pt-6 gap-3"><Button variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveCategory}>Salvar</Button></div></div>
            </Modal>

            <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title={currentStaff.id ? "Editar Membro da Equipe" : "Adicionar Membro da Equipe"}>
                <div className="space-y-5">
                    <Input label="Nome Completo" value={currentStaff.name || ''} onChange={e => setCurrentStaff({...currentStaff, name: e.target.value})} placeholder="Ex: Maria Silva" />
                    <Input label="Email de Acesso" type="email" value={currentStaff.email || ''} onChange={e => setCurrentStaff({...currentStaff, email: e.target.value})} placeholder="Ex: maria@loja.com" />
                    <Input label="Senha / PIN" type="password" value={currentStaff.password || ''} onChange={e => setCurrentStaff({...currentStaff, password: e.target.value})} placeholder={currentStaff.id ? "****** (Deixe em branco para manter)" : "******"} />
                    <div className="w-full"><label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Função</label><div className="relative"><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none transition-all" value={currentStaff.role || 'manager'} onChange={e => setCurrentStaff({...currentStaff, role: e.target.value as any})}><option value="manager">Gerente (Acesso Total)</option><option value="kitchen">Cozinha (Apenas Pedidos)</option><option value="waiter">Garçom</option></select><ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" /></div></div>
                    <div className="pt-6 flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsStaffModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveStaff}>{currentStaff.id ? "Salvar Alterações" : "Adicionar Membro"}</Button></div>
                </div>
            </Modal>

            <Modal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} title={currentPromo.id ? "Editar Promoção" : "Nova Promoção"}>
                <div className="space-y-5">
                    <Input label="Título da Oferta" value={currentPromo.title || ''} onChange={e => setCurrentPromo({...currentPromo, title: e.target.value})} placeholder="Ex: Promoção de Terça" />
                    <div className="grid grid-cols-2 gap-4"><Input label="Preço Original (R$)" type="number" value={currentPromo.originalPrice || ''} onChange={e => setCurrentPromo({...currentPromo, originalPrice: Number(e.target.value)})} /><Input label="Preço Promocional (R$)" type="number" value={currentPromo.discountedPrice || ''} onChange={e => setCurrentPromo({...currentPromo, discountedPrice: Number(e.target.value)})} /></div>
                    <Input label="Descrição / Regras" value={currentPromo.description || ''} onChange={e => setCurrentPromo({...currentPromo, description: e.target.value})} />
                    <ImageUpload label="Banner da Promoção" value={currentPromo.image} onChange={val => setCurrentPromo({...currentPromo, image: val})} />
                    <div className="flex items-center gap-3 pt-2"><label className="text-sm font-semibold text-slate-700">Status:</label><button onClick={() => setCurrentPromo(prev => ({...prev, isActive: !prev.isActive}))} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${currentPromo.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{currentPromo.isActive !== false ? 'Ativa' : 'Pausada'}</button></div>
                    <div className="pt-4 flex justify-between gap-3">{currentPromo.id && <Button variant="danger" onClick={() => handleDeletePromo(currentPromo.id!)}><Trash2 className="w-4 h-4 mr-2" /> Excluir</Button>}<div className="flex gap-3 ml-auto"><Button variant="ghost" onClick={() => setIsPromoModalOpen(false)}>Cancelar</Button><Button onClick={handleSavePromo}>Salvar Promoção</Button></div></div>
                </div>
            </Modal>

            <Modal isOpen={isGiveawayModalOpen} onClose={() => setIsGiveawayModalOpen(false)} title={currentGiveaway.id ? "Editar Sorteio" : "Novo Sorteio"}>
                <div className="space-y-5">
                    <Input label="Nome do Sorteio" value={currentGiveaway.title || ''} onChange={e => setCurrentGiveaway({...currentGiveaway, title: e.target.value})} placeholder="Ex: Sorteio Semanal" />
                    <Input label="Prêmio" value={currentGiveaway.prize || ''} onChange={e => setCurrentGiveaway({...currentGiveaway, prize: e.target.value})} placeholder="Ex: Voucher de R$ 100" />
                    <Input label="Data do Sorteio" type="date" value={currentGiveaway.drawDate ? currentGiveaway.drawDate.split('T')[0] : ''} onChange={e => setCurrentGiveaway({...currentGiveaway, drawDate: e.target.value})} />
                    <Input label="Regras / Descrição" value={currentGiveaway.description || ''} onChange={e => setCurrentGiveaway({...currentGiveaway, description: e.target.value})} placeholder="Regras para participar..." />
                    <ImageUpload label="Imagem do Sorteio" value={currentGiveaway.image} onChange={val => setCurrentGiveaway({...currentGiveaway, image: val})} />
                    <div className="flex items-center gap-3 pt-2"><label className="text-sm font-semibold text-slate-700">Status:</label><button onClick={() => setCurrentGiveaway(prev => ({...prev, isActive: !prev.isActive}))} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${currentGiveaway.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{currentGiveaway.isActive !== false ? 'Ativo' : 'Encerrado'}</button></div>
                    <div className="pt-4 flex justify-between gap-3">{currentGiveaway.id && <Button variant="danger" onClick={() => handleDeleteGiveaway(currentGiveaway.id!)}><Trash2 className="w-4 h-4 mr-2" /> Excluir</Button>}<div className="flex gap-3 ml-auto"><Button variant="ghost" onClick={() => setIsGiveawayModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveGiveaway}>Salvar Sorteio</Button></div></div>
                </div>
            </Modal>

            <Modal isOpen={isDrawModalOpen} onClose={() => setIsDrawModalOpen(false)} title="Realizar Sorteio">
                <div className="space-y-6">
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center"><h3 className="text-lg font-bold text-purple-900 mb-1">{currentGiveaway.title}</h3><p className="text-sm text-purple-700">Prêmio: {currentGiveaway.prize}</p><div className="mt-2 text-xs text-slate-500">Participantes: Clientes com pedidos entre {(() => { if (!currentGiveaway.drawDate) return ''; const d = new Date(currentGiveaway.drawDate + 'T23:59:59'); const s = new Date(d); s.setDate(d.getDate() - 7); return `${s.toLocaleDateString()} e ${d.toLocaleDateString()}`; })()}</div></div>
                    {drawWinner ? (
                        <div className="text-center py-8 animate-in zoom-in duration-500"><div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-200 shadow-xl"><Trophy className="w-10 h-10 text-yellow-600" /></div><h2 className="text-2xl font-bold text-slate-900">Parabéns!</h2><p className="text-slate-500 mb-6">O ganhador(a) do sorteio foi:</p><div className="bg-white p-6 rounded-2xl shadow-lg border border-yellow-200 max-w-xs mx-auto"><p className="text-xl font-bold text-slate-900 mb-1">{drawWinner.name}</p><p className="text-sm text-slate-500">{drawWinner.phone}</p></div><div className="mt-8"><Button onClick={() => setIsDrawModalOpen(false)}>Fechar Sorteio</Button></div></div>
                    ) : (
                        <><div className="max-h-60 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-2">{drawParticipants.length === 0 ? <div className="text-center py-8 text-slate-400"><Users className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>Nenhum participante elegível nesta semana.</p></div> : <div className="grid grid-cols-1 gap-2">{drawParticipants.map((p, idx) => <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{idx + 1}</div><div><p className="font-bold text-slate-800 text-sm">{p.name}</p><p className="text-xs text-slate-400">{p.phone}</p></div></div><div className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded">{p.orderCount} pedido(s)</div></div>)}</div>}</div><div className="flex justify-between items-center pt-2"><p className="text-sm text-slate-500">Total: <b>{drawParticipants.length}</b> participantes</p><Button disabled={drawParticipants.length === 0 || isDrawing} onClick={performDraw} className="bg-purple-600 hover:bg-purple-700 shadow-purple-500/20">{isDrawing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sorteando...</> : <><Ticket className="w-4 h-4 mr-2" /> Realizar Sorteio</>}</Button></div></>
                    )}
                </div>
            </Modal>
        </div>
      </main>
    </div>
  );
};