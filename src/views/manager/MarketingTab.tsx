import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Promotion, Giveaway } from '../../types';
import { Button, Card, Input, Modal, ImageUpload } from '../../components/ui';
import { Megaphone, Gift, Plus, Trash2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface MarketingTabProps {
  restaurantId: string;
}

export const MarketingTab: React.FC<MarketingTabProps> = ({ restaurantId }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'promos' | 'giveaways'>('promos');
  
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState<Partial<Promotion>>({});
  
  const [isGiveawayModalOpen, setIsGiveawayModalOpen] = useState(false);
  const [currentGiveaway, setCurrentGiveaway] = useState<Partial<Giveaway>>({});

  const fetchData = async () => {
      setPromotions(await db.getPromotions(restaurantId));
      setGiveaways(await db.getGiveaways(restaurantId));
  };

  useEffect(() => { fetchData(); }, [restaurantId]);

  const handleSavePromo = async () => {
      if (!currentPromo.title || !currentPromo.discountedPrice) return;
      await db.savePromotion({ ...currentPromo, restaurantId, isActive: true } as Promotion);
      toast.success("Promoção salva!");
      setIsPromoModalOpen(false);
      fetchData();
  };

  const handleSaveGiveaway = async () => {
      if (!currentGiveaway.title || !currentGiveaway.prize || !currentGiveaway.drawDate) return;
      await db.saveGiveaway({ ...currentGiveaway, restaurantId, isActive: true } as Giveaway);
      toast.success("Sorteio agendado!");
      setIsGiveawayModalOpen(false);
      fetchData();
  };

  const handleDeletePromo = async (id: string) => {
      if (confirm("Excluir esta promoção?")) {
          await db.deletePromotion(id);
          fetchData();
      }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Marketing e Engajamento</h2>
            <p className="text-slate-500 text-sm">Crie ofertas irresistíveis e sorteios para seus clientes.</p>
        </div>
        <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-xl">
            <button 
                onClick={() => setActiveSubTab('promos')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'promos' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Promoções
            </button>
            <button 
                onClick={() => setActiveSubTab('giveaways')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'giveaways' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Sorteios
            </button>
        </div>
      </div>

      {activeSubTab === 'promos' ? (
          <div className="space-y-6">
              <div className="flex justify-end">
                  <Button onClick={() => { setCurrentPromo({}); setIsPromoModalOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" /> Nova Promoção
                  </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {promotions.map(promo => (
                      <Card key={promo.id} className="overflow-hidden">
                          <img src={promo.image} className="w-full h-32 object-cover" />
                          <div className="p-4">
                              <h3 className="font-bold text-slate-900">{promo.title}</h3>
                              <p className="text-sm text-slate-500 line-clamp-1">{promo.description}</p>
                              <div className="mt-4 flex justify-between items-end">
                                  <div>
                                      <span className="text-xs text-slate-400 line-through">R$ {Number(promo.originalPrice).toFixed(2)}</span>
                                      <p className="text-lg font-black text-pink-600">R$ {Number(promo.discountedPrice).toFixed(2)}</p>
                                  </div>
                                  <button onClick={() => handleDeletePromo(promo.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          </div>
                      </Card>
                  ))}
                  {promotions.length === 0 && <div className="col-span-full py-20 text-center text-slate-400">Nenhuma promoção ativa.</div>}
              </div>
          </div>
      ) : (
          <div className="space-y-6">
               <div className="flex justify-end">
                  <Button onClick={() => { setCurrentGiveaway({}); setIsGiveawayModalOpen(true); }} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" /> Novo Sorteio
                  </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {giveaways.map(give => (
                      <Card key={give.id} className="overflow-hidden border-purple-100">
                          <img src={give.image} className="w-full h-32 object-cover" />
                          <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-bold text-slate-900">{give.title}</h3>
                                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Ativo</span>
                              </div>
                              <p className="text-sm font-bold text-purple-600 mb-4">Prêmio: {give.prize}</p>
                              <div className="flex items-center text-xs text-slate-500">
                                  <Calendar className="w-3.5 h-3.5 mr-1.5" /> Sorteio em: {new Date(give.drawDate).toLocaleDateString()}
                              </div>
                          </div>
                      </Card>
                  ))}
                  {giveaways.length === 0 && <div className="col-span-full py-20 text-center text-slate-400">Nenhum sorteio agendado.</div>}
              </div>
          </div>
      )}

      {/* MODALS */}
      <Modal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} title="Nova Promoção">
          <div className="space-y-4">
              <Input label="Título da Oferta" value={currentPromo.title || ''} onChange={e => setCurrentPromo({...currentPromo, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                  <Input label="Preço Original" type="number" value={currentPromo.originalPrice || ''} onChange={e => setCurrentPromo({...currentPromo, originalPrice: Number(e.target.value)})} />
                  <Input label="Preço com Desconto" type="number" value={currentPromo.discountedPrice || ''} onChange={e => setCurrentPromo({...currentPromo, discountedPrice: Number(e.target.value)})} />
              </div>
              <Input label="Descrição Curta" value={currentPromo.description || ''} onChange={e => setCurrentPromo({...currentPromo, description: e.target.value})} />
              <ImageUpload label="Banner da Oferta" value={currentPromo.image} onChange={val => setCurrentPromo({...currentPromo, image: val})} />
              <Button className="w-full" onClick={handleSavePromo}>Criar Promoção</Button>
          </div>
      </Modal>

      <Modal isOpen={isGiveawayModalOpen} onClose={() => setIsGiveawayModalOpen(false)} title="Agendar Sorteio">
           <div className="space-y-4">
              <Input label="Título do Sorteio" value={currentGiveaway.title || ''} onChange={e => setCurrentGiveaway({...currentGiveaway, title: e.target.value})} />
              <Input label="O que será sorteado?" value={currentGiveaway.prize || ''} onChange={e => setCurrentGiveaway({...currentGiveaway, prize: e.target.value})} />
              <Input label="Data do Sorteio" type="date" value={currentGiveaway.drawDate || ''} onChange={e => setCurrentGiveaway({...currentGiveaway, drawDate: e.target.value})} />
              <ImageUpload label="Imagem do Prêmio" value={currentGiveaway.image} onChange={val => setCurrentGiveaway({...currentGiveaway, image: val})} />
              <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleSaveGiveaway}>Agendar Sorteio</Button>
          </div>
      </Modal>
    </div>
  );
};