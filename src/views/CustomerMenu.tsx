import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { CartItem, Category, MenuItem, Restaurant, Order, CustomerUser, Promotion, Giveaway } from '../types';
import { Button, Modal, Input, Badge } from '../components/ui';
import { ShoppingBag, Minus, Plus, Search, MapPin, ArrowLeft, Send, Check, Star, Clock, AlertCircle, Banknote, QrCode, Copy, User, LogIn, LogOut, Store, Megaphone, Gift, Calendar, Trophy, X, Package, Utensils, Coins, ClipboardList, ArrowRight } from 'lucide-react';
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
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', phone: '', address: '', password: '' });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  
  const [customerInfo, setCustomerInfo] = useState({ 
      name: '', 
      phone: '', 
      address: '', 
      payment: 'credit' as 'credit' | 'pix' | 'cash' | 'debit', 
      changeFor: '',
      scheduledTime: '',
  });

  const isStoreOpen = useMemo(() => {
    if (!restaurant?.openingTime || !restaurant?.closingTime) return true;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [openH, openM] = restaurant.openingTime.split(':').map(Number);
    const [closeH, closeM] = restaurant.closingTime.split(':').map(Number);
    
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    
    if (closeMinutes < openMinutes) {
        return currentTime >= openMinutes || currentTime < closeMinutes;
    }
    
    return currentTime >= openMinutes && currentTime < closeMinutes;
  }, [restaurant]);
  
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
              setGiveaways(gives); // Mostra todos, inclusive finalizados
              
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
        setCustomerInfo(prev => ({ 
          ...prev, 
          name: user.name, 
          phone: user.phone, 
          address: user.address 
        }));
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
          setCustomerInfo(prev => ({ ...prev, name: user.name, phone: user.phone, address: user.address }));
          setIsAuthModalOpen(false);
          toast.success(`Bem-vindo, ${user.name}!`);
          setIsCheckoutOpen(true);
      } else {
          toast.error("Telefone ou senha incorretos.");
      }
  };

  const handleRegister = async () => {
      const res = await db.registerCustomer({ ...authForm, createdAt: Date.now() } as CustomerUser);
      if (res) {
          toast.success("Cadastro realizado! Agora faça o login.");
          setAuthMode('login');
      } else {
          toast.error("Erro ao realizar cadastro. Tente outro telefone.");
      }
  };

  const fetchCustomerOrders = async () => {
      if (!currentUser || !restaurant) return;
      const orders = await db.getCustomerOrders(currentUser.phone, restaurant.id);
      setCustomerOrders(orders);
  };

  useEffect(() => {
      if (isOrdersModalOpen) {
          fetchCustomerOrders();
          const interval = setInterval(fetchCustomerOrders, 15000); 
          return () => clearInterval(interval);
      }
  }, [isOrdersModalOpen, currentUser]);

  const addToCart = (item: MenuItem | Promotion) => {
    if ('available' in item && !item.available) return;
    
    // Se for promoção, tratamos como um item especial
    const cartPayload = 'discountedPrice' in item ? {
        id: item.id,
        restaurantId: item.restaurantId,
        categoryId: 'promo',
        name: item.title,
        description: item.description,
        price: item.discountedPrice,
        image: item.image,
        available: true
    } as MenuItem : item;

    setCart(prev => {
      const existing = prev.find(i => i.id === cartPayload.id);
      return existing 
        ? prev.map(i => i.id === cartPayload.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...cartPayload, quantity: 1 }];
    });
    toast.success("Adicionado à sacola!");
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      return existing && existing.quantity > 1 
        ? prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
        : prev.filter(i => i.id !== itemId);
    });
  };

  const handleOpenCheckout = () => {
      if (!currentUser) {
          setAuthMode('login');
          setIsAuthModalOpen(true);
          return;
      }
      setIsCheckoutOpen(true);
  };

  const checkoutOrder = async () => {
      if (!restaurant || !currentUser) return;
      
      if (!isStoreOpen && !customerInfo.scheduledTime) {
          toast.error("Por favor, selecione um horário para agendar seu pedido.");
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
          scheduledTime: customerInfo.scheduledTime || undefined,
          items: cart,
          total: cartTotal,
          status: 'pending',
          createdAt: Date.now()
      };
      
      await db.addOrder(order);
      setCart([]);
      setIsCheckoutOpen(false);

      const e = {
          bento: "\uD83C\uDF71",
          user: "\uD83D\uDC64",
          phone: "\uD83D\uDCDE",
          pin: "\uD83D\uDCCC",
          cart: "\uD83D\uDED2",
          check: "\u2705",
          motor: "\uD83D\uDEF5",
          money: "\uD83D\uDCB0",
          card: "\uD83D\uDCB3",
          rocket: "\uD83D\uDE80",
          time: "\u23F2",
          spark: "\u2728",
          bill: "\uD83D\uDCB5",
          calendar: "\uD83D\uDCC5"
      };

      const paymentLabel = {
          'credit': `${e.card} Cartão de Crédito`,
          'debit': `${e.card} Cartão de Débito`,
          'pix': `${e.spark} Pix`,
          'cash': `${e.bill} Dinheiro`
      }[customerInfo.payment];

      const changeInfo = (customerInfo.payment === 'cash' && customerInfo.changeFor) 
          ? `\n${e.money} *Troco para:* R$ ${customerInfo.changeFor}` 
          : '';
          
      const scheduleInfo = order.scheduledTime 
          ? `\n${e.calendar} *AGENDADO PARA:* ${new Date(order.scheduledTime).toLocaleString('pt-BR')}` 
          : '';

      const pixReminder = customerInfo.payment === 'pix' 
          ? `\n\n${e.pin} *Atenção:* Vou enviar o comprovante do Pix em seguida! ${e.rocket}` 
          : '';

      const message = `*${e.bento} Novo Pedido: ${restaurant.name}*\n\n` +
          `${e.user} *Cliente:* ${order.customerName}\n` +
          `${e.phone} *Fone:* ${order.customerPhone}\n` +
          `${e.pin} *Endereço:* ${order.customerAddress}${scheduleInfo}\n\n` +
          `${e.cart} *Itens do Pedido:*\n` + 
          cart.map(i => `${e.check} ${i.quantity}x ${i.name} (R$ ${(i.price * i.quantity).toFixed(2)})`).join('\n') + 
          `\n\n${e.motor} *Taxa de Entrega:* R$ ${deliveryFee.toFixed(2)}` +
          `\n${e.money} *Total Geral:* R$ ${order.total.toFixed(2)}` +
          `\n${e.card} *Forma de Pagamento:* ${paymentLabel}${changeInfo}${pixReminder}\n\n` +
          `${e.time} *Pedido realizado em:* ${new Date().toLocaleTimeString('pt-BR')}`;

      const cleanPhone = restaurant.phone.replace(/\D/g, '');
      const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      setIsOrdersModalOpen(true);
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

  return (
    <div className="bg-slate-50 min-h-screen pb-32 md:pb-12 font-sans">
      {/* Header com Capa */}
      <div className="relative h-72 md:h-80 w-full overflow-hidden bg-slate-900">
         {coverImages.map((img, idx) => (
             <img key={idx} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentCoverIndex ? 'opacity-100' : 'opacity-0'}`} alt="cover" />
         ))}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
         <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
            <button onClick={onBack} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md hover:bg-white/20 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
            <div className="flex gap-2">
                {currentUser && (
                    <button onClick={() => setIsOrdersModalOpen(true)} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md hover:bg-white/20 transition-colors">
                        <ClipboardList className="w-5 h-5" />
                    </button>
                )}
                {currentUser ? (
                    <button onClick={() => { setCurrentUser(null); localStorage.removeItem('zapmenu_current_user'); }} className="bg-white/10 px-4 py-2 rounded-full text-white text-sm backdrop-blur-md hover:bg-white/20 transition-colors">Sair</button>
                ) : (
                    <button onClick={() => setIsAuthModalOpen(true)} className="bg-emerald-600 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg shadow-emerald-500/20">Entrar / Cadastrar</button>
                )}
            </div>
         </div>
         <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <div className="flex items-end gap-4 max-w-4xl mx-auto">
                <img src={restaurant?.logo} className="w-24 h-24 rounded-2xl bg-white p-1 object-cover shadow-lg" alt="logo" />
                <div className="text-white mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-3xl font-bold">{restaurant?.name}</h1>
                        <Badge color={isStoreOpen ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}>
                            {isStoreOpen ? 'Aberto' : 'Fechado'}
                        </Badge>
                    </div>
                    <div className="flex gap-3 text-sm font-medium text-slate-200 mt-1">
                        <span className="flex items-center"><Star className="w-4 h-4 text-yellow-400 mr-1" /> 4.8</span>
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {restaurant?.openingTime} - {restaurant?.closingTime}</span>
                    </div>
                </div>
            </div>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8 space-y-8">
        {/* Banner de Loja Fechada */}
        {!isStoreOpen && (
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                    <p className="text-sm font-bold text-red-900 leading-tight">Loja Fechada!</p>
                    <p className="text-xs text-red-700">Faça seu pedido agora e agende a entrega para mais tarde.</p>
                </div>
            </div>
        )}

        {/* PROMOÇÕES (Sempre visíveis) */}
        {promotions.length > 0 && (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-pink-600" />
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Ofertas Imperdíveis</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scroll -mx-4 px-4">
                    {promotions.map(promo => (
                        <div key={promo.id} className="min-w-[280px] bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
                            <div className="h-32 bg-slate-100 relative">
                                {promo.image && <img src={promo.image} className="w-full h-full object-cover" alt={promo.title} />}
                                <div className="absolute top-2 left-2 bg-pink-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">Promoção</div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-slate-800 line-clamp-1">{promo.title}</h3>
                                <div className="flex justify-between items-center mt-3">
                                    <div>
                                        <span className="text-[10px] text-slate-400 line-through">R$ {Number(promo.originalPrice).toFixed(2)}</span>
                                        <p className="text-lg font-black text-pink-600 leading-tight">R$ {Number(promo.discountedPrice).toFixed(2)}</p>
                                    </div>
                                    <button onClick={() => addToCart(promo)} className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-pink-600 hover:text-white transition-all">
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* SORTEIOS (Sempre visíveis) */}
        {giveaways.length > 0 && (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-600" />
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Sorteios e Prêmios</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {giveaways.map(give => (
                        <div key={give.id} className={`p-4 rounded-3xl border ${give.winnerName ? 'bg-emerald-50/50 border-emerald-100' : 'bg-purple-50/50 border-purple-100'} flex gap-4`}>
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                                {give.winnerName ? <Trophy className="w-8 h-8 text-emerald-600" /> : <Gift className="w-8 h-8 text-purple-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 text-sm truncate">{give.title}</h3>
                                <p className="text-xs text-slate-500 font-medium">Prêmio: {give.prize}</p>
                                {give.winnerName ? (
                                    <div className="mt-2 text-[10px] font-black text-emerald-700 uppercase">
                                        Ganhador: {give.winnerName}
                                    </div>
                                ) : (
                                    <div className="mt-2 text-[10px] font-black text-purple-700 uppercase flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Sorteio: {new Date(give.drawDate).toLocaleDateString('pt-BR')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Busca e Categorias */}
        <div className="sticky top-0 z-30 bg-slate-50 pb-4 pt-2">
            <div className="relative mb-4">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="O que você quer comer hoje?" className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none bg-white shadow-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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

        {/* Lista de Itens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex gap-4 transition-all hover:shadow-md">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center text-slate-300 shrink-0">
                         {item.image ? (
                             <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                         ) : (
                             <Utensils className="w-8 h-8" />
                         )}
                    </div>
                    <div className="flex flex-col flex-1">
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                            <span className="font-bold text-lg text-emerald-700">R$ {Number(item.price).toFixed(2)}</span>
                            <button onClick={() => addToCart(item)} className="bg-slate-50 text-slate-600 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Botão Flutuante do Carrinho */}
      {cart.length > 0 && (
          <div className="fixed bottom-6 left-4 right-4 z-40 max-w-4xl mx-auto">
              <button onClick={handleOpenCheckout} className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-900/20 flex justify-between items-center hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-white">{cart.reduce((a,b)=>a+b.quantity,0)}</div>
                      <span className="font-semibold">{isStoreOpen ? 'Ver sacola' : 'Agendar Pedido'}</span>
                  </div>
                  <span className="font-bold text-xl">R$ {cartTotal.toFixed(2)}</span>
              </button>
          </div>
      )}

      {/* Modais omitidos para brevidade, mas mantidos no código original */}
      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title={authMode === 'login' ? "Entrar na Conta" : "Criar Cadastro"}>
          <div className="space-y-4">
              {authMode === 'register' && (
                  <Input label="Nome Completo" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} placeholder="Como devemos te chamar?" />
              )}
              <Input label="WhatsApp" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} placeholder="Seu número com DDD" />
              {authMode === 'register' && (
                  <Input label="Endereço Padrão" value={authForm.address} onChange={e => setAuthForm({...authForm, address: e.target.value})} placeholder="Rua, Número, Bairro" />
              )}
              <Input label="Senha" type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} placeholder="••••••••" />
              <Button className="w-full bg-emerald-600 border-none py-4" onClick={authMode === 'login' ? handleLogin : handleRegister}>
                  {authMode === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro'}
              </Button>
              <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-center text-xs font-bold text-slate-400 hover:text-emerald-600">
                  {authMode === 'login' ? 'Não tem conta? Cadastre-se aqui' : 'Já tem conta? Faça o login'}
              </button>
          </div>
      </Modal>

      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Finalizar Pedido">
          <div className="space-y-6">
              {!isStoreOpen && (
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                      <label className="block text-xs font-black uppercase text-amber-700 tracking-widest mb-2">Selecione o horário do agendamento</label>
                      <input type="datetime-local" className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none" value={customerInfo.scheduledTime} onChange={e => setCustomerInfo({...customerInfo, scheduledTime: e.target.value})} />
                  </div>
              )}
              <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Seus Itens</p>
                  {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-50">
                          <div className="flex gap-3">
                              <span className="font-bold text-emerald-600">{item.quantity}x</span>
                              <span className="text-sm font-medium text-slate-700">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="text-sm font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                              <button onClick={() => removeFromCart(item.id)} className="p-1 text-slate-300 hover:text-red-500"><X size={14} /></button>
                          </div>
                      </div>
                  ))}
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-100">
                  <Input label="Endereço de Entrega" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
                  <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Forma de Pagamento</label>
                      <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={customerInfo.payment} onChange={e => setCustomerInfo({...customerInfo, payment: e.target.value as any})}>
                          <option value="pix">Pix (No local ou link)</option>
                          <option value="credit">Cartão de Crédito</option>
                          <option value="debit">Cartão de Débito</option>
                          <option value="cash">Dinheiro</option>
                      </select>
                  </div>
                  {customerInfo.payment === 'cash' && <Input label="Precisa de troco?" type="number" value={customerInfo.changeFor} onChange={e => setCustomerInfo({...customerInfo, changeFor: e.target.value})} placeholder="Ex: 50.00" />}
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span>R$ {cartSubtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm text-slate-500"><span>Taxa de Entrega</span><span>R$ {deliveryFee.toFixed(2)}</span></div>
                  <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200"><span>Total</span><span>R$ {cartTotal.toFixed(2)}</span></div>
              </div>
              <Button className="w-full bg-emerald-600 border-none py-4 text-lg" onClick={checkoutOrder}><Send className="w-5 h-5 mr-2" /> Enviar para o WhatsApp</Button>
          </div>
      </Modal>

      <Modal isOpen={isOrdersModalOpen} onClose={() => setIsOrdersModalOpen(false)} title="Meus Pedidos">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {customerOrders.length > 0 ? customerOrders.map(order => {
                  const status = { 'pending': { label: 'Pendente', color: 'bg-amber-100 text-amber-700' }, 'paid': { label: 'Em Preparo', color: 'bg-emerald-100 text-emerald-700' }, 'shipped': { label: 'Em Entrega', color: 'bg-purple-100 text-purple-700' }, 'completed': { label: 'Finalizado', color: 'bg-slate-100 text-slate-700' }, 'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-700' } }[order.status] || { label: order.status, color: 'bg-slate-100' };
                  return (
                      <div key={order.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <div className="flex justify-between items-start mb-2"><span className="text-xs font-black text-slate-400">#{order.id.slice(-6).toUpperCase()}</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.color}`}>{status.label}</span></div>
                          <div className="space-y-1">{order.items.map((item, idx) => (<div key={idx} className="text-xs text-slate-500 flex justify-between"><span>{item.quantity}x {item.name}</span><span>R$ {(item.price * item.quantity).toFixed(2)}</span></div>))}</div>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50"><span className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span><span className="font-bold text-slate-900">Total: R$ {order.total.toFixed(2)}</span></div>
                      </div>
                  );
              }) : <div className="text-center py-10"><Package className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400">Nenhum pedido encontrado.</p></div>}
          </div>
      </Modal>
    </div>
  );
};