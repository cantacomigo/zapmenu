import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Order } from '../../types';
import { Card, Badge, Button, Input } from '../../components/ui';
import { OrderReceipt } from '../../components/OrderReceipt';
import { MessageSquare, CheckCircle2, Truck, XCircle, CreditCard, Search, Filter, CheckCheck, Printer, Clock, Calendar, RefreshCw, MapPin, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrdersTabProps {
  orders: Order[];
  onRefresh: () => void;
  restaurantName?: string;
  restaurantLogo?: string;
}

type StatusFilter = 'all' | Order['status'] | 'scheduled';

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders, onRefresh, restaurantName, restaurantLogo }) => {
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
      case 'shipped': return { label: 'Enviado', color: 'bg-purple-100 text-purple-700' };
      case 'completed': return { label: 'Finalizado', color: 'bg-slate-100 text-slate-700' };
      case 'cancelled': return { label: 'Cancelado', color: 'bg-red-100 text-red-700' };
      case 'scheduled': return { label: 'Agendados', color: 'bg-blue-100 text-blue-700' };
      default: return { label: status, color: 'bg-slate-100 text-slate-600' };
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'scheduled' ? !!order.scheduledTime : order.status === statusFilter);
      
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hidden container for printing */}
      {printingOrder && (
          <OrderReceipt 
            order={printingOrder} 
            restaurantName={restaurantName || 'ZapMenu'} 
            restaurantLogo={restaurantLogo}
          />
      )}

      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Gestão de Pedidos</h2>
        <button 
            onClick={onRefresh} 
            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl active:rotate-180 transition-all duration-500"
        >
            <RefreshCw size={20} />
        </button>
      </div>

      <div className="space-y-3 sticky top-[-1px] z-30 bg-slate-50 pt-1 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar cliente..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scroll -mx-4 px-4">
          {(['all', 'pending', 'paid', 'shipped', 'completed', 'cancelled', 'scheduled'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border-2 ${
                statusFilter === status 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                  : 'bg-white text-slate-500 border-transparent shadow-sm hover:bg-slate-50'
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
            <Card key={order.id} className="p-4 md:p-6 border-slate-100 hover:shadow-lg transition-all active:scale-[0.99]">
              <div className="flex flex-col gap-4">
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">#{order.id.slice(-6).toUpperCase()}</span>
                        <Badge color={`${statusInfo.color} border-none text-[9px] font-black uppercase tracking-tighter`}>{statusInfo.label}</Badge>
                    </div>
                    <h3 className="text-base font-black text-slate-800 leading-tight">{order.customerName}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-700 leading-none">R$ {order.total.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                        {order.paymentMethod === 'pix' ? '✨ Pix' : `💳 ${order.paymentMethod}`}
                    </p>
                  </div>
                </div>

                {/* Info de Entrega/Agendamento */}
                <div className="bg-slate-50 p-3 rounded-2xl space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{order.customerAddress}</p>
                  </div>
                  {order.scheduledTime && (
                      <div className="flex items-center gap-2 py-1.5 px-3 bg-blue-50 rounded-xl border border-blue-100 w-fit">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-[10px] font-black text-blue-700 uppercase">Para: {new Date(order.scheduledTime).toLocaleString('pt-BR')}</span>
                      </div>
                  )}
                </div>

                {/* Itens (Resumo Mobile) */}
                <div className="px-1">
                   <div className="flex flex-wrap gap-1.5">
                      {order.items.map((item, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                              {item.quantity}x {item.name.split(' ')[0]}...
                          </span>
                      ))}
                   </div>
                </div>

                {/* Botões de Ação Otimizados */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 pt-2 border-t border-slate-50">
                  <Button size="sm" variant="secondary" onClick={() => handlePrint(order)} className="bg-slate-100 border-none text-[10px] font-black uppercase tracking-widest py-3">
                      <Printer className="w-3.5 h-3.5 mr-1.5" /> Recibo
                  </Button>
                  
                  {order.status === 'pending' && (
                      <Button size="sm" onClick={() => handleSendConfirmation(order)} className="bg-blue-600 border-none text-[10px] font-black uppercase tracking-widest py-3">
                          <CheckCheck className="w-3.5 h-3.5 mr-1.5" /> Confirmar
                      </Button>
                  )}
                  
                  {order.status === 'pending' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order, 'paid')} className="bg-emerald-600 border-none text-[10px] font-black uppercase tracking-widest py-3">
                          <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Pago
                      </Button>
                  )}
                  
                  {['pending', 'paid'].includes(order.status) && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order, 'shipped')} className="bg-purple-600 border-none text-[10px] font-black uppercase tracking-widest py-3">
                          <Truck className="w-3.5 h-3.5 mr-1.5" /> Enviar
                      </Button>
                  )}
                  
                  {order.status === 'shipped' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order, 'completed')} className="bg-slate-800 border-none text-[10px] font-black uppercase tracking-widest py-3">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Finalizar
                      </Button>
                  )}

                  <button 
                    onClick={() => {
                      const phone = order.customerPhone.replace(/\D/g, '');
                      window.open(`https://api.whatsapp.com/send?phone=${phone}`, '_blank');
                    }}
                    className="flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all active:scale-90"
                  >
                    <MessageSquare size={18} />
                  </button>

                  {['pending', 'paid'].includes(order.status) && (
                      <button 
                        onClick={() => handleUpdateStatus(order, 'cancelled')}
                        className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <XCircle size={18} />
                      </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        
        {filteredOrders.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                <ClipboardList className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nenhum pedido encontrado</p>
            </div>
        )}
      </div>
    </div>
  );
};