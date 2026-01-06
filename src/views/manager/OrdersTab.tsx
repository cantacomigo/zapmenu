import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Order } from '../../types';
import { Card, Badge, Button, Input } from '../../components/ui';
import { OrderReceipt } from '../../components/OrderReceipt';
import { MessageSquare, CheckCircle2, Truck, XCircle, CreditCard, Search, Filter, CheckCheck, Printer, Clock, Calendar, RefreshCw, MapPin, ClipboardList, SendHorizontal } from 'lucide-react';
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
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Pedidos</h2>
        <button 
            onClick={onRefresh} 
            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl active:rotate-180 transition-all duration-500 shadow-sm"
        >
            <RefreshCw size={20} />
        </button>
      </div>

      <div className="space-y-3 sticky top-[-1px] z-30 bg-slate-50 pt-1 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scroll -mx-4 px-4 snap-x">
          {(['all', 'pending', 'paid', 'shipped', 'completed', 'cancelled', 'scheduled'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border-2 snap-center ${
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
            <Card key={order.id} className="p-4 border-slate-100 shadow-sm hover:shadow-lg transition-all active:scale-[0.99] rounded-[24px]">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-slate-400 text-[10px] tracking-widest uppercase">#{order.id.slice(-6).toUpperCase()}</span>
                        <Badge color={`${statusInfo.color} border-none text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full`}>{statusInfo.label}</Badge>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight truncate">{order.customerName}</h3>
                  </div>
                  <div className="text-right pl-3">
                    <p className="text-base font-black text-emerald-600 leading-none">R$ {order.total.toFixed(2)}</p>
                    <span className="text-[8px] text-slate-400 font-black mt-1 uppercase bg-slate-50 px-1.5 py-0.5 rounded-md inline-block">
                        {order.paymentMethod === 'pix' ? 'PIX' : order.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Info de Entrega */}
                <div className="bg-slate-50/50 p-2.5 rounded-[18px] border border-slate-100 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed truncate">{order.customerAddress}</p>
                  </div>
                </div>

                {/* Resumo Itens */}
                <div className="flex flex-wrap gap-1">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-[9px] font-bold shadow-sm">
                            <span className="text-emerald-600">{item.quantity}x</span> {item.name.split(' ')[0]}
                        </div>
                    ))}
                </div>

                {/* BOTÕES ESTILO REFERÊNCIA */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50">
                  {/* Imprimir */}
                  <button 
                    onClick={() => handlePrint(order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-900 text-[10px] font-black uppercase tracking-tight shadow-sm active:scale-95 transition-all"
                  >
                    <Printer size={14} /> Imprimir
                  </button>

                  {/* Confirmar */}
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => handleSendConfirmation(order)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-[#059669] text-white rounded-full text-[10px] font-black uppercase tracking-tight shadow-md active:scale-95 transition-all"
                    >
                      <CheckCheck size={14} /> Confirmar
                    </button>
                  )}

                  {/* Pagar */}
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => handleUpdateStatus(order, 'paid')}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0D9488] text-white rounded-full text-[10px] font-black uppercase tracking-tight shadow-md active:scale-95 transition-all"
                    >
                      <CreditCard size={14} /> Pagar
                    </button>
                  )}

                  {/* Enviar */}
                  {order.status === 'paid' && (
                    <button 
                      onClick={() => handleUpdateStatus(order, 'shipped')}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-[#9333EA] text-white rounded-full text-[10px] font-black uppercase tracking-tight shadow-md active:scale-95 transition-all"
                    >
                      <Truck size={14} /> Enviar
                    </button>
                  )}

                  {/* Finalizar */}
                  {order.status === 'shipped' && (
                    <button 
                      onClick={() => handleUpdateStatus(order, 'completed')}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-tight shadow-md active:scale-95 transition-all"
                    >
                      <CheckCircle2 size={14} /> Finalizar
                    </button>
                  )}

                  {/* Spacer para empurrar Cancelar e Chat para a direita ou próxima linha */}
                  <div className="flex-1 min-w-[10px]"></div>

                  {/* Cancelar */}
                  {['pending', 'paid', 'shipped'].includes(order.status) && (
                    <button 
                      onClick={() => handleUpdateStatus(order, 'cancelled')}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-[#FEF2F2] text-[#DC2626] rounded-full text-[10px] font-black uppercase tracking-tight shadow-sm active:scale-95 transition-all"
                    >
                      <XCircle size={14} /> Cancelar
                    </button>
                  )}

                  {/* Chat Icon */}
                  <button 
                    onClick={() => {
                      const phone = order.customerPhone.replace(/\D/g, '');
                      window.open(`https://api.whatsapp.com/send?phone=${phone}`, '_blank');
                    }}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <MessageSquare size={20} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
        
        {filteredOrders.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                <ClipboardList className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhum pedido</p>
            </div>
        )}
      </div>
    </div>
  );
};