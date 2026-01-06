import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { AdminUser } from '../../types';
import { Button, Card, Input, Modal, Badge } from '../../components/ui';
import { UserPlus, Trash2, Mail, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminsTab: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState<Partial<AdminUser>>({ role: 'support' });

  const fetchData = async () => {
    setIsLoading(true);
    const data = await db.getAdmins();
    setAdmins(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!newAdmin.name || !newAdmin.email) {
      toast.error("Preencha o nome e o e-mail.");
      return;
    }
    await db.addAdmin(newAdmin);
    toast.success("Administrador adicionado!");
    setIsModalOpen(false);
    setNewAdmin({ role: 'support' });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover este administrador? Ele perderá acesso ao painel global.")) {
      await db.deleteAdmin(id);
      toast.success("Administrador removido.");
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Equipe Administrativa</h2>
          <p className="text-xs text-slate-500 mt-0.5">Membros com acesso ao painel de controle do ZapMenu.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Novo Admin
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 font-bold text-xs uppercase">Carregando admins...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {admins.map(admin => (
            <Card key={admin.id} className="p-5 border-slate-100 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                  <User size={20} />
                </div>
                <button onClick={() => handleDelete(admin.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              
              <h3 className="font-bold text-slate-900">{admin.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <Mail size={12} /> {admin.email}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <Badge color={admin.role === 'super_admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                  {admin.role === 'super_admin' ? 'Super Admin' : 'Suporte'}
                </Badge>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(admin.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Administrador">
        <div className="space-y-4">
          <Input 
            label="Nome Completo" 
            placeholder="Ex: Carlos Alberto" 
            value={newAdmin.name || ''} 
            onChange={(e: any) => setNewAdmin({...newAdmin, name: e.target.value})} 
          />
          <Input 
            label="E-mail de Acesso" 
            placeholder="carlos@zapmenu.com" 
            value={newAdmin.email || ''} 
            onChange={(e: any) => setNewAdmin({...newAdmin, email: e.target.value})} 
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Cargo</label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500/10 text-sm font-medium"
              value={newAdmin.role || 'support'}
              onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value as any})}
            >
              <option value="support">Suporte</option>
              <option value="super_admin">Super Administrador</option>
            </select>
          </div>
          <Button className="w-full mt-2" onClick={handleSave}>Criar Acesso</Button>
        </div>
      </Modal>
    </div>
  );
};