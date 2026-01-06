import React from 'react';
import { Order } from '../types';

interface OrderReceiptProps {
  order: Order;
  restaurantName: string;
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, restaurantName }) => {
  return (
    <div id={`receipt-${order.id}`} className="print-only hidden print:block bg-white text-black p-4 w-[80mm] font-mono text-sm leading-tight">
      <div className="text-center border-b border-dashed border-black pb-2 mb-2">
        <h2 className="text-lg font-bold uppercase">{restaurantName}</h2>
        <p>PEDIDO #{order.id.slice(-6).toUpperCase()}</p>
        <p>{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
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
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between py-0.5">
            <span className="flex-1">{item.quantity}x {item.name}</span>
            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1 text-right mb-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>R$ {(order.total - (order.items[0]?.restaurantId ? 0 : 0)).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-black pt-1">
          <span>TOTAL:</span>
          <span>R$ {order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black pt-2 text-center">
        <p><strong>PAGAMENTO:</strong> {order.paymentMethod.toUpperCase()}</p>
        {order.paymentDetails && <p className="text-xs">{order.paymentDetails}</p>}
        <p className="mt-4 text-[10px]">ZapMenu - Sistema de Pedidos Online</p>
      </div>
    </div>
  );
};