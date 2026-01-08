import React from 'react';
import { Order } from '../types';
import { formatCurrency, padText, separator, doubleSeparator } from '../utils/receiptFormatter';

interface OrderReceiptProps {
  order: Order;
  restaurantName: string;
  restaurantLogo?: string;
}

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
      <pre className="text-center">{separator}</pre>

      <div className="mb-2">
        <pre>
          <strong>CLIENTE:</strong> {order.customerName}
          {'\n'}
          <strong>FONE:</strong> {order.customerPhone}
          {'\n'}
          <strong>ENTREGA:</strong> {order.customerAddress}
        </pre>
      </div>
      <pre className="text-center">{separator}</pre>

      <div className="py-2 mb-2">
        <pre className="font-bold mb-1">
          {padText('ITEM', 'VALOR', ' ')}
        </pre>
        {order.items.map((item, idx) => {
            const itemPriceWithoutAddons = Number(item.price);
            const addonsPrice = item.selectedAddons?.reduce((a, b) => a + b.price, 0) || 0;
            const itemTotal = (itemPriceWithoutAddons + addonsPrice) * item.quantity;
            
            return (
                <div key={idx} className="py-0.5">
                    <pre>
                        {padText(`${item.quantity}x ${item.name}`, formatCurrency(itemTotal), ' ')}
                    </pre>
                    {item.selectedAddons?.map(addon => (
                        <pre key={addon.id} className="text-xs pl-4">
                            {padText(`+ ${addon.name}`, formatCurrency(addon.price), ' ')}
                        </pre>
                    ))}
                </div>
            );
        })}
      </div>
      <pre className="text-center">{separator}</pre>

      <div className="space-y-1 mb-2">
        <pre>
          {padText('Subtotal:', formatCurrency(subtotal), ' ')}
        </pre>
        {deliveryFee > 0 && (
            <pre>
                {padText('Taxa de Entrega:', formatCurrency(deliveryFee), ' ')}
            </pre>
        )}
        <pre className="text-center">{doubleSeparator}</pre>
        <pre className="font-bold text-base pt-1">
          {padText('TOTAL GERAL:', formatCurrency(order.total), ' ')}
        </pre>
        
        {changeFor > 0 && (
            <pre className="text-sm pt-1">
                {padText('Troco para:', formatCurrency(changeFor), ' ')}
            </pre>
        )}
      </div>

      <pre className="text-center">{separator}</pre>
      <div className="pt-2 text-center">
        <p><strong>PAGAMENTO:</strong> {order.paymentMethod.toUpperCase()}</p>
        {order.paymentDetails && order.paymentMethod !== 'cash' && <p className="text-xs">{order.paymentDetails}</p>}
        <p className="mt-4 text-[10px]">ZapMenu - Sistema de Pedidos Online</p>
      </div>
    </div>
  );
};