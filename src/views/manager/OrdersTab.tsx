import React from 'react';
import { db } from '../../services/db';
import { Order } from '../../types';
import { Card, Badge, Button } from '../../components/ui';
import { MessageSquare, CheckCircle2, Truck, XCircle, CreditCard, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrdersTabProps {
  orders: Order[];
  onRefresh: () => void;
  restaurantName?: string;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders, onRefresh, restaurantName }) => {
  const getWhatsAppMessage = (order: Order, status: Order['status']) => {
    const orderId = order.id.slice(0, 4).toUpperCase();
    const greeting = `Olá *${order.customerName}*!`;
    const footer = `\n\nAgradecemos a preferência!\n*${restaurantName || 'ZapMenu'}*`;

    switch (status) {
      case 'confirmed':
        return `${greeting}\n✅ *Pedido Aceito!* Seu pedido *#${orderId}* já está sendo preparado com muito carinho pela nossa equipe. 👨‍🍳${footer}`;
      case 'paid':
        return `${greeting}\n💰 *Pagamento Confirmado!* Recebemos seu pagamento do pedido *#${orderId}*. Agora é só aguardar!${footer}`;
      case 'shipped':
        return `${greeting}\n🛵 *Pedido em Caminho!* Seu pedido *#${orderId}* acabou de sair para entrega. Prepare a mesa! 💨${footer}`;
      case 'completed':
        return `${greeting}\n🎉 *Pedido Finalizado!* Seu pedido *#${orderId}* foi entregue com sucesso. Bom apetite! 😋${footer}`;
      case 'cancelled':
        return `${greeting}\n❌ *Pedido Cancelado.* Lamentamos informar, mas seu pedido *#${orderId}* foi cancelado. Por favor, entre em contato se tiver dúvidas.${footer}`;
      default:
        return '';
    }
  };

  const handleUpdateStatus = async (order: Order, status: Order['status']) => {
    try {
      await db.updateOrder({ ...order, status });
      toast.success(`Status atualizado: ${status}`);
      
      const message = getWhatsAppMessage(order, status);
      if (message) {
        const phone = order.customerPhone.replace(/\D/g, '');
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }
      
      onRefresh();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendente', color: 'bg-amber-100 text-amber-700' };
      case 'confirmed': return { label: 'Em Preparo', color: 'bg-blue-100 text-blue-700' };
      case 'paid': return { label: 'Pago', color: 'bg-emerald-100 text-emerald-700' };
      case 'shipped': return { label: 'Em Entrega', color: 'bg-purple-100 text-purple-700' };
      case 'completed': return { label: 'Finalizado', color: 'bg-slate-100 text-slate-700' };
      case 'cancelled': return { label: 'Cancelado', color: 'bg-red-100 text-red-700' };
      default: return { label: status, color: 'bg-slate-100 text-slate-600' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Gestão de Pedidos</h2>
        <Button variant="secondary" size="sm" onClick={onRefresh}>Atualizar</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.map(order => {
          const statusInfo = getStatusDisplay(order.status);
          return (
            <Card key={order.id} className="p-6">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <Badge color={`${statusInfo.color} border-transparent`}>{statusInfo.label}</Badge>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{order.customerName}</p>
                  <p className="text-xs text-slate-500">{order.customerAddress}</p>
                </div>

                <div className="flex-1 lg:border-x border-slate-100 px-0 lg:px-6">
                   <div className="space-y-1">
                      {order.items.map((item, idx) => (
                          <div key={idx} className="text-sm text-slate-600 flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                      ))}
                      <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between font-bold text-slate-900">
                          <span>Total</span>
                          <span>R$ {order.total.toFixed(2)}</span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center justify-end">
                  {order.status === 'pending' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order, 'confirmed')} className="bg-blue-600">
                          <ChefHat className="w-4 h-4 mr-1.5" /> Aceitar
                      </Button>
                  )}
                  {order.status === 'confirmed' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order, 'paid')} className="bg-emerald-600">
                          <CreditCard className="w-4 h-4 mr-1.5" /> Confirmar Pagto
                      </Button>
                  )}
                  {['confirmed', 'paid'].includes(order.status) && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order, 'shipped')} className="bg-purple-600">
                          <Truck className="w-4 h-4 mr-1.5" /> Enviar Entrega
                      </Button>
                  )}
                  {order.status === 'shipped' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order, 'completed')} className="bg-slate-700">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Finalizar
                      </Button>
                  )}
                  {['pending', 'confirmed', 'paid'].includes(order.status) && (
                      <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(order, 'cancelled')}>
                          <XCircle className="w-4 h-4 mr-1.5" /> Cancelar
                      </Button>
                  )}
                  <button 
                    onClick={() => {
                      const phone = order.customerPhone.replace(/\D/g, '');
                      window.open(`https://wa.me/${phone}`, '_blank');
                    }}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                  >
                    <MessageSquare size={18} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
        {orders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400">Nenhum pedido no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};