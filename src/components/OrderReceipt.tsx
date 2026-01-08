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

  // --- Geração do Conteúdo do Recibo em String ---
  let receiptContent = '';

  // 1. Informações do Cliente
  receiptContent += separator + '\n';
  // Usando padText para garantir que a linha tenha exatamente 40 caracteres, truncando se necessário.
  receiptContent += padText(`CLIENTE: ${order.customerName}`, '', ' ') + '\n';
  receiptContent += padText(`FONE: ${order.customerPhone}`, '', ' ') + '\n';
  receiptContent += padText(`ENTREGA: ${order.customerAddress}`, '', ' ') + '\n';
  if (order.scheduledTime) {
      receiptContent += padText(`AGENDADO: ${new Date(order.scheduledTime).toLocaleString('pt-BR')}`, '', ' ') + '\n';
  }
  receiptContent += separator + '\n';

  // 2. Itens
  receiptContent += padText('ITEM', 'VALOR', ' ') + '\n';
  receiptContent += separator + '\n';

  order.items.forEach(item => {
      const itemPriceWithoutAddons = Number(item.price);
      const addonsPrice = item.selectedAddons?.reduce((a, b) => a + b.price, 0) || 0;
      const itemTotal = (itemPriceWithoutAddons + addonsPrice) * item.quantity;
      
      // Linha principal do item (truncada se o nome for muito longo para caber o preço)
      receiptContent += padText(`${item.quantity}x ${item.name}`, formatCurrency(itemTotal), ' ') + '\n';
      
      // Acréscimos (indentados)
      item.selectedAddons?.forEach(addon => {
          // Usando padText para garantir alinhamento do preço do adicional
          receiptContent += padText(`  + ${addon.name}`, formatCurrency(addon.price), ' ') + '\n';
      });
  });
  receiptContent += separator + '\n';

  // 3. Totais
  receiptContent += padText('Subtotal:', formatCurrency(subtotal), ' ') + '\n';
  if (deliveryFee > 0) {
      receiptContent += padText('Taxa de Entrega:', formatCurrency(deliveryFee), ' ') + '\n';
  }
  receiptContent += doubleSeparator + '\n';
  receiptContent += padText('TOTAL GERAL:', formatCurrency(order.total), ' ') + '\n';
  
  if (changeFor > 0) {
      receiptContent += padText('Troco para:', formatCurrency(changeFor), ' ') + '\n';
  }
  receiptContent += separator + '\n';

  // 4. Pagamento e Rodapé
  receiptContent += `PAGAMENTO: ${order.paymentMethod.toUpperCase()}\n`;
  if (order.paymentDetails && order.paymentMethod !== 'cash') {
      receiptContent += `${order.paymentDetails}\n`;
  }
  receiptContent += '\n';
  receiptContent += `${restaurantName} - Pedido Online\n`;
  receiptContent += separator + '\n';
  receiptContent += 'OBRIGADO PELA PREFERENCIA!\n';
  // --------------------------------------------------

  return (
    <div id={`receipt-${order.id}`} className="print-only hidden print:block bg-white text-black p-4 w-[80mm] font-mono text-sm leading-tight">
      <div className="text-center pb-2 mb-2">
        {restaurantLogo && (
          <div className="flex justify-center mb-2">
            {/* Aumentando o tamanho do logo para 160px */}
            <img 
              src={restaurantLogo} 
              alt="Logo" 
              className="w-40 h-40 object-contain print-logo" 
              style={{ 
                width: '160px', 
                height: '160px', 
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
      </div>
      
      {/* Usando <pre> para preservar o espaçamento monoespaçado */}
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {receiptContent}
      </pre>
    </div>
  );
};