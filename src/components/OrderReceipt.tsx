import React from 'react';
import { Order } from '../types';

interface OrderReceiptProps {
  order: Order;
  restaurantName: string;
  restaurantLogo?: string;
}

const formatCurrency = (value: number) => {
    // Garante que o valor seja tratado como número e formatado corretamente
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
};

const separator = '----------------------------------------';
const doubleSeparator = '========================================';

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
      <div className="text-center pb-2 mb-2">
        {restaurantLogo && (
          <div className="flex justify-center mb-2">
            {/* Otimiza para impressão térmica P&B e garante tamanho fixo */}
            <img 
              src={restaurantLogo} 
              alt="Logo" 
              className="w-20 h-20 object-contain" 
              style={{ 
                width: '80px', 
                height: '80px', 
                filter: 'grayscale(100%) contrast(200%)',
                // Adiciona um estilo para garantir que a imagem seja tratada como bloco
                display: 'block',
                margin: '0 auto'
              }} 
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
      <p className="text-center">{separator}</p>

      <div className="mb-2">
        <p><strong>CLIENTE:</strong> {order.customerName}</p>
        <p><strong>FONE:</strong> {order.customerPhone}</p>
        <p className="whitespace-pre-wrap"><strong>ENTREGA:</strong> {order.customerAddress}</p>
      </div>
      <p className="text-center">{separator}</p>

      <div className="py-2 mb-2">
        <div className="flex justify-between font-bold mb-1">
          <span>ITEM</span>
          <span>VALOR</span>
        </div>
        {order.items.map((item, idx) => {
            const itemPriceWithoutAddons = Number(item.price);
            const addonsPrice = item.selectedAddons?.reduce((a, b) => a + b.price, 0) || 0;
            const itemTotal = (itemPriceWithoutAddons + addonsPrice) * item.quantity;
            
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
      <p className="text-center">{separator}</p>

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
        <p className="text-center">{doubleSeparator}</p>
        <div className="flex justify-between font-bold text-base pt-1">
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

      <p className="text-center">{separator}</p>
      <div className="pt-2 text-center">
        <p><strong>PAGAMENTO:</strong> {order.paymentMethod.toUpperCase()}</p>
        {order.paymentDetails && order.paymentMethod !== 'cash' && <p className="text-xs">{order.paymentDetails}</p>}
        <p className="mt-4 text-[10px]">ZapMenu - Sistema de Pedidos Online</p>
      </div>
    </div>
  );
};