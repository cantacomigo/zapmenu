import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Order } from '../../types';
import { Card, Badge, Button, Input } from '../../components/ui';
import { OrderReceipt } from '../../components/OrderReceipt';
import { MessageSquare, CheckCircle2, Truck, XCircle, CreditCard, Search, Filter, CheckCheck, Printer, Clock, Calendar, RefreshCw, MapPin, ClipboardList, SendHorizontal, BellRing } from 'lucide-react';
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
    
    // Simplificando a lógica de impressão para evitar problemas de carregamento de imagem
    // A imagem deve ser carregada pelo navegador antes de chamar a impressão.
    setTimeout(() => {
        window.print();
        setPrintingOrder(null);
    }, 300); 
  };

  const handleSendAction = async (order: Order, type: Order['status'] | 'confirm_receipt') => {
    // Se for um status do banco, atualiza. Se for só mensagem (confirm_receipt), não muda o status.
    if (type !== 'confirm_receipt') {
        try {
            await db.updateOrder({ ...order, status: type as any });
            onRefresh();
        } catch (error) {
            toast.error("Erro ao atualizar banco de dados");
        }
    }
    
    const message = getWhatsAppMessage(order, type);
    if (message) openWhatsApp(order.customerPhone, message);
    toast.success("Ação realizada com sucesso!");
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendente', color: 'bg-amber-100 text-amber-700' };
      case 'paid': return { label: 'Em Preparo', color: 'bg-emerald-100 text-emerald-700' };
      case 'shipped': return { label: 'Saiu p/ Entrega', color: 'bg-purple-100 text-purple-700' };
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
      {printingOrder && (
          <OrderReceipt 
            order={printingOrder} 
            restaurantName={restaurantName || 'ZapMenu'} 
            restaurantLogo={restaurantLogo} 
          />
      )}

      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Pedidos</h2>
        <button onClick={onRefresh} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl active:rotate-180 transition-all duration-500 shadow-sm">
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
                statusFilter === status ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-transparent shadow-sm hover:bg-slate-50'
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
            <Card key={order.id} className="p-5 border-slate-100 shadow-sm hover:shadow-lg transition-all rounded-[32px]">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-slate-400 text-[10px] tracking-widest uppercase">#{order.id.slice(-6).toUpperCase()}</span>
                        <Badge color={`${statusInfo.color} border-none text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full`}>{statusInfo.label}</Badge>
                    </div>
                    <h3 className="text-base font-black text-slate-900 truncate">{order.customerName}</h3>
                  </div>
                  <div className="text-right pl-3">
                    <p className="text-lg font-black text-emerald-600 leading-none">R$ {order.total.toFixed(2)}</p>
                    <span className="text-[9px] text-slate-400 font-black mt-1 uppercase bg-slate-50 px-2 py-0.5 rounded-lg inline-block">
                        {order.paymentMethod === 'pix' ? 'PIX' : order.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-[20px] border border-slate-100 space-y-2">
                    <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{order.customerAddress}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100/50">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="bg-white border border-slate-100 text-slate-600 px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-sm">
                                <span className="text-emerald-600">{item.quantity}x</span> {item.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* BOTÕES DE MENSAGENS E STATUS */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                        <BellRing className="w-3 h-3 text-slate-300" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enviar Mensagem e Atualizar Status</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button 
                            onClick={() => handleSendAction(order, 'confirm_receipt')}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-tight hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-600 transition-all active:scale-95"
                        >
                            <CheckCheck size={14} /> Aceito
                        </button>
                        <button 
                            onClick={() => handleSendAction(order, 'paid')}
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-95 ${order.status === 'paid' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white border-2 border-slate-100 text-slate-700'}`}
                        >
                            <CreditCard size={14} /> Pago
                        </button>
                        <button 
                            onClick={() => handleSendAction(order, 'shipped')}
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-95 ${order.status === 'shipped' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white border-2 border-slate-100 text-slate-700'}`}
                        >
                            <Truck size={14} /> Enviei
                        </button>
                        <button 
                            onClick={() => handleSendAction(order, 'completed')}
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-95 ${order.status === 'completed' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border-2 border-slate-100 text-slate-700'}`}
                        >
                            <CheckCircle2 size={14} /> Finalizar
                        </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <button onClick={() => handlePrint(order)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-tight hover:bg-slate-200 transition-all">
                            <Printer size={14} /> Ticket
                        </button>
                        <button 
                            onClick={() => {
                                const phone = order.customerPhone.replace(/\D/g, '');
                                window.open(`https://api.whatsapp.com/send?phone=${phone}`, '_blank');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-tight hover:bg-emerald-100 transition-all"
                        >
                            <MessageSquare size={14} /> Chat
                        </button>
                        <div className="flex-1"></div>
                        <button 
                            onClick={() => handleSendAction(order, 'cancelled')}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            title="Cancelar Pedido"
                        >
                            <XCircle size={20} />
                        </button>
                    </div>
                </div>
              </div>
            </Card>
          );
        })}
        
        {filteredOrders.length === 0 && (
            <div className="py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <ClipboardList className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nenhum pedido encontrado</p>
            </div>
        )}
      </div>
    </div>
  );
};