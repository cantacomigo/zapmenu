import React from 'react';
import { Order } from '../types';

interface OrderReceiptProps {
  order: Order;
  restaurantName: string;
  restaurantLogo?: string;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, restaurantName, restaurantLogo }) => {
  const subtotal = order.items.reduce((acc, item) => {
      const addonsPrice = item.selectedAddons?.reduce((a, b) => a + b.price, 0) || 0;
      return acc + ((Number(item.price) + addonsPrice) * item.quantity);
  }, 0);
  const deliveryFee = order.total - subtotal;
  const changeForMatch = order.paymentDetails?.match(/Troco para R\$ ([\d\.]+)/);
  const changeFor = changeForMatch ? parseFloat(changeForMatch[1]) : 0;

  return (
    <div id={`receipt-${order.id}`} className="print-only hidden print:block bg-white text-black p-4 w-[80mm] font-mono text-sm leading-tight">
      <div className="text-center border-b border-dashed border-black pb-2 mb-2">
        {restaurantLogo && (
          <div className="flex justify-center mb-2">
            {/* Aplica filtro para otimizar para impressão térmica P&B */}
            <img 
              src={restaurantLogo} 
              alt="Logo" 
              className="w-20 h-20 object-contain" 
              style={{ filter: 'grayscale(100%) contrast(200%)' }} 
            />
          </div>
        )}
        <h2 className="text-lg font-bold uppercase">{restaurantName}</h2>
        <p>PEDIDO #{order.id.slice(-6).toUpperCase()}</p>
        <p>{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
        {order.scheduledTime && (
            <p className="mt-1">AGENDADO PARA: {new Date(order.scheduledTime).toLocaleString('pt-BR')}</p>
        )}
      </div>

      <div className="mb-2">
        <p><strong>CLIENTE:</strong> {order.customerName}</p>
        <p><strong>FONE:</strong> {order.customerPhone}</p>
        <p className="whitespace-pre-wrap"><strong>ENTREGA:</strong> {order.customerAddress}</p>
      </div>

      <div className="border-y border-dashed border-black py-2 mb-2">
        <div className="flex justify-between font-bold mb-1">
          <span>ITEM</span>
          <span>VALOR</span>
        </div>
        {order.items.map((item, idx) => {
            const itemTotal = (Number(item.price) + (item.selectedAddons?.reduce((a, b) => a + b.price, 0) || 0)) * item.quantity;
            return (
                <div key={idx} className="py-0.5">
                    <div className="flex justify-between">
                        <span className="flex-1">{item.quantity}x {item.name}</span>
                        <span>{formatCurrency(itemTotal)}</span>
                    </div>
                    {item.selectedAddons?.map(addon => (
                        <p key={addon.id} className="text-xs pl-4">
                            + {addon.name} ({formatCurrency(addon.price)})
                        </p>
                    ))}
                </div>
            );
        })}
      </div>

      <div className="space-y-1 text-right mb-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {deliveryFee > 0 && (
            <div className="flex justify-between">
                <span>Taxa de Entrega:</span>
                <span>{formatCurrency(deliveryFee)}</span>
            </div>
        )}
        <div className="flex justify-between font-bold text-base border-t border-black pt-1">
          <span>TOTAL GERAL:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
        
        {changeFor > 0 && (
            <div className="flex justify-between text-sm pt-1">
                <span>Troco para:</span>
                <span>{formatCurrency(changeFor)}</span>
            </div>
        )}
      </div>

      <div className="border-t border-dashed border-black pt-2 text-center">
        <p><strong>PAGAMENTO:</strong> {order.paymentMethod.toUpperCase()}</p>
        {order.paymentDetails && order.paymentMethod !== 'cash' && <p className="text-xs">{order.paymentDetails}</p>}
        <p className="mt-4 text-[10px]">ZapMenu - Sistema de Pedidos Online</p>
      </div>
    </div>
  );
};