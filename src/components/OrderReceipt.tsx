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

// Função para criar separadores de largura total (40 caracteres para 80mm)
const createSeparator = (char: string = '-', length: number = 40) => char.repeat(length);

// Função para alinhar texto à esquerda e valor à direita
const alignTextAndValue = (text: string, value: string, totalLength: number = 40) => {
    const textPart = text.substring(0, totalLength - value.length - 1);
    const padding = totalLength - textPart.length - value.length;
    return textPart + ' '.repeat(padding) + value;
};

export const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, restaurantName, restaurantLogo }) => {
  const subtotal = order.items.reduce((acc, item) => {
      const addonsPrice = item.selectedAddons?.reduce((a, b) => a + b.price, 0) || 0;
      return acc + ((Number(item.price) + addonsPrice) * item.quantity);
  }, 0);
  const deliveryFee = order.total - subtotal;
  const changeForMatch = order.paymentDetails?.match(/Troco para R\$ ([\d\.]+)/);
  const changeFor = changeForMatch ? parseFloat(changeForMatch[1]) : 0;

  // Usamos 'whitespace-pre' para respeitar os espaços e quebras de linha gerados pelas funções de alinhamento
  return (
    <div id={`receipt-${order.id}`} className="print-only hidden print:block bg-white text-black p-4 w-[80mm] font-mono text-sm leading-tight whitespace-pre">
{/* LOGO REMOVIDA TEMPORARIAMENTE PARA GARANTIR O ALINHAMENTO DO TEXTO */}
{/* {restaurantLogo && (
          <div className="flex justify-center mb-2">
            <img 
              src={restaurantLogo} 
              alt="Logo" 
              className="w-20 h-20 object-contain" 
              style={{ filter: 'grayscale(100%) contrast(200%)' }} 
            />
          </div>
        )} */}
{`
        ${restaurantName.toUpperCase().padStart(20 + restaurantName.length / 2, ' ').padEnd(40, ' ')}
        PEDIDO #${order.id.slice(-6).toUpperCase().padStart(20 + order.id.slice(-6).length / 2, ' ').padEnd(40, ' ')}
        ${new Date(order.createdAt).toLocaleString('pt-BR').padStart(20 + new Date(order.createdAt).toLocaleString('pt-BR').length / 2, ' ').padEnd(40, ' ')}
${order.scheduledTime ? `        AGENDADO PARA: ${new Date(order.scheduledTime).toLocaleString('pt-BR')}\n` : ''}
${createSeparator()}

CLIENTE: ${order.customerName}
FONE: ${order.customerPhone}
ENTREGA: ${order.customerAddress}
${createSeparator()}

ITEM                                VALOR
`}
{order.items.map((item, idx) => {
    const itemPrice = Number(item.price);
    const addonsPrice = item.selectedAddons?.reduce((a, b) => a + b.price, 0) || 0;
    const itemTotal = (itemPrice + addonsPrice) * item.quantity;
    
    const itemLine = alignTextAndValue(
        `${item.quantity}x ${item.name}`,
        formatCurrency(itemTotal).replace('R$', '').trim()
    );

    return (
        `${itemLine}\n` +
        (item.selectedAddons?.map(addon => {
            const addonLine = alignTextAndValue(
                `  + ${addon.name}`,
                formatCurrency(addon.price).replace('R$', '').trim()
            );
            return `${addonLine}\n`;
        }).join('') || '')
    );
}).join('')}
{createSeparator()}

{alignTextAndValue('Subtotal:', formatCurrency(subtotal).replace('R$', '').trim())}
${deliveryFee > 0 ? alignTextAndValue('Taxa de Entrega:', formatCurrency(deliveryFee).replace('R$', '').trim()) : ''}
${createSeparator('=')}
${alignTextAndValue('TOTAL GERAL:', formatCurrency(order.total).replace('R$', '').trim())}
${changeFor > 0 ? alignTextAndValue('Troco para:', formatCurrency(changeFor).replace('R$', '').trim()) : ''}
${createSeparator()}

PAGAMENTO: ${order.paymentMethod.toUpperCase()}
${order.paymentDetails && order.paymentMethod !== 'cash' ? order.paymentDetails : ''}

${'ZapMenu - Sistema de Pedidos Online'.padStart(20 + 'ZapMenu - Sistema de Pedidos Online'.length / 2, ' ').padEnd(40, ' ')}
`}
    </div>
  );
};