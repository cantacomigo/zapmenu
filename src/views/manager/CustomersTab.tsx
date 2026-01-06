import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Order } from '../../types';
import { Card, Input } from '../../components/ui';
import { Users, Search, Phone, MapPin } from 'lucide-react';

interface CustomersTabProps {
  restaurantId: string;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ restaurantId }) => {
  const [customers, setCustomers] = useState<{name: string, phone: string, address: string, orderCount: number}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetch = async () => {
        const orders = await db.getOrders(restaurantId);
        const customerMap = new Map<string, any>();
        
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
        <h2 className="text-2xl font-bold text-slate-900">Meus Clientes</h2>
        <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Buscar por nome ou fone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer, idx) => (
            <Card key={idx} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                        <Users className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{customer.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <Phone className="w-3 h-3" /> {customer.phone}
                        </div>
                        <div className="flex items-start gap-2 text-sm text-slate-500 mt-1">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> 
                            <span className="truncate">{customer.address}</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total de Pedidos</span>
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">{customer.orderCount}</span>
                        </div>
                    </div>
                </div>
            </Card>
        ))}
        {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">Nenhum cliente encontrado.</p>
            </div>
        )}
      </div>
    </div>
  );
};