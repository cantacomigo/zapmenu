import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { CartItem, Category, MenuItem, Restaurant, Order, CustomerUser, Promotion, Giveaway } from '../types';
import { Button, Modal, Input } from '../components/ui';
import { ShoppingBag, Minus, Plus, Search, MapPin, ArrowLeft, Send, Check, Star, Clock, AlertCircle, Banknote, QrCode, Copy, User, LogIn, LogOut, Store, Megaphone, Gift, Calendar, Trophy, X, Package, CreditCard, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomerMenu: React.FC<{ slug: string; onBack: () => void }> = ({ slug, onBack }) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentCoverIndex, setCurrentCoverIndex] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ 
      name: '', 
      phone: '', 
      address: '', 
      payment: 'credit', 
      changeFor: ''
  });

  useEffect(() => {
    const fetchMenu = async () => {
        setIsLoading(true);
        try {
            const r = await db.getRestaurantBySlug(slug);
            if (r) {
              setRestaurant(r);
              const [cats, menuItems, promos, gives] = await Promise.all([
                  db.getCategories(r.id),
                  db.getMenuItems(r.id),
                  db.getPromotions(r.id),
                  db.getGiveaways(r.id)
              ]);
              setCategories(cats);
              setItems(menuItems);
              setPromotions(promos.filter(p => p.isActive));
              setGiveaways(gives.filter(g => g.isActive || g.winnerName));
              if (cats.length > 0) setActiveCategory(cats[0].id);
            }
        } catch (e) {
            console.error("Erro ao carregar cardápio", e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchMenu();
  }, [slug]);

  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0), [cart]);
  const deliveryFee = restaurant?.deliveryFee || 0;
  const cartTotal = cartSubtotal + deliveryFee;

  const checkoutOrder = async () => {
      if (!restaurant) return;
      if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
          toast.error("Por favor, preencha todos os dados de entrega.");
          return;
      }
      
      const orderId = `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const order: Order = {
          id: orderId,
          restaurantId: restaurant.id,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerAddress: customerInfo.address,
          paymentMethod: customerInfo.payment as any,
          items: cart,
          total: cartTotal,
          status: 'pending',
          createdAt: Date.now()
      };

      await db.addOrder(order);
      
      // Construção da mensagem formatada para WhatsApp
      const paymentLabels: any = { pix: 'PIX', credit: 'Cartão de Crédito', debit: 'Cartão de Débito', cash: 'Dinheiro' };
      
      let message = `🚀 *NOVO PEDIDO REALIZADO!*\n`;
      message += `------------------------------------------\n`;
      message += `🆔 *ID:* #${orderId}\n`;
      message += `🏢 *Loja:* ${restaurant.name}\n`;
      message += `------------------------------------------\n\n`;
      
      message += `📋 *ITENS DO PEDIDO:*\n`;
      cart.forEach(item => {
          message += `• ${item.quantity}x ${item.name} (R$ ${(item.price * item.quantity).toFixed(2)})\n`;
      });
      message += `\n`;

      message += `🛵 *DADOS DE ENTREGA:*\n`;
      message += `👤 *Nome:* ${customerInfo.name}\n`;
      message += `📞 *Fone:* ${customerInfo.phone}\n`;
      message += `📍 *Endereço:* ${customerInfo.address}\n\n`;

      message += `💳 *PAGAMENTO:*\n`;
      message += `💰 *Método:* ${paymentLabels[customerInfo.payment]}\n`;
      if (customerInfo.payment === 'cash' && customerInfo.changeFor) {
          message += `💵 *Troco para:* R$ ${customerInfo.changeFor}\n`;
      }
      message += `\n`;

      message += `📊 *RESUMO FINANCEIRO:*\n`;
      message += `Subtotal: R$ ${cartSubtotal.toFixed(2)}\n`;
      message += `Entrega: R$ ${deliveryFee.toFixed(2)}\n`;
      message += `✅ *TOTAL: R$ ${cartTotal.toFixed(2)}*\n\n`;
      
      message += `------------------------------------------\n`;
      message += `_Pedido enviado via ZapMenu_`;
      
      const whatsappUrl = `https://wa.me/${restaurant.phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      setCart([]);
      setIsCheckoutOpen(false);
      toast.success("Pedido enviado com sucesso!");
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      return existing ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} adicionado!`, { duration: 800 });
  };

  const filteredItems = useMemo(() => {
    let res = items;
    if (activeCategory) res = res.filter(i => i.categoryId === activeCategory);
    if (searchTerm) res = res.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return res;
  }, [items, activeCategory, searchTerm]);

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50 animate-pulse text-slate-400 font-bold">Iniciando cardápio...</div>;
  if (!restaurant) return null;

  return (
    <div className="bg-slate-50 min-h-screen pb-32 font-sans">
      {/* Header Area */}
      <div className="relative h-64 w-full overflow-hidden bg-slate-900">
         <img src={restaurant.coverImage} className="w-full h-full object-cover opacity-60" />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
         <div className="absolute top-4 left-4 z-10">
            <button onClick={onBack} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md"><ArrowLeft className="w-5 h-5" /></button>
         </div>
         <div className="absolute bottom-6 left-6 z-10 flex items-center gap-4">
            <img src={restaurant.logo} className="w-20 h-20 rounded-2xl bg-white p-1 object-cover shadow-lg" />
            <div className="text-white">
                <h1 className="text-2xl font-black">{restaurant.name}</h1>
                <p className="text-xs text-slate-300 flex items-center gap-1"><Clock size={12} /> {restaurant.estimatedTime || '30-45 min'}</p>
            </div>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="sticky top-0 z-30 bg-slate-50 pb-4 pt-2">
            <div className="relative mb-4">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="O que você quer comer hoje?" className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none bg-white shadow-md font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scroll pb-2">
                {categories.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap border-2 ${activeCategory === cat.id ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {filteredItems.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 hover:shadow-md transition-shadow">
                    <img src={item.image} className="w-24 h-24 rounded-2xl object-cover" />
                    <div className="flex-1 flex flex-col">
                        <h3 className="font-bold text-slate-800">{item.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 flex-1">{item.description}</p>
                        <div className="flex justify-between items-end">
                            <span className="font-black text-emerald-700">R$ {Number(item.price).toFixed(2)}</span>
                            <button onClick={() => addToCart(item)} className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors"><Plus className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {cart.length > 0 && (
          <div className="fixed bottom-6 left-4 right-4 z-40 max-w-4xl mx-auto">
              <button onClick={() => setIsCheckoutOpen(true)} className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center group active:scale-95 transition-all">
                  <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 w-8 h-8 flex items-center justify-center rounded-lg font-black">{cart.reduce((a,b)=>a+b.quantity,0)}</div>
                      <span className="font-bold">Ver Sacola</span>
                  </div>
                  <span className="font-black">R$ {cartTotal.toFixed(2)}</span>
              </button>
          </div>
      )}

      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Finalizar Pedido">
           <div className="space-y-6">
               <div className="space-y-3">
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Itens na Sacola</h4>
                   <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                       {cart.map(i => (
                           <div key={i.id} className="flex justify-between font-bold text-slate-700">
                               <span>{i.quantity}x {i.name}</span>
                               <span>R$ {(i.price * i.quantity).toFixed(2)}</span>
                           </div>
                       ))}
                   </div>
                   <div className="flex justify-between text-sm text-slate-500 pt-2 border-t border-slate-50">
                       <span>Taxa de Entrega</span>
                       <span>R$ {deliveryFee.toFixed(2)}</span>
                   </div>
               </div>

               <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl shadow-slate-900/20">
                   <div className="flex justify-between font-black text-2xl tracking-tight"><span>Total</span><span>R$ {cartTotal.toFixed(2)}</span></div>
               </div>

               <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Dados da Entrega</h4>
                    <Input label="Seu Nome" placeholder="Como devemos te chamar?" value={customerInfo.name} onChange={(e: any) => setCustomerInfo({...customerInfo, name: e.target.value})} />
                    <Input label="Telefone / WhatsApp" placeholder="(00) 00000-0000" value={customerInfo.phone} onChange={(e: any) => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                    <Input label="Endereço Completo" placeholder="Rua, número, bairro e referência" value={customerInfo.address} onChange={(e: any) => setCustomerInfo({...customerInfo, address: e.target.value})} />
               </div>

               <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Método de Pagamento</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'pix', label: 'PIX', icon: QrCode },
                            { id: 'credit', label: 'Crédito', icon: CreditCard },
                            { id: 'debit', label: 'Débito', icon: CreditCard },
                            { id: 'cash', label: 'Dinheiro', icon: Banknote }
                        ].map(method => (
                            <button 
                                key={method.id}
                                onClick={() => setCustomerInfo({...customerInfo, payment: method.id})}
                                className={`flex items-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${customerInfo.payment === method.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                            >
                                <method.icon size={18} />
                                {method.label}
                            </button>
                        ))}
                    </div>
                    {customerInfo.payment === 'cash' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <Input label="Troco para quanto?" placeholder="Ex: R$ 50,00" value={customerInfo.changeFor} onChange={(e: any) => setCustomerInfo({...customerInfo, changeFor: e.target.value})} />
                        </div>
                    )}
               </div>

               <Button className="w-full py-5 text-lg" onClick={checkoutOrder}>
                   <Send className="w-5 h-5 mr-2" /> Enviar Pedido via WhatsApp
               </Button>
           </div>
      </Modal>
    </div>
  );
};