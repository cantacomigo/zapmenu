import React from 'react';
import { db } from '../../services/db';
import { Order } from '../../types';
import { Card, Badge, Button } from '../../components/ui';
import toast from 'react-hot-toast';

interface OrdersTabProps {
  orders: Order[];
  onRefresh: () => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders, onRefresh }) => {
  const handleUpdateStatus = async (order: Order, status: Order['status']) => {
    await db.updateOrder({ ...order, status });
    toast.success(`Pedido #${order.id.slice(0, 4)} atualizado!`);
    onRefresh();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Pedidos Recentes</h2>
        <Button variant="secondary" size="sm" onClick={onRefresh}>Atualizar Lista</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.map(order => (
          <Card key={order.id} className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <Badge color={getStatusColor(order.status)}>
                    {order.status === 'pending' ? 'Pendente' : order.status === 'confirmed' ? 'Em Preparo' : order.status === 'completed' ? 'Entregue' : 'Cancelado'}
                  </Badge>
                </div>
                <p className="text-sm font-bold text-slate-700">{order.customerName} • {order.customerPhone}</p>
                <p className="text-sm text-slate-500">{order.customerAddress}</p>
              </div>

              <div className="flex-1 md:border-x border-slate-100 px-0 md:px-6">
                 <p className="text-xs font-bold text-slate-400 uppercase mb-2">Itens do Pedido</p>
                 <div className="space-y-1">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-600 flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                 </div>
              </div>

              <div className="text-right space-y-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
                    <p className="text-2xl font-black text-slate-900">R$ {order.total.toFixed(2)}</p>
                </div>
                <div className="flex gap-2 justify-end">
                    {order.status === 'pending' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(order, 'confirmed')}>Aceitar</Button>
                    )}
                    {order.status === 'confirmed' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(order, 'completed')} className="bg-emerald-600">Finalizar</Button>
                    )}
                    {['pending', 'confirmed'].includes(order.status) && (
                        <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(order, 'cancelled')}>Cancelar</Button>
                    )}
                </div>
              </div>
            </div>
          </Card>
        ))}
        {orders.length === 0 && <div className="text-center py-20 text-slate-400">Nenhum pedido encontrado.</div>}
      </div>
    </div>
  );
};