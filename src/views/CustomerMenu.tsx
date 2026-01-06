import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { CartItem, Category, MenuItem, Restaurant, Order, CustomerUser, Promotion, Giveaway } from '../types';
import { Button, Modal, Input } from '../components/ui';
import { ShoppingBag, Minus, Plus, Search, MapPin, ArrowLeft, Send, Check, Star, Clock, AlertCircle, Banknote, QrCode, Copy, User, LogIn, LogOut, Store, Megaphone, Gift, Calendar, Trophy, X, Package } from 'lucide-react';
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
              setGiveaways(gives.filter(g => g.isActive || g.winnerName));

              const cats = await db.getCategories(r.id);
              if (cats.length > 0) setActiveCategory(cats[0].id);
            }
        } catch (e) {
            console.error("Erro ao carregar cardápio", e);
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
      if (!authForm.phone || !authForm.password) {
          toast.error("Preencha todos os campos.");
          return;
      }
      const user = await db.loginCustomer(authForm.phone, authForm.password);
      if (user) {
          setCurrentUser(user);
          localStorage.setItem('zapmenu_current_user', JSON.stringify(user));
          setCustomerInfo(prev => ({ ...prev, name: user.name, phone: user.phone, address: user.address }));
          setIsAuthModalOpen(false);
          toast.success(`Bem-vindo, ${user.name}!`);
      } else {
          toast.error("Telefone ou senha incorretos.");
      }
  };

  const handleRegister = async () => {
      if (!authForm.name || !authForm.phone || !authForm.password || !authForm.address) {
          toast.error("Preencha todos os campos do cadastro.");
          return;
      }
      const res = await db.registerCustomer({ ...authForm, createdAt: Date.now() } as CustomerUser);
      if (res.success) {
          toast.success("Cadastro realizado! Agora você pode entrar.");
          setAuthMode('login');
      } else {
          toast.error(res.message);
      }
  };

  const addToCart = (item: MenuItem) => {
    if (item.available === false) return;
    
    const currentInCart = cart.find(i => i.id === item.id)?.quantity || 0;
    if (item.stock !== undefined && item.stock !== null && currentInCart >= item.stock) {
        toast.error("Limite do estoque atingido.");
        return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      return existing 
        ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} adicionado!`, { duration: 1000 });
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
          toast.error("Preencha seus dados para entrega.");
          return;
      }
      
      const order: Order = {
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
      
      const message = `*Novo Pedido: ${restaurant.name}*\n\n` +
                      `👤 *Cliente:* ${order.customerName}\n` +
                      `📍 *Endereço:* ${order.customerAddress}\n\n` +
                      `🛒 *Itens:*\n` +
                      cart.map(i => `${i.quantity}x ${i.name}`).join('\n') +
                      `\n\n💰 *Total:* R$ ${order.total.toFixed(2)}\n` +
                      `💳 *Pagamento:* ${customerInfo.payment === 'credit' ? 'Cartão de Crédito' : customerInfo.payment === 'debit' ? 'Cartão de Débito' : customerInfo.payment === 'pix' ? 'Pix' : 'Dinheiro'}`;
                      
      const whatsappUrl = `https://wa.me/${restaurant.phone}?text=${encodeURIComponent(message)}`;
      
      setCart([]);
      setIsCheckoutOpen(false);
      window.open(whatsappUrl, '_blank');
      toast.success("Pedido enviado para o WhatsApp!");
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

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 font-bold">Carregando cardápio...</div>;
  if (!restaurant) return <div className="flex h-screen items-center justify-center text-slate-500">Restaurante não encontrado</div>;

  return (
    <div className="bg-slate-50 min-h-screen pb-32 md:pb-12 font-sans">
      {/* Header with Carousel */}
      <div className="relative h-72 md:h-80 w-full overflow-hidden bg-slate-900">
         {coverImages.map((img, idx) => (
             <img 
                key={idx} 
                src={img} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentCoverIndex ? 'opacity-100' : 'opacity-0'}`} 
                alt="capa" 
             />
         ))}
         
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
         
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
                <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">Olá, {currentUser.name.split(' ')[0]}</span>
                    <button onClick={() => { setCurrentUser(null); localStorage.removeItem('zapmenu_current_user'); }} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md hover:bg-red-500 transition-colors"><LogOut size={16} /></button>
                </div>
            ) : (
                <button onClick={() => setIsAuthModalOpen(true)} className="bg-emerald-600 px-5 py-2.5 rounded-full text-white text-sm font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">ENTRAR</button>
            )}
         </div>
         <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <div className="flex items-end gap-4 max-w-4xl mx-auto">
                <img src={restaurant.logo} className="w-24 h-24 rounded-2xl bg-white p-1 object-cover shadow-lg border border-white/20" alt="logo" />
                <div className="text-white mb-2">
                    <h1 className="text-3xl font-bold tracking-tight">{restaurant.name}</h1>
                    <div className="flex gap-3 text-sm font-medium text-slate-200 mt-1">
                        <span className="flex items-center"><Star className="w-4 h-4 text-yellow-400 mr-1 fill-yellow-400" /> 4.8</span>
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {restaurant.estimatedTime || '30-45 min'}</span>
                    </div>
                </div>
            </div>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8">
        {/* Promotions */}
        {promotions.length > 0 && (
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <Megaphone className="w-5 h-5 text-pink-600" />
                    <h2 className="text-xl font-bold text-slate-900">Ofertas Imperdíveis</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto hide-scroll pb-4 -mx-4 px-4">
                    {promotions.map(promo => (
                        <div 
                            key={promo.id} 
                            onClick={() => setSelectedPromo(promo)}
                            className="min-w-[280px] bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                        >
                            <div className="h-32 bg-slate-100 relative">
                                <img src={promo.image} className="w-full h-full object-cover" />
                                <div className="absolute top-2 left-2 bg-pink-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">OFERTA</div>
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-slate-800 line-clamp-1">{promo.title}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-lg font-black text-pink-600">R$ {Number(promo.discountedPrice).toFixed(2)}</span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart({ id: `promo_${promo.id}`, name: promo.title, price: promo.discountedPrice, image: promo.image || '', available: true } as MenuItem);
                                        }} 
                                        className="bg-pink-50 text-pink-600 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all shadow-sm"
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
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                    <Gift className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl font-bold text-slate-900">Nossos Sorteios</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {giveaways.map(give => (
                        <div 
                            key={give.id} 
                            onClick={() => setSelectedGiveaway(give)}
                            className={`p-4 rounded-2xl shadow-sm border flex gap-4 items-center relative overflow-hidden transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] ${give.winnerName ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-white border-purple-100'}`}
                        >
                            {give.winnerName && (
                                <div className="absolute top-0 right-0 bg-yellow-500 text-white text-[9px] font-black tracking-widest px-3 py-1 rounded-bl-xl z-10 shadow-sm uppercase">
                                    CONCLUÍDO
                                </div>
                            )}
                            <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-black/5">
                                <img src={give.image} className="w-full h-full object-cover" alt={give.title} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-800 text-base line-clamp-1">{give.title}</h3>
                                <p className="text-sm font-bold text-purple-600 mt-0.5 line-clamp-1">Prêmio: {give.prize}</p>
                                
                                {give.winnerName ? (
                                    <div className="mt-2 bg-yellow-200/50 p-2 rounded-lg border border-yellow-300 flex items-center gap-2">
                                        <Trophy className="w-3.5 h-3.5 text-yellow-700" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-yellow-800 font-black uppercase leading-none mb-0.5">VENCEDOR</p>
                                            <p className="text-sm text-slate-900 font-bold truncate leading-tight">{give.winnerName}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center mt-3 text-xs text-slate-500 font-bold bg-slate-50 p-2 rounded-lg w-fit">
                                         <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> 
                                         Data: {new Date(give.drawDate).toLocaleDateString()}
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
                    placeholder="O que você quer comer hoje?" 
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none bg-white shadow-md font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scroll pb-2">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-5 py-2.5 rounded-full text-sm font-black whitespace-nowrap transition-all uppercase tracking-wide ${activeCategory === cat.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/30 transform scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {filteredItems.map(item => {
                const isOutOfStock = item.stock !== undefined && item.stock !== null && item.stock <= 0;
                const isUnavailable = item.available === false;
                const showDisabled = isUnavailable || isOutOfStock;

                return (
                    <div key={item.id} className={`bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 transition-all hover:shadow-md active:scale-[0.99] ${showDisabled ? 'opacity-60 grayscale' : ''}`}>
                        <div className="w-28 h-28 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative border border-slate-100">
                             <img src={item.image} className="w-full h-full object-cover" />
                             {item.stock !== undefined && item.stock !== null && (
                                 <div className={`absolute top-0 right-0 px-2 py-1 text-[9px] font-black rounded-bl-xl ${item.stock === 0 ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}`}>
                                     {item.stock === 0 ? 'ESGOTADO' : `${item.stock} UN`}
                                 </div>
                             )}
                        </div>
                        <div className="flex flex-col flex-1">
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-1">{item.name}</h3>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="font-black text-lg text-emerald-700">R$ {Number(item.price).toFixed(2)}</span>
                                <button 
                                    onClick={() => addToCart(item)} 
                                    disabled={showDisabled} 
                                    className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all active:scale-90 disabled:opacity-50 shadow-md"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
            {filteredItems.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400">
                    Nenhum item encontrado nesta busca.
                </div>
            )}
        </div>
      </div>

      {/* Cart Summary Floating Button */}
      {cart.length > 0 && (
          <div className="fixed bottom-6 left-4 right-4 z-40 max-w-4xl mx-auto animate-in slide-in-from-bottom-10 fade-in duration-500">
              <button onClick={() => setIsCheckoutOpen(true)} className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl shadow-slate-900/40 flex justify-between items-center hover:bg-slate-800 transition-all active:scale-95 group">
                  <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 w-9 h-9 flex items-center justify-center rounded-xl font-black text-white shadow-lg group-hover:scale-110 transition-transform">{cart.reduce((a,b)=>a+b.quantity,0)}</div>
                      <span className="font-bold text-base">Ver minha sacola</span>
                  </div>
                  <span className="font-black text-xl">R$ {cartTotal.toFixed(2)}</span>
              </button>
          </div>
      )}

      {/* Auth Modal */}
      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title={authMode === 'login' ? "Entrar na Conta" : "Criar Nova Conta"}>
          <div className="space-y-4">
              <Input label="Telefone" placeholder="DDD + Número" value={authForm.phone} onChange={(e: any) => setAuthForm({...authForm, phone: e.target.value})} />
              <Input label="Senha" type="password" placeholder="Sua senha secreta" value={authForm.password} onChange={(e: any) => setAuthForm({...authForm, password: e.target.value})} />
              {authMode === 'register' && (
                  <>
                    <Input label="Nome Completo" placeholder="Como quer ser chamado?" value={authForm.name} onChange={(e: any) => setAuthForm({...authForm, name: e.target.value})} />
                    <Input label="Endereço de Entrega" placeholder="Rua, número, bairro..." value={authForm.address} onChange={(e: any) => setAuthForm({...authForm, address: e.target.value})} />
                  </>
              )}
              <Button className="w-full py-4 text-lg" onClick={authMode === 'login' ? handleLogin : handleRegister}>
                  {authMode === 'login' ? 'Acessar Cardápio' : 'Finalizar Cadastro'}
              </Button>
              <button onClick={() => setAuthMode(m => m === 'login' ? 'register' : 'login')} className="w-full text-center text-sm font-bold text-slate-500 mt-2 hover:text-emerald-600 transition-colors">
                  {authMode === 'login' ? 'Ainda não tem conta? Cadastre-se' : 'Já possui conta? Faça o login'}
              </button>
          </div>
      </Modal>

      {/* Checkout Modal */}
      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Finalizar Pedido">
           <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
               <div className="space-y-3">
                   {cart.map(i => (
                       <div key={i.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <div className="flex-1 min-w-0 pr-4">
                               <p className="font-bold text-slate-800 truncate">{i.name}</p>
                               <p className="text-xs text-slate-500">R$ {i.price.toFixed(2)} un.</p>
                           </div>
                           <div className="flex items-center gap-3">
                               <button onClick={() => removeFromCart(i.id)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"><Minus size={14} /></button>
                               <span className="font-black text-slate-700 min-w-[20px] text-center">{i.quantity}</span>
                               <button onClick={() => addToCart(i)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all"><Plus size={14} /></button>
                           </div>
                       </div>
                   ))}
               </div>

               <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-2 shadow-xl">
                   <div className="flex justify-between text-slate-400 text-sm"><span>Subtotal</span><span>R$ {cartSubtotal.toFixed(2)}</span></div>
                   <div className="flex justify-between text-slate-400 text-sm"><span>Taxa de Entrega</span><span>R$ {deliveryFee.toFixed(2)}</span></div>
                   <div className="flex justify-between font-black text-2xl pt-2 border-t border-white/10 mt-2"><span>Total</span><span className="text-emerald-400">R$ {cartTotal.toFixed(2)}</span></div>
               </div>
               
               <div className="space-y-4 pt-4">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs ml-1">Dados de Entrega</h3>
                    <Input label="Seu Nome" placeholder="Ex: João Silva" value={customerInfo.name} onChange={(e: any) => setCustomerInfo({...customerInfo, name: e.target.value})} />
                    <Input label="WhatsApp" placeholder="DDD + Número" value={customerInfo.phone} onChange={(e: any) => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                    <Input label="Endereço Completo" placeholder="Rua, número, complemento..." value={customerInfo.address} onChange={(e: any) => setCustomerInfo({...customerInfo, address: e.target.value})} />
               </div>

               <div className="space-y-4 pt-4">
                   <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs ml-1">Forma de Pagamento</h3>
                   <div className="grid grid-cols-2 gap-2">
                       {[
                           {id: 'pix', label: 'Pix', icon: QrCode},
                           {id: 'cash', label: 'Dinheiro', icon: Banknote},
                           {id: 'credit', label: 'Crédito', icon: Package},
                           {id: 'debit', label: 'Débito', icon: Package}
                       ].map(p => (
                           <button 
                                key={p.id} 
                                onClick={() => setCustomerInfo({...customerInfo, payment: p.id as any})} 
                                className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all ${customerInfo.payment === p.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20 shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                           >
                               <p.icon size={20} className={customerInfo.payment === p.id ? 'text-emerald-600' : 'text-slate-300'} />
                               <span className="font-bold text-xs">{p.label}</span>
                           </button>
                       ))}
                   </div>
                   {customerInfo.payment === 'cash' && (
                       <Input label="Troco para quanto?" placeholder="Ex: 50.00" value={customerInfo.changeFor} onChange={(e: any) => setCustomerInfo({...customerInfo, changeFor: e.target.value})} />
                   )}
               </div>
               
               <Button className="w-full py-5 text-lg font-black mt-6 shadow-2xl shadow-emerald-500/30" onClick={checkoutOrder}>
                   ENVIAR PEDIDO AGORA
               </Button>
               <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pb-4">Seu pedido será enviado via WhatsApp</p>
           </div>
      </Modal>

      {/* Item Detail/Promotion Detail Modal - Already handled by selectedPromo state */}
      <Modal isOpen={!!selectedPromo} onClose={() => setSelectedPromo(null)} title="Detalhes da Oferta">
        {selectedPromo && (
            <div className="space-y-6">
                <div className="w-full h-56 bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner">
                    <img src={selectedPromo.image} className="w-full h-full object-cover" alt={selectedPromo.title} />
                    <div className="absolute top-4 left-4 bg-pink-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                        OFERTA ESPECIAL
                    </div>
                </div>
                
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedPromo.title}</h3>
                    <div className="flex items-end gap-3 mb-4">
                        <span className="text-3xl font-black text-emerald-600">R$ {Number(selectedPromo.discountedPrice).toFixed(2)}</span>
                        {selectedPromo.originalPrice && (
                            <span className="text-lg text-slate-400 line-through mb-1 font-bold">R$ {Number(selectedPromo.originalPrice).toFixed(2)}</span>
                        )}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-slate-600 leading-relaxed text-sm">{selectedPromo.description}</p>
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
                        className="w-full bg-pink-600 hover:bg-pink-700 shadow-xl shadow-pink-500/20 py-4 text-lg font-black"
                    >
                        ADICIONAR À SACOLA
                    </Button>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};