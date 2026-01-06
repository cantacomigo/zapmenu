import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Order, CustomerUser } from '../../types';
import { Card, Input } from '../../components/ui';
import { Users, Search, Phone, MapPin } from 'lucide-react';

interface CustomersTabProps {
  restaurantId: string;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ restaurantId }) => {
  const [customers, setCustomers] = useState<{name: string, phone: string, address: string, orderCount: number}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
        setIsLoading(true);
        const orders = await db.getOrders(restaurantId);
        const registered = await db.getCustomers();
        const customerMap = new Map<string, any>();
        
        // Add from registered customers
        registered.forEach(c => {
            customerMap.set(c.phone, {
                name: c.name,
                phone: c.phone,
                address: c.address || 'Não informado',
                orderCount: 0
            });
        });

        // Add/Update from orders
        orders.forEach(order => {
            const key = order.customerPhone;
            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    name: order.customerName,
                    phone: order.customerPhone,
                    address: order.customerAddress,
                    orderCount: 1
                });
            } else {
                const existing = customerMap.get(key);
                customerMap.set(key, { ...existing, orderCount: existing.orderCount + 1 });
            }
        });
        
        setCustomers(Array.from(customerMap.values()));
        setIsLoading(false);
    };
    fetch();
  }, [restaurantId]);

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Base de Clientes</h2>
            <p className="text-xs text-slate-500 mt-0.5">Histórico de pessoas que já pediram na sua loja.</p>
        </div>
        <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500/10 text-sm font-medium"
                placeholder="Buscar por nome ou fone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando dados...</div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((customer, idx) => (
                <Card key={idx} className="p-4 hover:shadow-md transition-shadow group border-slate-100">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-slate-900 truncate">{customer.name}</h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                <Phone className="w-3 h-3" /> {customer.phone}
                            </div>
                            <div className="flex items-start gap-1.5 text-[11px] text-slate-500 mt-1">
                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> 
                                <span className="truncate">{customer.address}</span>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Pedidos</span>
                                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-black">{customer.orderCount}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
            {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium text-sm">Nenhum cliente encontrado.</p>
                </div>
            )}
          </div>
      )}
    </div>
  );
};