import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Category, MenuItem, ProductAddon } from '../../types';
import { Button, Card, Input, Modal } from '../../components/ui';
import { ImageUpload } from '../../components/ImageUpload';
import { Plus, Edit2, Trash2, Tag, Utensils, ChevronRight, Layers, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

interface MenuTabProps {
  restaurantId: string;
  categories: Category[];
  items: MenuItem[];
  onRefresh: () => void;
}

export const MenuTab: React.FC<MenuTabProps> = ({ restaurantId, categories, items, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'items' | 'addons'>('items');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({});
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});
  const [currentAddon, setCurrentAddon] = useState<Partial<ProductAddon>>({});
  
  const [allAddons, setAllAddons] = useState<ProductAddon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab === 'addons' || isItemModalOpen) {
      db.getAddons(restaurantId).then(setAllAddons);
    }
  }, [restaurantId, activeTab, isItemModalOpen]);

  const handleSaveCategory = async () => {
    if (!currentCategory.name) return;
    if (currentCategory.id) {
      await db.updateCategory({ ...currentCategory, restaurantId } as Category);
    } else {
      await db.addCategory({ ...currentCategory, restaurantId });
    }
    toast.success("Categoria salva!");
    setIsCategoryModalOpen(false);
    onRefresh();
  };

  const handleSaveItem = async () => {
    if (!currentItem.name || !currentItem.price || !currentItem.categoryId) {
        toast.error("Preencha os campos obrigatórios");
        return;
    }
    await db.saveMenuItem({ ...currentItem, restaurantId } as MenuItem, selectedAddonIds);
    toast.success("Item salvo!");
    setIsItemModalOpen(false);
    onRefresh();
  };

  const handleSaveAddon = async () => {
    if (!currentAddon.name) return;
    await db.saveAddon({ ...currentAddon, restaurantId, price: currentAddon.price || 0, available: true });
    toast.success("Acréscimo salvo!");
    setIsAddonModalOpen(false);
    db.getAddons(restaurantId).then(setAllAddons);
  };

  const parentCategories = categories.filter(c => !c.parentId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Gestão do Cardápio</h2>
            <div className="flex gap-4 mt-2">
                <button onClick={() => setActiveTab('items')} className={`text-sm font-bold ${activeTab === 'items' ? 'text-emerald-600 border-b-2 border-emerald-600 pb-1' : 'text-slate-400'}`}>Produtos</button>
                <button onClick={() => setActiveTab('addons')} className={`text-sm font-bold ${activeTab === 'addons' ? 'text-emerald-600 border-b-2 border-emerald-600 pb-1' : 'text-slate-400'}`}>Acréscimos/Adicionais</button>
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setCurrentCategory({}); setIsCategoryModalOpen(true); }}>
                <Layers className="w-4 h-4 mr-2" /> Nova Categoria
            </Button>
            {activeTab === 'items' ? (
                <Button onClick={() => { setCurrentItem({ categoryId: categories[0]?.id }); setSelectedAddonIds([]); setIsItemModalOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Novo Produto
                </Button>
            ) : (
                <Button onClick={() => { setCurrentAddon({}); setIsAddonModalOpen(true); }} className="bg-orange-600">
                    <Plus className="w-4 h-4 mr-2" /> Novo Acréscimo
                </Button>
            )}
        </div>
      </div>

      {activeTab === 'items' ? (
        <div className="space-y-10">
          {parentCategories.map(parent => {
              const children = categories.filter(c => c.parentId === parent.id);
              return (
                <div key={parent.id} className="space-y-6">
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                        <div className="flex items-center gap-2">
                            <Tag className="w-6 h-6 text-emerald-600" />
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{parent.name}</h3>
                            <button onClick={() => { setCurrentCategory(parent); setIsCategoryModalOpen(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>

                    {/* Produtos da categoria pai */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.filter(i => i.categoryId === parent.id).map(item => (
                            <Card key={item.id} className="p-4 flex items-center gap-4 group">
                                <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center text-slate-400 border border-slate-100">
                                    {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.name} /> : <Utensils className="w-6 h-6" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                                    <p className="text-sm text-emerald-600 font-black">R$ {Number(item.price).toFixed(2)}</p>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => { setCurrentItem(item); setSelectedAddonIds(item.addons?.map(a => a.id) || []); setIsItemModalOpen(true); }} className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors">Editar</button>
                                        <button onClick={() => db.deleteMenuItem(item.id).then(onRefresh)} className="text-[10px] font-black uppercase text-slate-400 hover:text-red-600 transition-colors">Excluir</button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Subcategorias */}
                    {children.map(child => (
                        <div key={child.id} className="ml-6 space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                <h4 className="font-bold text-slate-600">{child.name}</h4>
                                <button onClick={() => { setCurrentCategory(child); setIsCategoryModalOpen(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-300"><Edit2 className="w-3 h-3" /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {items.filter(i => i.categoryId === child.id).map(item => (
                                    <Card key={item.id} className="p-4 flex items-center gap-4 bg-white/50 border-dashed">
                                        <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center text-slate-300">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.name} /> : <Utensils className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-700 text-sm truncate">{item.name}</h4>
                                            <p className="text-xs text-emerald-600 font-black">R$ {Number(item.price).toFixed(2)}</p>
                                            <button onClick={() => { setCurrentItem(item); setSelectedAddonIds(item.addons?.map(a => a.id) || []); setIsItemModalOpen(true); }} className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 mt-1">Editar</button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
              );
          })}
        </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allAddons.map(addon => (
                  <Card key={addon.id} className="p-5 flex justify-between items-center">
                      <div>
                          <p className="font-bold text-slate-900">{addon.name}</p>
                          <p className="text-sm text-emerald-600 font-black">R$ {addon.price.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => { setCurrentAddon(addon); setIsAddonModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => db.deleteAddon(addon.id).then(() => db.getAddons(restaurantId).then(setAllAddons))} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                      </div>
                  </Card>
              ))}
              {allAddons.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium">Nenhum acréscimo cadastrado.</p>
                  </div>
              )}
          </div>
      )}

      {/* MODAL CATEGORIA */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Categoria">
        <div className="space-y-4">
          <Input label="Nome da Categoria" value={currentCategory.name || ''} onChange={(e: any) => setCurrentCategory({...currentCategory, name: e.target.value})} />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 ml-1">Categoria Pai (Opcional)</label>
            <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={currentCategory.parentId || ''}
                onChange={(e) => setCurrentCategory({...currentCategory, parentId: e.target.value || undefined})}
            >
                <option value="">Nenhuma (Categoria Principal)</option>
                {parentCategories.filter(c => c.id !== currentCategory.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <p className="text-[10px] text-slate-400 ml-1">Use para criar subcategorias como Sucos dentro de Bebidas.</p>
          </div>
          <Button className="w-full" onClick={handleSaveCategory}>Salvar Categoria</Button>
        </div>
      </Modal>

      {/* MODAL ITEM */}
      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Produto">
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
          <div className="space-y-4">
              <Input label="Nome do Produto" value={currentItem.name || ''} onChange={(e: any) => setCurrentItem({...currentItem, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                  <Input label="Preço (R$)" type="number" value={currentItem.price || ''} onChange={(e: any) => setCurrentItem({...currentItem, price: Number(e.target.value)})} />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700 ml-1">Categoria</label>
                    <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        value={currentItem.categoryId || ''}
                        onChange={(e) => setCurrentItem({...currentItem, categoryId: e.target.value})}
                    >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.parentId ? '-- ' : ''}{c.name}</option>)}
                    </select>
                  </div>
              </div>
              <Input label="Descrição" value={currentItem.description || ''} onChange={(e: any) => setCurrentItem({...currentItem, description: e.target.value})} />
              <ImageUpload label="Foto do Produto" value={currentItem.image} onChange={(val) => setCurrentItem({...currentItem, image: val})} />
          </div>

          <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold border-t pt-4">
                  <Coins className="w-4 h-4 text-orange-600" /> Acréscimos Disponíveis
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Selecione o que o cliente pode adicionar</p>
              <div className="grid grid-cols-2 gap-2">
                  {allAddons.map(addon => (
                      <label key={addon.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedAddonIds.includes(addon.id) ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}>
                          <input 
                              type="checkbox" 
                              className="w-4 h-4 accent-orange-600"
                              checked={selectedAddonIds.includes(addon.id)}
                              onChange={(e) => {
                                  if (e.target.checked) setSelectedAddonIds([...selectedAddonIds, addon.id]);
                                  else setSelectedAddonIds(selectedAddonIds.filter(id => id !== addon.id));
                              }}
                          />
                          <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{addon.name}</p>
                              <p className="text-[10px] font-black">+ R$ {addon.price.toFixed(2)}</p>
                          </div>
                      </label>
                  ))}
              </div>
          </div>
          
          <Button className="w-full py-4 bg-emerald-600" onClick={handleSaveItem}>Salvar Produto</Button>
        </div>
      </Modal>

      {/* MODAL ACRÉSCIMO */}
      <Modal isOpen={isAddonModalOpen} onClose={() => setIsAddonModalOpen(false)} title="Novo Acréscimo">
          <div className="space-y-4">
              <Input label="Nome do Adicional" placeholder="Ex: Bacon Extra" value={currentAddon.name || ''} onChange={e => setCurrentAddon({...currentAddon, name: e.target.value})} />
              <Input label="Preço (R$)" type="number" placeholder="0.00" value={currentAddon.price || ''} onChange={e => setCurrentAddon({...currentAddon, price: Number(e.target.value)})} />
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-700">Após criar o acréscimo, você poderá vinculá-lo a um ou mais produtos no cardápio.</p>
              </div>
              <Button className="w-full bg-orange-600" onClick={handleSaveAddon}>Criar Adicional</Button>
          </div>
      </Modal>
    </div>
  );
};