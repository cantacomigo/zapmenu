import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { CartItem, Category, MenuItem, Restaurant, Order, CustomerUser, Promotion, Giveaway } from '../types';
import { Button, Modal, Input } from '../components/ui';
import { ShoppingBag, Minus, Plus, Search, MapPin, ArrowLeft, Send, Check, Star, Clock, AlertCircle, Banknote, QrCode, Copy, User, LogIn, LogOut, Store, Megaphone, Gift, Calendar, Trophy, X, Package, Utensils, Coins } from 'lucide-react';

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
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', phone: '', address: '', password: '' });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ 
      name: '', 
      phone: '', 
      address: '', 
      payment: 'credit' as 'credit' | 'pix' | 'cash' | 'debit', 
      changeFor: '',
  });
  
  useEffect(() => {
    const fetchMenu = async () => {
        setIsLoading(true);
        try {
            const r = await db.getRestaurantBySlug(slug);
            if (r) {
              setRestaurant(r);
              const cats = await db.getCategories(r.id);
              setCategories(cats);
              setItems(await db.getMenuItems(r.id));
              const promos = await db.getPromotions(r.id);
              setPromotions(promos.filter(p => p.isActive));
              const gives = await db.getGiveaways(r.id);
              setGiveaways(gives.filter(g => g.isActive || g.winnerName));
              
              if (cats.length > 0) {
                  setActiveCategory(cats[0].id);
              }
            }
        } catch (e) {
            console.error("Failed to load menu", e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchMenu();
    
    const storedUser = localStorage.getItem('zapmenu_current_user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setCustomerInfo(prev => ({ ...prev, name: user.name, phone: user.phone, address: user.address }));
    }
  }, [slug]);

  const coverImages = useMemo(() => {
    if (!restaurant) return [];
    if (restaurant.coverImages && restaurant.coverImages.length > 0) return restaurant.coverImages;
    return [restaurant.coverImage];
  }, [restaurant]);

  useEffect(() => {
    if (coverImages.length <= 1) return;
    const timer = setInterval(() => {
        setCurrentCoverIndex(prev => (prev + 1) % coverImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [coverImages]);

  const handleLogin = async () => {
      const user = await db.loginCustomer(authForm.phone, authForm.password);
      if (user) {
          setCurrentUser(user);
          localStorage.setItem('zapmenu_current_user', JSON.stringify(user));
          setIsAuthModalOpen(false);
      } else {
          alert("Telefone ou senha incorretos.");
      }
  };

  const handleRegister = async () => {
      const res = await db.registerCustomer({ ...authForm, createdAt: Date.now() } as CustomerUser);
      if (res) {
          alert("Cadastro realizado! Faça login.");
          setAuthMode('login');
      } else {
          alert("Erro ao realizar cadastro. Tente outro telefone.");
      }
  };

  const addToCart = (item: MenuItem) => {
    if (!item.available) return;
    const currentInCart = cart.find(i => i.id === item.id)?.quantity || 0;
    if (item.stock !== undefined && item.stock !== null && currentInCart >= item.stock) {
        alert("Desculpe, este item atingiu o limite do estoque.");
        return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      return existing 
        ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      return existing && existing.quantity > 1 
        ? prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
        : prev.filter(i => i.id !== itemId);
    });
  };

  const checkoutOrder = async () => {
      if (!restaurant) return;
      if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
          alert("Por favor, preencha todos os dados de entrega.");
          return;
      }

      const order: Order = {
          id: `ord_${Date.now()}`,
          restaurantId: restaurant.id,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerAddress: customerInfo.address,
          paymentMethod: customerInfo.payment as any,
          paymentDetails: customerInfo.payment === 'cash' && customerInfo.changeFor ? `Troco para R$ ${customerInfo.changeFor}` : undefined,
          items: cart,
          total: cartTotal,
          status: 'pending',
          createdAt: Date.now()
      };
      
      await db.addOrder(order);
      setCart([]);
      setIsCheckoutOpen(false);

      const paymentLabel = {
          'credit': 'Cartão de Crédito',
          'debit': 'Cartão de Débito',
          'pix': 'Pix',
          'cash': 'Dinheiro'
      }[customerInfo.payment];

      const changeInfo = (customerInfo.payment === 'cash' && customerInfo.changeFor) 
          ? `\n💰 *Troco para:* R$ ${customerInfo.changeFor}` 
          : '';

      const message = `*Novo Pedido: ${restaurant.name}*\n\n` +
          `👤 *Cliente:* ${order.customerName}\n` +
          `📞 *Fone:* ${order.customerPhone}\n` +
          `📍 *Endereço:* ${order.customerAddress}\n\n` +
          `🛒 *Itens:*\n` + 
          cart.map(i => `${i.quantity}x ${i.name} (R$ ${(i.price * i.quantity).toFixed(2)})`).join('\n') + 
          `\n\n🛵 *Taxa de Entrega:* R$ ${deliveryFee.toFixed(2)}` +
          `\n💰 *Total:* R$ ${order.total.toFixed(2)}` +
          `\n💳 *Pagamento:* ${paymentLabel}${changeInfo}`;

      window.open(`https://wa.me/${restaurant.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0), [cart]);
  const deliveryFee = restaurant?.deliveryFee || 0;
  const cartTotal = cartSubtotal + deliveryFee;

  const filteredItems = useMemo(() => {
    let res = items;
    if (activeCategory) res = res.filter(i => i.categoryId === activeCategory);
    if (searchTerm) res = res.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return res;
  }, [items, activeCategory, searchTerm]);

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50">Carregando...</div>;
  if (!restaurant) return <div>Restaurante não encontrado</div>;

  return (
    <div className="bg-slate-50 min-h-screen pb-32 md:pb-12 font-sans">
      <div className="relative h-72 md:h-80 w-full overflow-hidden bg-slate-900">
         {coverImages.map((img, idx) => (
             <img key={idx} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentCoverIndex ? 'opacity-100' : 'opacity-0'}`} alt="cover" />
         ))}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
         <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
            <button onClick={onBack} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md hover:bg-white/20 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
            {currentUser ? (
                <button onClick={() => { setCurrentUser(null); localStorage.removeItem('zapmenu_current_user'); }} className="bg-white/10 px-4 py-2 rounded-full text-white text-sm backdrop-blur-md hover:bg-white/20 transition-colors">Sair</button>
            ) : (
                <button onClick={() => setIsAuthModalOpen(true)} className="bg-emerald-600 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg shadow-emerald-500/20">Entrar</button>
            )}
         </div>
         <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <div className="flex items-end gap-4 max-w-4xl mx-auto">
                <img src={restaurant.logo} className="w-24 h-24 rounded-2xl bg-white p-1 object-cover shadow-lg" alt="logo" />
                <div className="text-white mb-2">
                    <h1 className="text-3xl font-bold">{restaurant.name}</h1>
                    <div className="flex gap-3 text-sm font-medium text-slate-200 mt-1">
                        <span className="flex items-center"><Star className="w-4 h-4 text-yellow-400 mr-1" /> 4.8</span>
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {restaurant.estimatedTime}</span>
                    </div>
                </div>
            </div>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8">
        {promotions.length > 0 && (
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Megaphone className="w-5 h-5 text-pink-600" />
                    <h2 className="text-xl font-bold text-slate-900">Ofertas</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto hide-scroll pb-4 -mx-4 px-4">
                    {promotions.map(promo => (
                        <div key={promo.id} className="min-w-[280px] bg-white p-4 rounded-2xl shadow-sm border border-pink-100 flex flex-col hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-800">{promo.title}</h3>
                                <div className="bg-pink-100 text-pink-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Oferta</div>
                            </div>
                            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{promo.description}</p>
                            <div className="flex justify-between items-center mt-auto">
                                <span className="text-lg font-bold text-pink-600">R$ {Number(promo.discountedPrice).toFixed(2)}</span>
                                <button onClick={() => addToCart({ id: `promo_${promo.id}`, name: promo.title, price: promo.discountedPrice, image: '', available: true } as MenuItem)} className="bg-pink-50 text-pink-600 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="sticky top-0 z-30 bg-slate-50 pb-4 pt-2">
            <div className="relative mb-4">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Buscar no cardápio..." className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none bg-white shadow-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2 pb-2">
                {categories.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.id)} 
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${activeCategory === cat.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
                <div key={item.id} className={`bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex gap-4 transition-all hover:shadow-md ${(!item.available || (item.stock !== undefined && item.stock !== null && item.stock <= 0)) && 'opacity-60 grayscale'}`}>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0">
                         <Utensils className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col flex-1">
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-3 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                            <span className="font-bold text-lg text-emerald-700">R$ {Number(item.price).toFixed(2)}</span>
                            <button onClick={() => addToCart(item)} disabled={!item.available || (item.stock !== undefined && item.stock !== null && item.stock <= 0)} className="bg-slate-50 text-slate-600 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {cart.length > 0 && (
          <div className="fixed bottom-6 left-4 right-4 z-40 max-w-4xl mx-auto">
              <button onClick={() => setIsCheckoutOpen(true)} className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-900/20 flex justify-between items-center hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-white shadow-sm">{cart.reduce((a,b)=>a+b.quantity,0)}</div>
                      <span className="font-semibold">Ver sacola</span>
                  </div>
                  <span className="font-bold text-xl">R$ {cartTotal.toFixed(2)}</span>
              </button>
          </div>
      )}

      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Identificação">
          <div className="space-y-4">
              <Input label="Telefone" placeholder="DDD + Número" value={authForm.phone} onChange={(e: any) => setAuthForm({...authForm, phone: e.target.value})} />
              <Input label="Senha" type="password" placeholder="Sua senha" value={authForm.password} onChange={(e: any) => setAuthForm({...authForm, password: e.target.value})} />
              {authMode === 'register' && <Input label="Nome Completo" placeholder="Ex: João Silva" value={authForm.name} onChange={(e: any) => setAuthForm({...authForm, name: e.target.value})} />}
              {authMode === 'register' && <Input label="Endereço de Entrega" placeholder="Rua, Número, Bairro" value={authForm.address} onChange={(e: any) => setAuthForm({...authForm, address: e.target.value})} />}
              <Button className="w-full" onClick={authMode === 'login' ? handleLogin : handleRegister}>{authMode === 'login' ? 'Entrar' : 'Cadastrar'}</Button>
              <button onClick={() => setAuthMode(m => m === 'login' ? 'register' : 'login')} className="w-full text-center text-sm text-slate-500 mt-2">
                  {authMode === 'login' ? 'Ainda não tem conta? Criar conta' : 'Já tem conta? Fazer login'}
              </button>
          </div>
      </Modal>

      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Finalizar Pedido">
           <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
               <div className="space-y-2">
                   <h3 className="text-sm font-bold text-slate-900">Itens da Sacola</h3>
                   {cart.map(i => (
                       <div key={i.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                           <div className="font-medium text-slate-700 text-sm">{i.name} <span className="text-xs text-slate-500 ml-1">x{i.quantity}</span></div>
                           <div className="flex items-center gap-2">
                               <button onClick={() => removeFromCart(i.id)} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500"><Minus className="w-4 h-4" /></button>
                               <button onClick={() => addToCart(i)} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-emerald-600"><Plus className="w-4 h-4" /></button>
                           </div>
                       </div>
                   ))}
               </div>

               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="flex justify-between text-slate-500 text-sm mb-1"><span>Subtotal</span><span>R$ {cartSubtotal.toFixed(2)}</span></div>
                   <div className="flex justify-between text-slate-500 text-sm mb-3"><span>Taxa de Entrega</span><span>R$ {deliveryFee.toFixed(2)}</span></div>
                   <div className="flex justify-between font-bold text-lg text-slate-900 border-t border-slate-200 pt-2"><span>Total</span><span>R$ {cartTotal.toFixed(2)}</span></div>
               </div>

               <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-slate-900">Dados de Entrega</h3>
                    <Input label="Seu Nome" placeholder="Quem vai receber?" value={customerInfo.name} onChange={(e: any) => setCustomerInfo({...customerInfo, name: e.target.value})} />
                    <Input label="Endereço Completo" placeholder="Rua, Número, Bairro, Complemento" value={customerInfo.address} onChange={(e: any) => setCustomerInfo({...customerInfo, address: e.target.value})} />
                    <Input label="WhatsApp" placeholder="DDD + Número" value={customerInfo.phone} onChange={(e: any) => setCustomerInfo({...customerInfo, phone: e.target.value})} />
               </div>

               <div className="space-y-3 pt-2">
                   <h3 className="text-sm font-bold text-slate-900">Forma de Pagamento</h3>
                   <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => setCustomerInfo({...customerInfo, payment: 'pix'})} className={`p-3 border rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${customerInfo.payment === 'pix' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                           <QrCode size={18} /> PIX
                       </button>
                       <button onClick={() => setCustomerInfo({...customerInfo, payment: 'credit'})} className={`p-3 border rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${customerInfo.payment === 'credit' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                           <Banknote size={18} /> CARTÃO
                       </button>
                       <button onClick={() => setCustomerInfo({...customerInfo, payment: 'cash'})} className={`p-3 border rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${customerInfo.payment === 'cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                           <Coins size={18} /> DINHEIRO
                       </button>
                       <button onClick={() => setCustomerInfo({...customerInfo, payment: 'debit'})} className={`p-3 border rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${customerInfo.payment === 'debit' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                           <CreditCard size={18} /> DÉBITO
                       </button>
                   </div>
                   
                   {customerInfo.payment === 'cash' && (
                       <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                           <Input 
                               label="Troco para quanto?" 
                               placeholder="Ex: 50,00 (deixe vazio se não precisar)" 
                               type="number"
                               value={customerInfo.changeFor} 
                               onChange={(e: any) => setCustomerInfo({...customerInfo, changeFor: e.target.value})} 
                           />
                       </div>
                   )}
               </div>

               <Button className="w-full text-lg py-4 mt-4 bg-emerald-600 border-none shadow-lg shadow-emerald-500/20" onClick={checkoutOrder}>
                   Enviar Pedido via WhatsApp <Send className="ml-2 w-4 h-4" />
               </Button>
           </div>
      </Modal>
    </div>
  );
};

// Import inline to fix missing icon in local context
const CreditCard = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
);