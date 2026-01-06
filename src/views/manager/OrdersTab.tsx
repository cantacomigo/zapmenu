import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Order } from '../../types';
import { Card, Badge, Button, Input } from '../../components/ui';
import { MessageSquare, CheckCircle2, Truck, XCircle, CreditCard, Search, Filter, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrdersTabProps {
  orders: Order[];
  onRefresh: () => void;
  restaurantName?: string;
}

type StatusFilter = 'all' | Order['status'];

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders, onRefresh, restaurantName }) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getWhatsAppMessage = (order: Order, type: Order['status'] | 'confirm_receipt') => {
    const orderId = order.id.slice(-6).toUpperCase();
    const greeting = `👋 Olá *${order.customerName}*!`;
    const footer = `\n\n🙏 Agradecemos a preferência!\n*${restaurantName || 'ZapMenu'}*`;

    if (type === 'confirm_receipt') {
      let msg = `${greeting}\n\n✅ *Pedido Recebido!* Confirmamos que recebemos seu pedido *#${orderId}* e já vamos iniciar o preparo.`;
      
      if (order.paymentMethod === 'pix') {
        msg += `\n\n📌 *Atenção:* Vimos que você optou pelo pagamento via *Pix*. Por favor, *envie o comprovante aqui nesta conversa* para que possamos validar e liberar seu pedido mais rápido! 🚀`;
      } else {
        msg += `\n\n⏳ Fique atento, te avisaremos por aqui assim que ele sair para entrega! 🛵`;
      }
      
      return msg + footer;
    }

    switch (type) {
      case 'paid':
        return `${greeting}\n💰 *Pagamento Confirmado!* Recebemos seu pagamento do pedido *#${orderId}*. Seu pedido já está sendo preparado com muito carinho! 🔥${footer}`;
      case 'shipped':
        return `${greeting}\n🛵 *Pedido em Caminho!* Seu pedido *#${orderId}* acabou de sair para entrega. Prepare a mesa, logo chegamos aí! 💨${footer}`;
      case 'completed':
        return `${greeting}\n🎉 *Pedido Finalizado!* Seu pedido *#${orderId}* foi entregue com sucesso. Bom apetite e aproveite sua refeição! 😋😋${footer}`;
      case 'cancelled':
        return `${greeting}\n❌ *Pedido Cancelado.* Lamentamos informar, mas seu pedido *#${orderId}* foi cancelado. Se tiver qualquer dúvida, estamos à disposição por aqui.${footer}`;
      default:
        return '';
    }
  };

  const handleSendConfirmation = (order: Order) => {
    const message = getWhatsAppMessage(order, 'confirm_receipt');
    const phone = order.customerPhone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success("Mensagem de confirmação enviada!");
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
      case 'paid': return { label: 'Pago', color: 'bg-emerald-100 text-emerald-700' };
      case 'shipped': return { label: 'Em Entrega', color: 'bg-purple-100 text-purple-700' };
      case 'completed': return { label: 'Finalizado', color: 'bg-slate-100 text-slate-700' };
      case 'cancelled': return { label: 'Cancelado', color: 'bg-red-100 text-red-700' };
      default: return { label: status, color: 'bg-slate-100 text-slate-600' };
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Gestão de Pedidos</h2>
        <Button variant="secondary" size="sm" onClick={onRefresh}>Atualizar Pedidos</Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou ID do pedido..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scroll">
          {(['all', 'pending', 'paid', 'shipped', 'completed', 'cancelled'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                statusFilter === status 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status === 'all' ? 'Todos' : getStatusDisplay(status).label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.map(order => {
          const statusInfo = getStatusDisplay(order.status);
          return (
            <Card key={order.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900">#{order.id.slice(-8).toUpperCase()}</span>
                    <Badge color={`${statusInfo.color} border-transparent text-[10px] font-bold uppercase`}>{statusInfo.label}</Badge>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{order.customerName}</p>
                  <p className="text-xs text-slate-500 max-w-xs">{order.customerAddress}</p>
                  <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${order.paymentMethod === 'pix' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                          {order.paymentMethod}
                      </span>
                  </div>
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
                      <Button size="sm" onClick={() => handleSendConfirmation(order)} className="bg-blue-600">
                          <CheckCheck className="w-4 h-4 mr-1.5" /> Confirmar Recebimento
                      </Button>
                  )}
                  {order.status === 'pending' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order, 'paid')} className="bg-emerald-600">
                          <CreditCard className="w-4 h-4 mr-1.5" /> Confirmar Pagto
                      </Button>
                  )}
                  {['pending', 'paid'].includes(order.status) && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order, 'shipped')} className="bg-purple-600">
                          <Truck className="w-4 h-4 mr-1.5" /> Enviar Entrega
                      </Button>
                  )}
                  {order.status === 'shipped' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order, 'completed')} className="bg-slate-700">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Finalizar
                      </Button>
                  )}
                  {['pending', 'paid'].includes(order.status) && (
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
                    title="Conversar no WhatsApp"
                  >
                    <MessageSquare size={18} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
        {filteredOrders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Filter size={32} />
            </div>
            <p className="text-slate-400 font-medium">Nenhum pedido encontrado com os filtros atuais.</p>
          </div>
        )}
      </div>
    </div>
  );
};