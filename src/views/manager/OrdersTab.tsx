import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Order } from '../../types';
import { Card, Badge, Button, Input } from '../../components/ui';
import { OrderReceipt } from '../../components/OrderReceipt';
import { MessageSquare, CheckCircle2, Truck, XCircle, CreditCard, Search, Filter, CheckCheck, Printer } from 'lucide-react';
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
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const getWhatsAppMessage = (order: Order, type: Order['status'] | 'confirm_receipt') => {
    const orderId = order.id.slice(-6).toUpperCase();
    const e_wave = "\uD83D\uDC4B";
    const e_check = "\u2705";
    const e_pin = "\uD83D\uDCCC";
    const e_rocket = "\uD83D\uDE80";
    const e_clock = "\u23F3";
    const e_motor = "\uD83D\uDEF5";
    const e_pray = "\uD83D\uDE4F";
    const e_money = "\uD83D\uDCB0";
    const e_fire = "\uD83D\uDD25";
    const e_wind = "\uD83D\uDCA8";
    const e_party = "\uD83C\uDF89";
    const e_yum = "\uD83D\uDE0B";
    const e_cancel = "\u274C";

    const greeting = `${e_wave} Olá *${order.customerName}*!`;
    const footer = `\n\n${e_pray} Agradecemos a preferência!\n*${restaurantName || 'ZapMenu'}*`;

    if (type === 'confirm_receipt') {
      let msg = `${greeting}\n\n${e_check} *Pedido Recebido!* Confirmamos que recebemos seu pedido *#${orderId}* e já vamos iniciar o preparo.`;
      if (order.paymentMethod === 'pix') {
        msg += `\n\n${e_pin} *Atenção:* Vimos que você optou pelo pagamento via *Pix*. Por favor, *envie o comprovante aqui nesta conversa* para que possamos validar e liberar seu pedido mais rápido! ${e_rocket}`;
      } else {
        msg += `\n\n${e_clock} Fique atento, te avisaremos por aqui assim que ele sair para entrega! ${e_motor}`;
      }
      return msg + footer;
    }

    switch (type) {
      case 'paid':
        return `${greeting}\n${e_money} *Pagamento Confirmado!* Recebemos seu pagamento do pedido *#${orderId}*. Seu pedido já está sendo preparado com muito carinho! ${e_fire}${footer}`;
      case 'shipped':
        return `${greeting}\n${e_motor} *Pedido em Caminho!* Seu pedido *#${orderId}* acabou de sair para entrega. Prepare a mesa, logo chegamos aí! ${e_wind}${footer}`;
      case 'completed':
        return `${greeting}\n${e_party} *Pedido Finalizado!* Seu pedido *#${orderId}* foi entregue com sucesso. Bom apetite e aproveite sua refeição! ${e_yum}${e_yum}${footer}`;
      case 'cancelled':
        return `${greeting}\n${e_cancel} *Pedido Cancelado.* Lamentamos informar, mas seu pedido *#${orderId}* foi cancelado. Se tiver qualquer dúvida, estamos à disposição por aqui.${footer}`;
      default:
        return '';
    }
  };

  const openWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
        window.print();
        setPrintingOrder(null);
    }, 100);
  };

  const handleSendConfirmation = (order: Order) => {
    const message = getWhatsAppMessage(order, 'confirm_receipt');
    openWhatsApp(order.customerPhone, message);
    toast.success("Mensagem de confirmação enviada!");
  };

  const handleUpdateStatus = async (order: Order, status: Order['status']) => {
    try {
      await db.updateOrder({ ...order, status });
      toast.success(`Status atualizado: ${status}`);
      const message = getWhatsAppMessage(order, status);
      if (message) openWhatsApp(order.customerPhone, message);
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
      {/* Hidden container for printing */}
      {printingOrder && (
          <OrderReceipt order={printingOrder} restaurantName={restaurantName || 'ZapMenu'} />
      )}

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
                  <Button size="sm" variant="secondary" onClick={() => handlePrint(order)} className="bg-slate-100 hover:bg-slate-200 text-slate-700">
                      <Printer className="w-4 h-4 mr-1.5" /> Imprimir
                  </Button>
                  {order.status === 'pending' && (
                      <Button size="sm" onClick={() => handleSendConfirmation(order)} className="bg-blue-600">
                          <CheckCheck className="w-4 h-4 mr-1.5" /> Confirmar
                      </Button>
                  )}
                  {order.status === 'pending' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order, 'paid')} className="bg-emerald-600">
                          <CreditCard className="w-4 h-4 mr-1.5" /> Pagar
                      </Button>
                  )}
                  {['pending', 'paid'].includes(order.status) && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order, 'shipped')} className="bg-purple-600">
                          <Truck className="w-4 h-4 mr-1.5" /> Enviar
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
                      window.open(`https://api.whatsapp.com/send?phone=${phone}`, '_blank');
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
      </div>
    </div>
  );
};