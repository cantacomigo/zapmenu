import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../services/db';
import { CartItem, Category, MenuItem, Restaurant, Order, CustomerUser, Promotion, Giveaway, ProductAddon } from '../types';
import { Button, Modal, Input, Badge } from '../components/ui';
import { ShoppingBag, Minus, Plus, Search, MapPin, ArrowLeft, Send, Check, Star, Clock, AlertCircle, Banknote, QrCode, Copy, User, LogIn, LogOut, Store, Megaphone, Gift, Calendar, Trophy, X, Package, Utensils, Coins, ClipboardList, Sparkles, ChevronRight, Smartphone, Download, Share } from 'lucide-react';
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
  
  const [isItemDetailOpen, setIsItemDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [tempAddons, setTempAddons] = useState<ProductAddon[]>([]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);

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
    if (closeMinutes < openMinutes) return currentTime >= openMinutes || currentTime < closeMinutes;
    return currentTime >= openMinutes && currentTime < closeMinutes;
  }, [restaurant]);

  const coverImages = useMemo(() => {
    if (!restaurant) return [];
    if (restaurant.coverImages && restaurant.coverImages.length > 0) return restaurant.coverImages;
    return restaurant.coverImage ? [restaurant.coverImage] : [];
  }, [restaurant]);

  useEffect(() => {
    if (coverImages.length <= 1) return;
    const timer = setInterval(() => {
        setCurrentCoverIndex(prev => (prev + 1) % coverImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [coverImages]);
  
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
        } catch (e) { console.error("Failed to load menu", e); }
        finally { 
            setTimeout(() => setIsLoading(false), 800);
        }
    };
    fetchMenu();
    
    // PWA Logic safer
    const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect IOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    if (isIOSDevice && !window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallBanner(true);
    }

    const storedUser = localStorage.getItem('zapmenu_current_user');
    if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          setCustomerInfo(prev => ({ ...prev, name: user.name, phone: user.phone, address: user.address }));
        } catch(e) {}
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [slug]);

  const handleInstallApp = async () => {
      if (isIOS) {
          toast("No iPhone: Toque no ícone de 'Compartilhar' abaixo e depois em 'Adicionar à Tela de Início'", { duration: 6000, icon: '📱' });
          return;
      }
      if (!deferredPrompt) {
          toast.success("O app já está instalado ou não é suportado pelo seu navegador.");
          return;
      }
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowInstallBanner(false);
      }
  };

  useEffect(() => {
    if (activeCategory && categoryRef.current) {
        const activeElement = categoryRef.current.querySelector(`[data-id="${activeCategory}"]`);
        if (activeElement) {
            activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }
  }, [activeCategory]);

  const handleOpenItem = (item: MenuItem) => {
      if (!item.available) return;
      if (!item.addons || item.addons.length === 0) {
          addToCart(item, []);
          return;
      }
      setSelectedItem(item);
      setTempAddons([]);
      setIsItemDetailOpen(true);
  };

  const addToCart = (item: MenuItem | Promotion, addons: ProductAddon[] = []) => {
    const isPromo = 'discountedPrice' in item;
    const cartItem: CartItem = isPromo ? {
        id: item.id,
        restaurantId: item.restaurantId,
        categoryId: 'promo',
        name: item.title,
        description: item.description,
        price: item.discountedPrice,
        image: item.image,
        available: true,
        quantity: 1,
        selectedAddons: addons
    } : {
        ...item,
        quantity: 1,
        selectedAddons: addons
    };

    setCart(prev => {
      const existing = prev.find(i => {
          const existingAddons = i.selectedAddons?.map(a => a.id).sort().join(',') || '';
          const newAddons = addons.map(a => a.id).sort().join(',');
          return i.id === cartItem.id && existingAddons === newAddons;
      });

      if (existing) {
          return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, cartItem];
    });
    toast.success("Adicionado à sacola!");
    setIsItemDetailOpen(false);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

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

      const e = { bento: "🍱", user: "👤", phone: "📞", pin: "📍", cart: "🛒", check: "✅", motor: "🛵", money: "💰", card: "💳", rocket: "🚀", time: "🕒", spark: "✨", bill: "💵", calendar: "📅", plus: "➕" };
      const paymentLabel = { 'credit': `${e.card} Crédito`, 'debit': `${e.card} Débito`, 'pix': `${e.spark} Pix`, 'cash': `${e.bill} Dinheiro` }[customerInfo.payment];
      const scheduleInfo = order.scheduledTime ? `\n${e.calendar} *AGENDADO:* ${new Date(order.scheduledTime).toLocaleString('pt-BR')}` : '';

      const itemsMsg = cart.map(i => {
          const addonsMsg = i.selectedAddons?.length ? `\n   ${e.plus} _${i.selectedAddons.map(a => a.name).join(', ')}_` : '';
          return `${e.check} ${i.quantity}x ${i.name} (R$ ${(i.price * i.quantity).toFixed(2)})${addonsMsg}`;
      }).join('\n');

      const message = `*${e.bento} Novo Pedido: ${restaurant.name}*\n\n` +
          `${e.user} *Cliente:* ${order.customerName}\n` +
          `${e.phone} *Fone:* ${order.customerPhone}\n` +
          `${e.pin} *Endereço:* ${order.customerAddress}${scheduleInfo}\n\n` +
          `${e.cart} *Itens do Pedido:*\n${itemsMsg}\n\n` +
          `${e.motor} *Taxa Entrega:* R$ ${deliveryFee.toFixed(2)}` +
          `\n${e.money} *Total Geral:* R$ ${order.total.toFixed(2)}` +
          `\n${e.card} *Pagamento:* ${paymentLabel}${customerInfo.payment === 'cash' && customerInfo.changeFor ? `\n${e.money} *Troco:* R$ ${customerInfo.changeFor}` : ''}\n\n` +
          `${e.time} *Hora:* ${new Date().toLocaleTimeString('pt-BR')}`;

      window.open(`https://api.whatsapp.com/send?phone=${restaurant.phone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`, '_blank');
      setIsOrdersModalOpen(true);
  };

  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => {
      const addonsPrice = item.selectedAddons?.reduce((a, b) => a + b.price, 0) || 0;
      return acc + ((Number(item.price) + addonsPrice) * item.quantity);
  }, 0), [cart]);
  
  const deliveryFee = restaurant?.deliveryFee || 0;
  const cartTotal = cartSubtotal + deliveryFee;

  const filteredItems = useMemo(() => {
    let res = items;
    if (activeCategory) res = res.filter(i => i.categoryId === activeCategory);
    if (searchTerm) res = res.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return res;
  }, [items, activeCategory, searchTerm]);

  const isBebida = useMemo(() => {
    if (!selectedItem) return false;
    const cat = categories.find(c => c.id === selectedItem.categoryId);
    return cat?.name.toLowerCase().includes('bebida');
  }, [selectedItem, categories]);

  if (isLoading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-white p-6 text-center">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="w-28 h-28 bg-white border-4 border-emerald-50 rounded-[40px] flex items-center justify-center shadow-2xl relative z-10 animate-bounce overflow-hidden">
                {restaurant?.logo ? (
                    <img src={restaurant.logo} className="w-full h-full object-cover" alt="Logo" />
                ) : (
                    <Sparkles size={48} className="text-emerald-500" />
                )}
            </div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {restaurant ? `Bem-vindo ao ${restaurant.name}!` : "Bem-vindo!"}
        </h2>
        <p className="text-slate-500 mt-2 font-medium max-w-xs mx-auto">
            Carregando o cardápio... 🍱
        </p>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-32 md:pb-12 font-sans select-none">
      {/* PWA Install Banner */}
      {showInstallBanner && (
          <div className="fixed top-20 left-4 right-4 z-[100] bg-slate-900 text-white p-4 rounded-3xl shadow-2xl animate-in slide-in-from-top duration-700 flex items-center justify-between border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg"><Smartphone size={20} /></div>
                  <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">App {restaurant?.name || 'ZapMenu'}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {isIOS ? 'Adicione à Tela de Início' : 'Instale para pedir mais rápido!'}
                      </p>
                  </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => setShowInstallBanner(false)} className="p-2 text-slate-500"><X size={18} /></button>
                  <button onClick={handleInstallApp} className="bg-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                      {isIOS ? 'Como?' : 'Instalar'}
                  </button>
              </div>
          </div>
      )}

      {/* Hero Header */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-900">
         {coverImages.map((img, idx) => (
             <img key={idx} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentCoverIndex ? 'opacity-100' : 'opacity-0'}`} alt="cover" />
         ))}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
         <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
            <button onClick={onBack} className="p-2.5 bg-white/10 rounded-full text-white backdrop-blur-md active:scale-90 transition-all"><ArrowLeft className="w-5 h-5" /></button>
            <div className="flex gap-2">
                <button onClick={handleInstallApp} className="p-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-full backdrop-blur-md active:scale-90 transition-all flex items-center gap-2 px-4">
                    <Download className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-wider">App</span>
                </button>
                {currentUser && <button onClick={() => setIsOrdersModalOpen(true)} className="p-2.5 bg-white/10 rounded-full text-white backdrop-blur-md active:scale-90 transition-all"><ClipboardList className="w-5 h-5" /></button>}
                {currentUser ? (
                    <button onClick={() => { setCurrentUser(null); localStorage.removeItem('zapmenu_current_user'); }} className="bg-white/10 px-4 py-2 rounded-full text-white text-xs font-bold backdrop-blur-md active:scale-95 transition-all">Sair</button>
                ) : (
                    <button onClick={() => setIsAuthModalOpen(true)} className="bg-emerald-600 px-5 py-2.5 rounded-full text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Entrar</button>
                )}
            </div>
         </div>
         <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <div className="flex items-end gap-4 max-w-4xl mx-auto">
                <img src={restaurant?.logo} className="w-20 h-20 rounded-2xl bg-white p-1 object-cover shadow-2xl" alt="logo" />
                <div className="text-white mb-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-black tracking-tight">{restaurant?.name}</h1>
                        <Badge color={isStoreOpen ? 'bg-emerald-500 text-white border-none' : 'bg-red-500 text-white border-none'}>{isStoreOpen ? 'Aberto' : 'Fechado'}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-y-1 gap-x-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                        <span className="flex items-center"><Star className="w-3 h-3 text-yellow-400 mr-1" /> 4.8</span>
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {restaurant?.openingTime} - {restaurant?.closingTime}</span>
                        {restaurant?.address && (
                            <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {restaurant.address}</span>
                        )}
                    </div>
                </div>
            </div>
         </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-xl border-b border-slate-100 px-4 py-4 space-y-4 shadow-sm">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                    type="text" 
                    placeholder="O que você deseja pedir hoje?" 
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none bg-white shadow-inner font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
            </div>
            
            <div 
                ref={categoryRef} 
                className="flex gap-2.5 overflow-x-auto pb-1 hide-scroll -mx-4 px-4 snap-x"
            >
                {categories.map(cat => (
                    <button 
                        key={cat.id} 
                        data-id={cat.id}
                        onClick={() => setActiveCategory(cat.id)} 
                        className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all snap-center flex-shrink-0 border-2 ${activeCategory === cat.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'bg-white text-slate-500 border-transparent'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>

        <div className="px-4 space-y-8">
            {!isStoreOpen && (
                <div className="bg-red-50 p-4 rounded-3xl border border-red-100 flex items-center gap-4 animate-in slide-in-from-top duration-500">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0"><Clock size={24} /></div>
                    <div>
                        <p className="text-sm font-black text-red-900 leading-tight">Loja Fechada no Momento!</p>
                        <p className="text-xs text-red-700 mt-1">Estamos offline, mas você pode agendar seu pedido para o próximo horário disponível.</p>
                    </div>
                </div>
            )}

            {promotions.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-pink-600" />
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Ofertas em Destaque</h2>
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scroll -mx-4 px-4 snap-x">
                        {promotions.map(promo => (
                            <div key={promo.id} className="min-w-[280px] bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 shrink-0 snap-center active:scale-[0.98] transition-transform">
                                <div className="h-32 bg-slate-100 relative">
                                    {promo.image && <img src={promo.image} className="w-full h-full object-cover" alt={promo.title} />}
                                    <div className="absolute top-3 left-3 bg-pink-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Promoção</div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-slate-800 line-clamp-1">{promo.title}</h3>
                                    <div className="flex justify-between items-center mt-3">
                                        <div>
                                            <span className="text-[10px] text-slate-400 line-through">R$ {Number(promo.originalPrice).toFixed(2)}</span>
                                            <p className="text-xl font-black text-pink-600 leading-tight">R$ {Number(promo.discountedPrice).toFixed(2)}</p>
                                        </div>
                                        <button onClick={() => addToCart(promo)} className="bg-pink-600 text-white px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-90 transition-all shadow-md shadow-pink-100">
                                            Pegar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Utensils className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                        {categories.find(c => c.id === activeCategory)?.name || 'Nossos Produtos'}
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredItems.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => handleOpenItem(item)}
                            className={`bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 transition-all active:scale-[0.98] hover:shadow-md ${!item.available ? 'opacity-50 grayscale' : ''}`}
                        >
                            <div className="w-20 h-20 rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center text-slate-300 shrink-0 border border-slate-50">
                                {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.name} /> : <Utensils className="w-8 h-8" />}
                            </div>
                            <div className="flex flex-col flex-1 justify-between py-0.5">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-base leading-tight">{item.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-medium">{item.description}</p>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="font-black text-base text-emerald-700">R$ {Number(item.price).toFixed(2)}</span>
                                    <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                            <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-400">Nenhum item nesta categoria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-white via-white/90 to-transparent pt-10">
              <button 
                onClick={() => setIsCheckoutOpen(true)} 
                className="w-full max-w-4xl mx-auto bg-slate-900 text-white p-4.5 rounded-[24px] shadow-2xl flex justify-between items-center active:scale-[0.98] transition-all"
              >
                  <div className="flex items-center gap-4">
                      <div className="bg-emerald-500 w-10 h-10 flex items-center justify-center rounded-2xl font-black text-white shadow-lg animate-in zoom-in">{cart.reduce((a,b)=>a+b.quantity,0)}</div>
                      <div className="text-left">
                          <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Total na Sacola</span>
                          <span className="font-black text-lg leading-none">R$ {cartTotal.toFixed(2)}</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-emerald-400">
                      {isStoreOpen ? 'Fechar Pedido' : 'Agendar'} <ChevronRight className="w-4 h-4" />
                  </div>
              </button>
          </div>
      )}

      <Modal isOpen={isItemDetailOpen} onClose={() => setIsItemDetailOpen(false)} title={selectedItem?.name || ''}>
          <div className="flex flex-col h-full max-h-[85vh]">
              <div className="flex-1 overflow-y-auto pr-1 space-y-6 max-h-[450px] mb-4 hide-scroll">
                  <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight">
                          {isBebida ? "Escolha sua Opção" : "Deseja algum Adicional?"}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          {isBebida 
                            ? "Selecione o sabor ou tamanho desejado abaixo para seu refresco." 
                            : "Turbine seu pedido! Selecione os adicionais que você mais gosta."}
                      </p>
                  </div>
                  <div className="space-y-2">
                      {selectedItem?.addons?.map(addon => (
                          <label key={addon.id} className={`flex items-center justify-between px-5 py-4 rounded-3xl border-2 transition-all cursor-pointer active:scale-[0.98] ${tempAddons.find(a => a.id === addon.id) ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-white border-slate-50 text-slate-500 hover:border-slate-100'}`}>
                              <div className="flex items-center gap-4">
                                  <input 
                                    type="checkbox" 
                                    className="w-5 h-5 accent-emerald-600 rounded-lg"
                                    checked={!!tempAddons.find(a => a.id === addon.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) setTempAddons([...tempAddons, addon]);
                                        else setTempAddons(tempAddons.filter(a => a.id !== addon.id));
                                    }}
                                  />
                                  <span className="font-bold text-sm">{addon.name}</span>
                              </div>
                              <span className="text-xs font-black text-emerald-600">+ R$ {addon.price.toFixed(2)}</span>
                          </label>
                      ))}
                      {(!selectedItem?.addons || selectedItem.addons.length === 0) && (
                          <div className="text-center py-6 text-slate-400 text-xs font-medium italic">
                              Este item não possui adicionais disponíveis.
                          </div>
                      )}
                  </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                  <Button className="w-full py-5 bg-emerald-600 shadow-xl shadow-emerald-100 rounded-[22px] font-black uppercase tracking-widest text-xs" onClick={() => selectedItem && addToCart(selectedItem, tempAddons)}>
                      Confirmar e Adicionar <Plus className="w-4 h-4 ml-2" />
                  </Button>
              </div>
          </div>
      </Modal>

      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Minha Sacola">
          <div className="space-y-6">
              {!isStoreOpen && (
                  <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <label className="text-[10px] font-black uppercase text-amber-700 tracking-widest">Horário de Entrega</label>
                      </div>
                      <input 
                        type="datetime-local" 
                        className="w-full bg-white border-2 border-amber-100 rounded-2xl px-4 py-3 outline-none text-sm font-bold focus:ring-2 focus:ring-amber-500/20" 
                        value={customerInfo.scheduledTime} 
                        onChange={e => setCustomerInfo({...customerInfo, scheduledTime: e.target.value})} 
                      />
                  </div>
              )}

              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 hide-scroll">
                  {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-3 px-4 bg-white rounded-3xl border border-slate-50">
                          <div className="flex-1">
                              <div className="flex items-center gap-3">
                                  <span className="font-black text-emerald-600 text-sm">{item.quantity}x</span>
                                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                              </div>
                              {item.selectedAddons?.map(a => (
                                  <p key={a.id} className="text-[10px] text-slate-400 ml-8 font-bold">+ {a.name}</p>
                              ))}
                          </div>
                          <div className="flex items-center gap-4">
                              <span className="text-sm font-black text-slate-900">R$ {((Number(item.price) + (item.selectedAddons?.reduce((a,b)=>a+b.price,0)||0)) * item.quantity).toFixed(2)}</span>
                              <button onClick={() => removeFromCart(idx)} className="p-2 bg-red-50 text-red-400 rounded-xl active:scale-90 transition-all"><X size={16} /></button>
                          </div>
                      </div>
                  ))}
              </div>

              <div className="space-y-3">
                <Input label="Onde Entregar?" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} placeholder="Rua, Número, Complemento" />
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pagamento</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['pix', 'credit', 'debit', 'cash'].map((method) => (
                            <button 
                                key={method}
                                onClick={() => setCustomerInfo({...customerInfo, payment: method as any})}
                                className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${customerInfo.payment === method ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 border-transparent'}`}
                            >
                                {method === 'pix' ? 'Pix' : method === 'credit' ? 'Crédito' : method === 'debit' ? 'Débito' : 'Dinheiro'}
                            </button>
                        ))}
                    </div>
                </div>
                {customerInfo.payment === 'cash' && <Input label="Precisa de troco para quanto?" type="number" value={customerInfo.changeFor} onChange={e => setCustomerInfo({...customerInfo, changeFor: e.target.value})} placeholder="Ex: 50" />}
              </div>

              <div className="bg-slate-900 p-6 rounded-[28px] mt-4 shadow-2xl">
                  <div className="flex justify-between items-center text-white mb-1">
                      <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Subtotal</span>
                      <span className="font-bold">R$ {cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-white mb-4">
                      <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Entrega</span>
                      <span className="font-bold">R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-white border-t border-white/10 pt-4">
                      <span className="text-sm font-black uppercase tracking-widest">Total Geral</span>
                      <span className="text-2xl font-black text-emerald-400">R$ {cartTotal.toFixed(2)}</span>
                  </div>
              </div>

              <Button className="w-full bg-emerald-600 py-5 rounded-[24px] shadow-xl shadow-emerald-100 font-black uppercase tracking-widest text-xs" onClick={checkoutOrder}>
                  <Send className="w-5 h-5 mr-2" /> Enviar para o WhatsApp
              </Button>
          </div>
      </Modal>

      <Modal isOpen={isOrdersModalOpen} onClose={() => setIsOrdersModalOpen(false)} title="Meus Últimos Pedidos">
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 hide-scroll">
              {customerOrders.length > 0 ? customerOrders.map(order => {
                  const status = { 'pending': { label: 'Pendente', color: 'bg-amber-100 text-amber-700' }, 'paid': { label: 'Em Preparo', color: 'bg-emerald-100 text-emerald-700' }, 'shipped': { label: 'Em Caminho', color: 'bg-purple-100 text-purple-700' }, 'completed': { label: 'Entregue', color: 'bg-slate-100 text-slate-700' }, 'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-700' } }[order.status] || { label: order.status, color: 'bg-slate-100' };
                  return (
                      <div key={order.id} className="p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm active:scale-[0.98] transition-all">
                          <div className="flex justify-between items-start mb-3">
                              <div>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pedido</span>
                                  <span className="font-black text-slate-900">#{order.id.slice(-6).toUpperCase()}</span>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status.color}`}>{status.label}</span>
                          </div>
                          <div className="space-y-1.5 py-3 border-y border-slate-50">
                              {order.items.map((item, idx) => (
                                  <div key={idx} className="text-xs text-slate-500 flex justify-between">
                                      <span>{item.quantity}x {item.name}</span>
                                      <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                              ))}
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-1">
                              <span className="text-[10px] font-bold text-slate-400">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                              <span className="font-black text-slate-900">R$ {order.total.toFixed(2)}</span>
                          </div>
                      </div>
                  );
              }) : (
                <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                    <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Você ainda não tem pedidos</p>
                    <p className="text-[10px] text-slate-300 mt-1 font-medium">Seus pedidos aparecerão aqui após confirmados.</p>
                </div>
              )}
          </div>
      </Modal>
      
      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title={authMode === 'login' ? "Bem-vindo de Volta!" : "Crie seu Perfil"}>
          <div className="space-y-5">
              <div className="text-center mb-2">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                      {authMode === 'login' ? <LogIn size={32} /> : <User size={32} />}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{authMode === 'login' ? 'Entre para agilizar seus pedidos' : 'Cadastre-se para uma experiência completa'}</p>
              </div>
              <div className="space-y-4">
                {authMode === 'register' && (
                    <Input label="Nome Completo" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} placeholder="Ex: Maria Silva" />
                )}
                <Input label="WhatsApp (DDD + Número)" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} placeholder="Apenas números" />
                {authMode === 'register' && (
                    <Input label="Endereço de Entrega" value={authForm.address} onChange={e => setAuthForm({...authForm, address: e.target.value})} placeholder="Rua, Número, Bairro" />
                )}
                <Input label="Senha" type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} placeholder="••••••••" />
              </div>
              <Button className="w-full bg-emerald-600 py-5 rounded-[22px] font-black uppercase tracking-widest text-xs" onClick={authMode === 'login' ? handleLogin : handleRegister}>
                  {authMode === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro'}
              </Button>
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
                className="w-full text-center py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-emerald-600 active:scale-95 transition-all"
              >
                  {authMode === 'login' ? 'Ainda não sou cadastrado' : 'Já possuo uma conta'}
              </button>
          </div>
      </Modal>
    </div>
  );
};