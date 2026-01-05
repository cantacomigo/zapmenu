import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { CartItem, Category, MenuItem, Restaurant, Order, CustomerUser, Promotion, Giveaway } from '../types';
import { Button, Modal, Input } from '../components/ui';
import { ShoppingBag, Minus, Plus, Search, MapPin, ArrowLeft, Send, Check, Star, Clock, AlertCircle, Banknote, QrCode, Copy, User, LogIn, LogOut, Store, Megaphone, Gift, Calendar, Trophy, X, Package } from 'lucide-react';

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
  
  // Carousel State
  const [currentCoverIndex, setCurrentCoverIndex] = useState(0);

  // Auth State
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', phone: '', address: '', password: '' });

  // Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ 
      name: '', 
      phone: '', 
      address: '', 
      payment: 'credit', 
      changeFor: '',
      paymentTiming: 'delivery' 
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Detail Modals State
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
        setIsLoading(true);
        try {
            const r = await db.getRestaurantBySlug(slug);
            if (r) {
              setRestaurant(r);
              setCategories(await db.getCategories(r.id));
              setItems(await db.getMenuItems(r.id));
              
              const promos = await db.getPromotions(r.id);
              setPromotions(promos.filter(p => p.isActive));

              const gives = await db.getGiveaways(r.id);
              // Show active raffles OR raffles that have a winner (results)
              setGiveaways(gives.filter(g => g.isActive || g.winnerName));

              const cats = await db.getCategories(r.id);
              if (cats.length > 0) setActiveCategory(cats[0].id);
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
    return [restaurant.coverImage]; // Fallback to single image
  }, [restaurant]);

  // Carousel Logic
  useEffect(() => {
    if (coverImages.length <= 1) return;

    const timer = setInterval(() => {
        setCurrentCoverIndex(prev => (prev + 1) % coverImages.length);
    }, 5000); // Change every 5 seconds

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
      if (res.success) {
          alert("Cadastro realizado! Faça login.");
          setAuthMode('login');
      } else {
          alert(res.message);
      }
  };

  const addToCart = (item: MenuItem) => {
    if (!item.available) return;
    
    // Check Stock
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
      
      const order: Order = {
          // simple ID generation for frontend demo
          id: `ord_${Date.now()}`,
          restaurantId: restaurant.id,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerAddress: customerInfo.address,
          paymentMethod: customerInfo.payment as any,
          paymentDetails: customerInfo.payment === 'cash' && customerInfo.changeFor ? `Troco para ${customerInfo.changeFor}` : undefined,
          items: cart,
          total: cartTotal,
          status: 'pending',
          createdAt: Date.now()
      };

      await db.addOrder(order);
      setCart([]);
      setIsCheckoutOpen(false);
      
      const message = `*Novo Pedido: ${restaurant.name}*\n\n` +
                      `👤 *Cliente:* ${order.customerName}\n` +
                      `📍 *Endereço:* ${order.customerAddress}\n\n` +
                      `🛒 *Itens:*\n` +
                      cart.map(i => `${i.quantity}x ${i.name}`).join('\n') +
                      `\n\n💰 *Total:* R$ ${order.total.toFixed(2)}\n` +
                      `💳 *Pagamento:* ${customerInfo.payment}`;
                      
      const whatsappUrl = `https://wa.me/${restaurant.phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
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
      {/* Header with Carousel */}
      <div className="relative h-72 md:h-80 w-full overflow-hidden bg-slate-900">
         {coverImages.map((img, idx) => (
             <img 
                key={idx} 
                src={img} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentCoverIndex ? 'opacity-100' : 'opacity-0'}`} 
                alt="cover" 
             />
         ))}
         
         {/* Gradient Overlay */}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
         
         {/* Dots Indicator */}
         {coverImages.length > 1 && (
             <div className="absolute bottom-28 right-6 z-20 flex gap-1.5">
                 {coverImages.map((_, idx) => (
                     <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentCoverIndex ? 'bg-white w-3' : 'bg-white/40'}`}
                     />
                 ))}
             </div>
         )}

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
        {/* Promotions */}
        {promotions.length > 0 && (
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Megaphone className="w-5 h-5 text-pink-600" />
                    <h2 className="text-xl font-bold text-slate-900">Ofertas</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto hide-scroll pb-4 -mx-4 px-4">
                    {promotions.map(promo => (
                        <div 
                            key={promo.id} 
                            onClick={() => setSelectedPromo(promo)}
                            className="min-w-[280px] bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-all"
                        >
                            <div className="h-32 bg-slate-100 relative">
                                <img src={promo.image} className="w-full h-full object-cover" />
                                <div className="absolute top-2 left-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">Oferta</div>
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-slate-800">{promo.title}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-lg font-bold text-pink-600">R$ {Number(promo.discountedPrice).toFixed(2)}</span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart({ id: `promo_${promo.id}`, name: promo.title, price: promo.discountedPrice, image: promo.image || '', available: true } as MenuItem);
                                        }} 
                                        className="bg-pink-50 text-pink-600 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Giveaways */}
        {giveaways.length > 0 && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                    <Gift className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl font-bold text-slate-900">Sorteios da Semana</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {giveaways.map(give => (
                        <div 
                            key={give.id} 
                            onClick={() => setSelectedGiveaway(give)}
                            className={`p-4 rounded-2xl shadow-sm border flex gap-4 items-center relative overflow-hidden transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] ${give.winnerName ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300' : 'bg-white border-purple-100'}`}
                        >
                            {give.winnerName && (
                                <div className="absolute top-0 right-0 bg-yellow-500 text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-bl-xl z-10 shadow-sm uppercase">
                                    Finalizado
                                </div>
                            )}
                            <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-black/5">
                                <img src={give.image} className="w-full h-full object-cover" alt={give.title} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-800 text-base line-clamp-1">{give.title}</h3>
                                <p className="text-sm font-bold text-purple-600 mt-1 line-clamp-1">Prêmio: {give.prize}</p>
                                
                                {give.winnerName ? (
                                    <div className="mt-2 bg-yellow-200/50 p-2 rounded-lg border border-yellow-300 flex items-center gap-2">
                                        <div className="bg-yellow-100 p-1.5 rounded-full text-yellow-700 shrink-0">
                                            <Trophy className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-yellow-800 font-bold uppercase tracking-wide leading-none mb-0.5">Ganhador</p>
                                            <p className="text-sm text-slate-900 font-bold truncate leading-tight">{give.winnerName}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center mt-3 text-xs text-slate-500 font-medium bg-slate-50 p-2 rounded-lg w-fit">
                                         <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> 
                                         Sorteio: {new Date(give.drawDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Search & Categories */}
        <div className="sticky top-0 z-30 bg-slate-50 pb-4 pt-2">
            <div className="relative mb-4">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Buscar itens..." 
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none bg-white shadow-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scroll pb-2">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 transform scale-105' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
                <div key={item.id} className={`bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 transition-all hover:shadow-md ${(!item.available || (item.stock !== undefined && item.stock <= 0)) && 'opacity-60 grayscale'}`}>
                    <div className="w-28 h-28 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative">
                         <img src={item.image} className="w-full h-full object-cover" />
                         {/* Stock Status Badge */}
                         {item.stock !== undefined && item.stock !== null && (
                             <div className={`absolute top-0 right-0 px-2 py-1 text-[10px] font-bold rounded-bl-xl ${item.stock === 0 ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}`}>
                                 {item.stock === 0 ? 'ESGOTADO' : `${item.stock} un.`}
                             </div>
                         )}
                    </div>
                    <div className="flex flex-col flex-1">
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                            <span className="font-bold text-lg text-emerald-700">R$ {Number(item.price).toFixed(2)}</span>
                            <button 
                                onClick={() => addToCart(item)} 
                                disabled={!item.available || (item.stock !== undefined && item.stock !== null && item.stock <= 0)} 
                                className="bg-slate-50 text-slate-600 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Cart & Modals */}
      {cart.length > 0 && (
          <div className="fixed bottom-6 left-4 right-4 z-40 max-w-4xl mx-auto animate-in slide-in-from-bottom-10 fade-in duration-500">
              <button onClick={() => setIsCheckoutOpen(true)} className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-900/20 flex justify-between items-center hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-white shadow-sm">{cart.reduce((a,b)=>a+b.quantity,0)}</div>
                      <span className="font-semibold">Ver sacola</span>
                  </div>
                  <span className="font-bold text-xl">R$ {cartTotal.toFixed(2)}</span>
              </button>
          </div>
      )}

      {/* Detail Modals (unchanged) */}
      <Modal isOpen={!!selectedPromo} onClose={() => setSelectedPromo(null)} title="Detalhes da Oferta">
        {selectedPromo && (
            <div className="space-y-6">
                <div className="w-full h-56 bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner">
                    <img src={selectedPromo.image} className="w-full h-full object-cover" alt={selectedPromo.title} />
                    <div className="absolute top-4 left-4 bg-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        Oferta Especial
                    </div>
                </div>
                
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedPromo.title}</h3>
                    <div className="flex items-end gap-3 mb-4">
                        <span className="text-3xl font-bold text-emerald-600">R$ {Number(selectedPromo.discountedPrice).toFixed(2)}</span>
                        {selectedPromo.originalPrice && (
                            <span className="text-lg text-slate-400 line-through mb-1">R$ {Number(selectedPromo.originalPrice).toFixed(2)}</span>
                        )}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-slate-600 leading-relaxed">{selectedPromo.description}</p>
                    </div>
                </div>

                <div className="pt-2">
                    <Button 
                        onClick={() => {
                            addToCart({ 
                                id: `promo_${selectedPromo.id}`, 
                                name: selectedPromo.title, 
                                price: selectedPromo.discountedPrice, 
                                image: selectedPromo.image || '', 
                                available: true 
                            } as MenuItem);
                            setSelectedPromo(null);
                        }} 
                        className="w-full bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-500/20 py-4 text-lg"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Adicionar à Sacola
                    </Button>
                </div>
            </div>
        )}
      </Modal>

      <Modal isOpen={!!selectedGiveaway} onClose={() => setSelectedGiveaway(null)} title="Detalhes do Sorteio">
        {selectedGiveaway && (
            <div className="space-y-6">
                <div className="w-full h-56 bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200">
                    <img src={selectedGiveaway.image} className="w-full h-full object-cover" alt={selectedGiveaway.title} />
                    {selectedGiveaway.winnerName && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-bold text-lg shadow-xl border-4 border-white transform -rotate-6">
                                SORTEIO FINALIZADO
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-900">{selectedGiveaway.title}</h3>
                    <p className="text-purple-600 font-bold text-lg mt-1">Prêmio: {selectedGiveaway.prize}</p>
                </div>

                {selectedGiveaway.winnerName ? (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200 shadow-sm text-center">
                        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                        <p className="text-sm font-bold text-yellow-800 uppercase tracking-wide mb-1">Ganhador(a)</p>
                        <p className="text-2xl font-bold text-slate-900">{selectedGiveaway.winnerName}</p>
                        <p className="text-sm text-slate-500 mt-1">Sorteado em: {selectedGiveaway.drawnAt ? new Date(selectedGiveaway.drawnAt).toLocaleDateString() : '-'}</p>
                    </div>
                ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-purple-600">
                                 <Calendar className="w-5 h-5" />
                             </div>
                             <div>
                                 <p className="text-xs font-bold text-slate-500 uppercase">Data do Sorteio</p>
                                 <p className="text-slate-900 font-bold">{new Date(selectedGiveaway.drawDate).toLocaleDateString()}</p>
                             </div>
                         </div>
                         <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                             Aberto
                         </div>
                    </div>
                )}

                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2">Regras e Descrição</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{selectedGiveaway.description}</p>
                </div>

                <div className="pt-2">
                    <Button variant="secondary" onClick={() => setSelectedGiveaway(null)} className="w-full">
                        Fechar
                    </Button>
                </div>
            </div>
        )}
      </Modal>

      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Identificação">
          <div className="space-y-4">
              <Input placeholder="Telefone" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} />
              <Input type="password" placeholder="Senha" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
              {authMode === 'register' && <Input placeholder="Nome" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />}
              {authMode === 'register' && <Input placeholder="Endereço" value={authForm.address} onChange={e => setAuthForm({...authForm, address: e.target.value})} />}
              <Button className="w-full" onClick={authMode === 'login' ? handleLogin : handleRegister}>{authMode === 'login' ? 'Entrar' : 'Cadastrar'}</Button>
              <button onClick={() => setAuthMode(m => m === 'login' ? 'register' : 'login')} className="w-full text-center text-sm text-slate-500 mt-2">
                  {authMode === 'login' ? 'Criar conta' : 'Já tenho conta'}
              </button>
          </div>
      </Modal>

      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Checkout">
           <div className="space-y-4 max-h-[60vh] overflow-y-auto">
               {cart.map(i => (
                   <div key={i.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                       <div className="font-medium text-slate-700">{i.name} <span className="text-xs text-slate-500 ml-1">x{i.quantity}</span></div>
                       <div className="flex items-center gap-2">
                           <button onClick={() => removeFromCart(i.id)} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500"><Minus className="w-4 h-4" /></button>
                           <button onClick={() => addToCart(i)} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-emerald-600"><Plus className="w-4 h-4" /></button>
                       </div>
                   </div>
               ))}
               <div className="border-t border-slate-100 pt-4 mt-2">
                   <div className="flex justify-between text-slate-500 mb-1"><span>Subtotal</span><span>R$ {cartSubtotal.toFixed(2)}</span></div>
                   <div className="flex justify-between text-slate-500 mb-3"><span>Entrega</span><span>R$ {deliveryFee.toFixed(2)}</span></div>
                   <div className="flex justify-between font-bold text-xl text-slate-900"><span>Total</span><span>R$ {cartTotal.toFixed(2)}</span></div>
               </div>
               
               <div className="space-y-3 pt-2">
                    <Input placeholder="Seu Nome" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                    <Input placeholder="Endereço de Entrega" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
                    <Input placeholder="WhatsApp para Contato" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                    {customerInfo.payment === 'cash' && (
                        <Input placeholder="Troco para quanto?" value={customerInfo.changeFor} onChange={e => setCustomerInfo({...customerInfo, changeFor: e.target.value})} />
                    )}
               </div>

               <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-2">Forma de Pagamento</label>
                   <div className="grid grid-cols-2 gap-2">
                       {['credit', 'debit', 'pix', 'cash'].map(p => (
                           <button key={p} onClick={() => setCustomerInfo({...customerInfo, payment: p as any})} className={`p-3 border rounded-xl font-medium text-sm transition-all ${customerInfo.payment === p ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                               {p === 'credit' ? 'Cartão Crédito' : p === 'debit' ? 'Cartão Débito' : p === 'pix' ? 'Pix' : 'Dinheiro'}
                           </button>
                       ))}
                   </div>
               </div>
               
               <Button className="w-full text-lg py-4 shadow-xl shadow-emerald-500/20" onClick={checkoutOrder}>
                   Confirmar Pedido
               </Button>
           </div>
      </Modal>
    </div>
  );
};