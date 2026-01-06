import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Promotion, Giveaway, Order } from '../../types';
import { Button, Card, Input, Modal, ImageUpload } from '../../components/ui';
import { Megaphone, Gift, Plus, Trash2, Calendar, Trophy, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface MarketingTabProps {
  restaurantId: string;
}

export const MarketingTab: React.FC<MarketingTabProps> = ({ restaurantId }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'promos' | 'giveaways'>('promos');
  
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState<Partial<Promotion>>({});
  
  const [isGiveawayModalOpen, setIsGiveawayModalOpen] = useState(false);
  const [currentGiveaway, setCurrentGiveaway] = useState<Partial<Giveaway>>({});

  const fetchData = async () => {
      setPromotions(await db.getPromotions(restaurantId));
      setGiveaways(await db.getGiveaways(restaurantId));
      setOrders(await db.getOrders(restaurantId));
  };

  useEffect(() => { fetchData(); }, [restaurantId]);

  const handleSavePromo = async () => {
      if (!currentPromo.title || !currentPromo.discountedPrice) {
          toast.error("Preencha título e preço promocional.");
          return;
      }
      await db.savePromotion({ ...currentPromo, restaurantId, isActive: true } as Promotion);
      toast.success("Promoção salva!");
      setIsPromoModalOpen(false);
      fetchData();
  };

  const handleSaveGiveaway = async () => {
      if (!currentGiveaway.title || !currentGiveaway.prize || !currentGiveaway.drawDate) {
          toast.error("Preencha título, prêmio e data.");
          return;
      }
      await db.saveGiveaway({ ...currentGiveaway, restaurantId, isActive: true } as Giveaway);
      toast.success("Sorteio agendado!");
      setIsGiveawayModalOpen(false);
      fetchData();
  };

  const handleDeletePromo = async (id: string) => {
      if (confirm("Excluir esta promoção?")) {
          await db.deletePromotion(id);
          toast.success("Promoção excluída.");
          fetchData();
      }
  };

  const handleDeleteGiveaway = async (id: string) => {
      if (confirm("Excluir este sorteio?")) {
          await db.deleteGiveaway(id);
          toast.success("Sorteio excluído.");
          fetchData();
      }
  };

  const handleDrawWinner = async (give: Giveaway) => {
      if (orders.length === 0) {
          toast.error("Ainda não há clientes que fizeram pedidos para sortear.");
          return;
      }
      
      // Filtra clientes únicos baseados no telefone com tipagem explícita no Map
      const uniqueCustomers: { name: string; phone: string }[] = Array.from(
        new Map<string, { name: string; phone: string }>(
          orders.map(o => [o.customerPhone, { name: o.customerName, phone: o.customerPhone }])
        ).values()
      );
      
      if (uniqueCustomers.length === 0) {
          toast.error("Nenhum cliente elegível encontrado.");
          return;
      }

      if (!confirm(`Deseja realizar o sorteio agora entre os ${uniqueCustomers.length} clientes da loja?`)) return;

      const winner = uniqueCustomers[Math.floor(Math.random() * uniqueCustomers.length)];
      
      const updatedGiveaway: Giveaway = {
          ...give,
          winnerName: winner.name,
          winnerPhone: winner.phone,
          isActive: false,
          drawnAt: Date.now()
      };

      await db.saveGiveaway(updatedGiveaway);
      toast.success(`🎉 Sorteio realizado! Ganhador: ${winner.name}`);
      fetchData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Marketing e Fidelidade</h2>
            <p className="text-slate-500 text-sm mt-1">Crie ofertas irresistíveis e sorteios para seus clientes.</p>
        </div>
        <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <button 
                onClick={() => setActiveSubTab('promos')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeSubTab === 'promos' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
                Promoções
            </button>
            <button 
                onClick={() => setActiveSubTab('giveaways')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeSubTab === 'giveaways' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
                Sorteios
            </button>
        </div>
      </div>

      {activeSubTab === 'promos' ? (
          <div className="space-y-6">
              <div className="flex justify-end">
                  <Button onClick={() => { setCurrentPromo({}); setIsPromoModalOpen(true); }} className="bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-100 border-none">
                      <Plus className="w-4 h-4 mr-2" /> Criar Promoção
                  </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {promotions.map(promo => (
                      <Card key={promo.id} className="overflow-hidden group hover:shadow-xl transition-all border-pink-50">
                          <div className="relative h-40 overflow-hidden bg-slate-100">
                              {promo.image ? (
                                  <img src={promo.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={promo.title} />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300"><Megaphone size={40} /></div>
                              )}
                              <div className="absolute top-3 left-3">
                                  <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Oferta Ativa</span>
                              </div>
                          </div>
                          <div className="p-5">
                              <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{promo.title}</h3>
                              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed h-10 mb-4">{promo.description}</p>
                              <div className="flex justify-between items-end">
                                  <div>
                                      {promo.originalPrice && <span className="text-xs text-slate-400 line-through">De R$ {Number(promo.originalPrice).toFixed(2)}</span>}
                                      <p className="text-2xl font-black text-pink-600">R$ {Number(promo.discountedPrice).toFixed(2)}</p>
                                  </div>
                                  <button onClick={() => handleDeletePromo(promo.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                                      <Trash2 className="w-5 h-5" />
                                  </button>
                              </div>
                          </div>
                      </Card>
                  ))}
                  {promotions.length === 0 && (
                      <div className="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                          <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"><Megaphone size={32} /></div>
                          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma promoção ativa</p>
                      </div>
                  )}
              </div>
          </div>
      ) : (
          <div className="space-y-6">
               <div className="flex justify-end">
                  <Button onClick={() => { setCurrentGiveaway({}); setIsGiveawayModalOpen(true); }} className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100 border-none">
                      <Plus className="w-4 h-4 mr-2" /> Agendar Sorteio
                  </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {giveaways.map(give => (
                      <Card key={give.id} className={`overflow-hidden transition-all hover:shadow-xl ${give.winnerName ? 'border-emerald-100 opacity-90' : 'border-purple-100'}`}>
                          <div className="relative h-40 overflow-hidden bg-slate-100">
                              {give.image ? (
                                  <img src={give.image} className="w-full h-full object-cover" alt={give.title} />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300"><Gift size={40} /></div>
                              )}
                              <div className="absolute top-3 left-3">
                                  {give.winnerName ? (
                                      <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Finalizado</span>
                                  ) : (
                                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Em Aberto</span>
                                  )}
                              </div>
                          </div>
                          <div className="p-5">
                              <h3 className="font-bold text-slate-900 text-lg mb-1">{give.title}</h3>
                              <p className="text-sm font-bold text-purple-600 mb-4 bg-purple-50 px-3 py-1.5 rounded-lg w-fit">Prêmio: {give.prize}</p>
                              
                              {give.winnerName ? (
                                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-4">
                                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Trophy size={12} /> Ganhador Oficial</p>
                                      <p className="text-lg font-black text-slate-900">{give.winnerName}</p>
                                      <p className="text-xs text-slate-500">{give.winnerPhone}</p>
                                  </div>
                              ) : (
                                  <div className="flex items-center text-xs text-slate-500 mb-6 bg-slate-50 p-3 rounded-xl">
                                      <Calendar className="w-4 h-4 mr-2 text-slate-400" /> Sorteio em: <span className="font-bold text-slate-700 ml-1">{new Date(give.drawDate).toLocaleDateString('pt-BR')}</span>
                                  </div>
                              )}

                              <div className="flex gap-2">
                                  {!give.winnerName && (
                                      <Button onClick={() => handleDrawWinner(give)} className="flex-1 bg-purple-600 text-[10px] font-black uppercase tracking-widest py-3">
                                          Realizar Sorteio
                                      </Button>
                                  )}
                                  <button onClick={() => handleDeleteGiveaway(give.id)} className="p-3 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                                      <Trash2 className="w-5 h-5" />
                                  </button>
                              </div>
                          </div>
                      </Card>
                  ))}
                  {giveaways.length === 0 && (
                      <div className="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                          <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"><Gift size={32} /></div>
                          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum sorteio agendado</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* MODALS */}
      <Modal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} title="Nova Promoção">
          <div className="space-y-4">
              <Input label="Título da Oferta" placeholder="Ex: Combo Família" value={currentPromo.title || ''} onChange={e => setCurrentPromo({...currentPromo, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                  <Input label="Preço Original (R$)" type="number" value={currentPromo.originalPrice || ''} onChange={e => setCurrentPromo({...currentPromo, originalPrice: Number(e.target.value)})} />
                  <Input label="Preço com Desconto (R$)" type="number" value={currentPromo.discountedPrice || ''} onChange={e => setCurrentPromo({...currentPromo, discountedPrice: Number(e.target.value)})} />
              </div>
              <Input label="Descrição Curta" placeholder="Detalhes do que vem no combo..." value={currentPromo.description || ''} onChange={e => setCurrentPromo({...currentPromo, description: e.target.value})} />
              <ImageUpload label="Banner da Oferta" value={currentPromo.image} onChange={val => setCurrentPromo({...currentPromo, image: val})} />
              <Button className="w-full bg-pink-600 hover:bg-pink-700 py-4 mt-2 font-black uppercase tracking-widest text-xs" onClick={handleSavePromo}>Salvar Promoção</Button>
          </div>
      </Modal>

      <Modal isOpen={isGiveawayModalOpen} onClose={() => setIsGiveawayModalOpen(false)} title="Agendar Novo Sorteio">
           <div className="space-y-4">
              <Input label="Título do Sorteio" placeholder="Ex: Sorteio de Natal" value={currentGiveaway.title || ''} onChange={e => setCurrentGiveaway({...currentGiveaway, title: e.target.value})} />
              <Input label="O que será sorteado?" placeholder="Ex: 1 Vale-Compras de R$ 100,00" value={currentGiveaway.prize || ''} onChange={e => setCurrentGiveaway({...currentGiveaway, prize: e.target.value})} />
              <Input label="Data do Sorteio" type="date" value={currentGiveaway.drawDate || ''} onChange={e => setCurrentGiveaway({...currentGiveaway, drawDate: e.target.value})} />
              <Input label="Regras (Opcional)" placeholder="Ex: Válido para pedidos acima de R$ 50" value={currentGiveaway.description || ''} onChange={e => setCurrentGiveaway({...currentGiveaway, description: e.target.value})} />
              <ImageUpload label="Imagem do Prêmio" value={currentGiveaway.image} onChange={val => setCurrentGiveaway({...currentGiveaway, image: val})} />
              <Button className="w-full bg-purple-600 hover:bg-purple-700 py-4 mt-2 font-black uppercase tracking-widest text-xs" onClick={handleSaveGiveaway}>Agendar Sorteio</Button>
          </div>
      </Modal>
    </div>
  );
};