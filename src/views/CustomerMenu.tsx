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
          toast.error("Por favor, preencha todos os dados.");
          return;
      }
      
      const orderId = `ORD-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const paymentLabels: any = { pix: 'PIX', credit: 'Cartão de Crédito', debit: 'Cartão de Débito', cash: 'Dinheiro' };
      
      let message = `🚀 *PEDIDO:* #${orderId}\n`;
      message += `----------------------------\n`;
      message += `🏢 *${restaurant.name}*\n\n`;
      
      message += `📋 *ITENS:*\n`;
      cart.forEach(item => {
          message += `• ${item.quantity}x ${item.name} (R$ ${(item.price * item.quantity).toFixed(2)})\n`;
      });
      message += `\n`;

      message += `🛵 *ENTREGA:*\n`;
      message += `👤 ${customerInfo.name}\n`;
      message += `📍 ${customerInfo.address}\n\n`;

      message += `💳 *PAGAMENTO:*\n`;
      message += `💰 ${paymentLabels[customerInfo.payment]}\n`;
      if (customerInfo.payment === 'cash' && customerInfo.changeFor) {
          message += `💵 Troco p/: R$ ${customerInfo.changeFor}\n`;
      }
      message += `\n`;

      message += `✅ *TOTAL: R$ ${cartTotal.toFixed(2)}*\n`;
      
      const whatsappUrl = `https://wa.me/${restaurant.phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      setCart([]);
      setIsCheckoutOpen(false);
      toast.success("Pedido enviado!");
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      return existing ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name}`, { duration: 600 });
  };

  const filteredItems = useMemo(() => {
    let res = items;
    if (activeCategory) res = res.filter(i => i.categoryId === activeCategory);
    if (searchTerm) res = res.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return res;
  }, [items, activeCategory, searchTerm]);

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400 font-bold">Iniciando...</div>;
  if (!restaurant) return null;

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans">
      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
         <img src={restaurant.coverImage} className="w-full h-full object-cover opacity-60" />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
         <div className="absolute top-3 left-3 z-10">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-full text-white backdrop-blur-md"><ArrowLeft className="w-4 h-4" /></button>
         </div>
         <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3">
            <img src={restaurant.logo} className="w-16 h-16 rounded-xl bg-white p-0.5 object-cover shadow-lg" />
            <div className="text-white">
                <h1 className="text-xl font-black leading-tight">{restaurant.name}</h1>
                <p className="text-[10px] text-slate-300 flex items-center gap-1 uppercase tracking-wider font-bold"><Clock size={10} /> {restaurant.estimatedTime || '30-45 min'}</p>
            </div>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 pt-4">
        <div className="sticky top-0 z-30 bg-slate-50 pb-3">
            <div className="relative mb-3">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar no cardápio..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none bg-white shadow-sm font-medium text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {/* CATEGORIES GRID - Adjusted for wrap and smaller size */}
            <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.id)} 
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border-2 ${activeCategory === cat.id ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {filteredItems.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-3 hover:shadow-md transition-shadow">
                    <img src={item.image} className="w-20 h-20 rounded-xl object-cover" />
                    <div className="flex-1 flex flex-col min-w-0">
                        <h3 className="font-bold text-sm text-slate-800 truncate">{item.name}</h3>
                        <p className="text-[10px] text-slate-500 line-clamp-2 flex-1 leading-snug">{item.description}</p>
                        <div className="flex justify-between items-end mt-1">
                            <span className="font-black text-sm text-emerald-700">R$ {Number(item.price).toFixed(2)}</span>
                            <button onClick={() => addToCart(item)} className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform"><Plus className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {cart.length > 0 && (
          <div className="fixed bottom-4 left-3 right-3 z-40 max-w-4xl mx-auto">
              <button onClick={() => setIsCheckoutOpen(true)} className="w-full bg-slate-900 text-white p-3.5 rounded-xl shadow-xl flex justify-between items-center active:scale-95 transition-all">
                  <div className="flex items-center gap-2.5">
                      <div className="bg-emerald-500 w-6 h-6 flex items-center justify-center rounded text-xs font-black">{cart.reduce((a,b)=>a+b.quantity,0)}</div>
                      <span className="font-bold text-sm">Sacola</span>
                  </div>
                  <span className="font-black text-sm">R$ {cartTotal.toFixed(2)}</span>
              </button>
          </div>
      )}

      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Finalizar Pedido">
           <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
               <div className="space-y-2">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sacola</h4>
                   <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                       {cart.map(i => (
                           <div key={i.id} className="flex justify-between text-xs font-bold text-slate-700">
                               <span>{i.quantity}x {i.name}</span>
                               <span>R$ {(i.price * i.quantity).toFixed(2)}</span>
                           </div>
                       ))}
                   </div>
               </div>

               <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between font-black text-lg">
                   <span>Total</span><span>R$ {cartTotal.toFixed(2)}</span>
               </div>

               <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entrega</h4>
                    <Input label="Nome" size="sm" value={customerInfo.name} onChange={(e: any) => setCustomerInfo({...customerInfo, name: e.target.value})} />
                    <Input label="Telefone" size="sm" value={customerInfo.phone} onChange={(e: any) => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                    <Input label="Endereço" size="sm" value={customerInfo.address} onChange={(e: any) => setCustomerInfo({...customerInfo, address: e.target.value})} />
               </div>

               <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pagamento</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'pix', label: 'PIX', icon: QrCode },
                            { id: 'credit', label: 'Cartão', icon: CreditCard },
                            { id: 'debit', label: 'Débito', icon: CreditCard },
                            { id: 'cash', label: 'Dinheiro', icon: Banknote }
                        ].map(method => (
                            <button 
                                key={method.id}
                                onClick={() => setCustomerInfo({...customerInfo, payment: method.id})}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all font-bold text-[10px] ${customerInfo.payment === method.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                            >
                                <method.icon size={14} />
                                {method.label}
                            </button>
                        ))}
                    </div>
                    {customerInfo.payment === 'cash' && (
                        <Input label="Troco p/ quanto?" size="sm" value={customerInfo.changeFor} onChange={(e: any) => setCustomerInfo({...customerInfo, changeFor: e.target.value})} />
                    )}
               </div>

               <Button className="w-full py-4 text-sm" onClick={checkoutOrder}>
                   <Send className="w-4 h-4 mr-2" /> Enviar Pedido
               </Button>
           </div>
      </Modal>
    </div>
  );
};