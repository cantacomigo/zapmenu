import React, { useState } from 'react';
import { db } from '../../services/db';
import { Category, MenuItem } from '../../types';
import { Button, Card, Input, Modal, ImageUpload } from '../../components/ui';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

interface MenuTabProps {
  restaurantId: string;
  categories: Category[];
  items: MenuItem[];
  onRefresh: () => void;
}

export const MenuTab: React.FC<MenuTabProps> = ({ restaurantId, categories, items, onRefresh }) => {
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({});
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});

  const handleSaveCategory = async () => {
    if (!currentCategory.name) return;
    if (currentCategory.id) {
      await db.updateCategory({ ...currentCategory, restaurantId } as Category);
    } else {
      await db.addCategory({ name: currentCategory.name, restaurantId } as Category);
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
    await db.saveMenuItem({ 
        ...currentItem, 
        restaurantId,
        available: currentItem.available ?? true 
    } as MenuItem);
    toast.success("Item salvo!");
    setIsItemModalOpen(false);
    onRefresh();
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("Excluir este item?")) {
      await db.deleteMenuItem(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Gestão do Cardápio</h2>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setCurrentCategory({}); setIsCategoryModalOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Categoria
            </Button>
            <Button onClick={() => { setCurrentItem({ categoryId: categories[0]?.id }); setIsItemModalOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Novo Item
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {categories.map(cat => (
          <div key={cat.id} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-800">{cat.name}</h3>
                <button onClick={() => { setCurrentCategory(cat); setIsCategoryModalOpen(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.filter(i => i.categoryId === cat.id).map(item => (
                <Card key={item.id} className="p-4 flex gap-4">
                  <img src={item.image} className="w-20 h-20 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                    <p className="text-sm text-emerald-600 font-bold">R$ {Number(item.price).toFixed(2)}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => { setCurrentItem(item); setIsItemModalOpen(true); }} className="text-xs font-bold text-slate-500 hover:text-blue-600">Editar</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-xs font-bold text-slate-500 hover:text-red-600">Excluir</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Categoria">
        <div className="space-y-4">
          <Input label="Nome da Categoria" value={currentCategory.name || ''} onChange={(e: any) => setCurrentCategory({...currentCategory, name: e.target.value})} />
          <Button className="w-full" onClick={handleSaveCategory}>Salvar Categoria</Button>
        </div>
      </Modal>

      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Item do Menu">
        <div className="space-y-4">
          <Input label="Nome do Produto" value={currentItem.name || ''} onChange={(e: any) => setCurrentItem({...currentItem, name: e.target.value})} />
          <Input label="Preço (R$)" type="number" value={currentItem.price || ''} onChange={(e: any) => setCurrentItem({...currentItem, price: Number(e.target.value)})} />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 ml-1">Categoria</label>
            <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={currentItem.categoryId || ''}
                onChange={(e) => setCurrentItem({...currentItem, categoryId: e.target.value})}
            >
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="Descrição" value={currentItem.description || ''} onChange={(e: any) => setCurrentItem({...currentItem, description: e.target.value})} />
          <ImageUpload label="Foto do Produto" value={currentItem.image} onChange={(val: string) => setCurrentItem({...currentItem, image: val})} />
          <Button className="w-full" onClick={handleSaveItem}>Salvar Item</Button>
        </div>
      </Modal>
    </div>
  );
};