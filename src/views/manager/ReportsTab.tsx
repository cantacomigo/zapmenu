import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/db';
import { Order } from '../../types';
import { Card } from '../../components/ui';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';

interface ReportsTabProps {
  restaurantId: string;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ restaurantId }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetch = async () => {
        const data = await db.getOrders(restaurantId);
        setOrders(data);
    };
    fetch();
  }, [restaurantId]);

  const stats = useMemo(() => {
      const completed = orders.filter(o => o.status === 'completed');
      const totalRevenue = completed.reduce((acc, o) => acc + o.total, 0);
      const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;
      
      return {
          totalOrders: orders.length,
          completedOrders: completed.length,
          revenue: totalRevenue,
          avgTicket: avgTicket
      };
  }, [orders]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">Relatórios de Desempenho</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-slate-500 uppercase">Vendas Totais</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">R$ {stats.revenue.toFixed(2)}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><DollarSign className="w-6 h-6" /></div>
            </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-slate-500 uppercase">Pedidos Entregues</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.completedOrders}</h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ShoppingBag className="w-6 h-6" /></div>
            </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-slate-500 uppercase">Ticket Médio</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">R$ {stats.avgTicket.toFixed(2)}</h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
            </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-amber-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-slate-500 uppercase">Total Pedidos</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.totalOrders}</h3>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
            </div>
        </Card>
      </div>

      <Card className="p-8">
          <h3 className="font-bold text-slate-800 mb-6">Pedidos por Status</h3>
          <div className="space-y-4">
              {['pending', 'confirmed', 'completed', 'cancelled'].map(status => {
                  const count = orders.filter(o => o.status === status).length;
                  const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                  const label = status === 'pending' ? 'Pendente' : status === 'confirmed' ? 'Em Preparo' : status === 'completed' ? 'Entregue' : 'Cancelado';
                  const color = status === 'pending' ? 'bg-amber-500' : status === 'confirmed' ? 'bg-blue-500' : status === 'completed' ? 'bg-emerald-500' : 'bg-red-500';

                  return (
                      <div key={status} className="space-y-2">
                          <div className="flex justify-between text-sm font-bold">
                              <span className="text-slate-600">{label}</span>
                              <span className="text-slate-900">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </Card>
    </div>
  );
};