import React from 'react';
import { Restaurant } from '../../types';
import { Button, Badge } from '../ui';
import { ExternalLink, ChefHat, Edit2, Trash2, Building2, Key } from 'lucide-react';

interface RestaurantCardProps {
  rest: Restaurant;
  onNavigate: (slug: string) => void;
  onManage: (id: string) => void;
  onEdit: (rest: Restaurant) => void;
  onDelete: (id: string) => void;
  onCreateAccess: (rest: Restaurant) => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ rest, onNavigate, onManage, onEdit, onDelete, onCreateAccess }) => (
  <div className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="h-40 bg-slate-100 overflow-hidden relative">
      <img src={rest.coverImage} alt={rest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
      <div className="absolute bottom-4 right-4">
        <Badge color={rest.isActive ? 'bg-emerald-500 text-white border-transparent shadow-lg' : 'bg-slate-500 text-white'}>
          {rest.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>
    </div>
    <div className="px-6 relative">
      <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white -mt-10 relative z-10">
        <img src={rest.logo} alt="logo" className="w-full h-full object-cover" />
      </div>
    </div>
    <div className="p-6 pt-4">
      <h3 className="text-xl font-bold text-slate-900 mb-1">{rest.name}</h3>
      <p className="text-sm text-slate-500 mb-6 flex items-center font-medium bg-slate-50 py-1 px-3 rounded-lg w-fit">
        <Building2 className="w-3.5 h-3.5 mr-2" /> /{rest.slug}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => onNavigate(rest.slug)}>
          <ExternalLink className="w-4 h-4 mr-2" /> Menu
        </Button>
        <Button variant="secondary" className="px-3" onClick={() => onManage(rest.id)} title="Dashboard">
          <ChefHat className="w-4 h-4 text-slate-600" />
        </Button>
        <Button variant="secondary" className="px-3 bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-600 hover:text-white" onClick={() => onCreateAccess(rest)} title="Criar Acesso">
          <Key className="w-4 h-4" />
        </Button>
        <Button variant="ghost" className="px-3" onClick={() => onEdit(rest)}>
          <Edit2 className="w-4 h-4 text-slate-500" />
        </Button>
        <Button variant="ghost" className="px-3 text-red-500" onClick={() => onDelete(rest.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
);