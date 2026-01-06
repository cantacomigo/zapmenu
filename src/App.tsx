/* 
  ZapMenu v2.0.2 - Gastronomic Red Mode (Production Ready)
*/
import React, { useState, useEffect } from 'react';
import { ViewState, Restaurant } from './types';
import { AdminDashboard } from './views/AdminDashboard';
import { ManagerDashboard } from './views/ManagerDashboard';
import { CustomerMenu } from './views/CustomerMenu';
import { CustomerLogin } from './views/customer/CustomerLogin';
import { CustomerRegister } from './views/customer/CustomerRegister';
import { db } from './services/db';
import { Button, Card } from './components/ui';
import { ToastProvider } from './components/ToastProvider';
import { ChefHat, Smartphone, UserCog, ExternalLink, ArrowRight } from 'lucide-react';

const LandingPage: React.FC<{ 
  onRoleSelect: (role: 'admin' | 'manager' | 'customer') => void 
}> = ({ onRoleSelect }) => {
  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden flex flex-col justify-center items-center p-4 text-white font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto mb-10 animate-in fade-in zoom-in duration-700">
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-red-400 text-xs font-medium mb-4 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
            v2.0 Oficial
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Zap<span className="text-red-500">Menu</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          Sua plataforma profissional de cardápio digital e gestão de pedidos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full relative z-10">
        <div onClick={() => onRoleSelect('admin')} className="group cursor-pointer">
            <div className="h-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:border-white/20">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors duration-300">
                    <UserCog className="w-6 h-6 text-slate-300 group-hover:text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-white">Administrador</h2>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">Gestão global de lojas e suporte técnico.</p>
                <div className="flex items-center text-xs text-red-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Acessar <ArrowRight className="ml-1.5 w-3 h-3" />
                </div>
            </div>
        </div>

        <div onClick={() => onRoleSelect('manager')} className="group cursor-pointer">
             <div className="h-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:border-white/20">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 transition-colors duration-300">
                    <ChefHat className="w-6 h-6 text-slate-300 group-hover:text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-white">Gerente de Loja</h2>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">Acesse o painel para gerir seu cardápio e vendas.</p>
                <div className="flex items-center text-xs text-orange-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Entrar <ArrowRight className="ml-1.5 w-3 h-3" />
                </div>
            </div>
        </div>

        <div onClick={() => onRoleSelect('customer')} className="group cursor-pointer relative">
            <div className="h-full bg-white/10 backdrop-blur-lg border border-red-500/30 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-red-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors duration-300 border border-red-500/20">
                    <Smartphone className="w-6 h-6 text-red-400 group-hover:text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-white">Cardápio Digital</h2>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">Visualize como os clientes veem sua loja online.</p>
                
                <Button variant="primary" size="sm" className="w-full bg-red-600 border-0">
                    Acessar Menu <ExternalLink className="ml-1.5 w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
      </div>
      
      <p className="mt-10 text-slate-500 text-xs font-medium">ZapMenu Oficial • 2024</p>
    </div>
  );
};

const ManagerLogin: React.FC<{ onLogin: (restId: string) => void, onBack: () => void }> = ({ onLogin, onBack }) => {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    
    useEffect(() => {
        const fetch = async () => {
            const r = await db.getRestaurants();
            setRestaurants(r);
        }
        fetch();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm p-6 text-slate-900 bg-white">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 text-red-600 mb-3">
                        <ChefHat size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Portal do Gerente</h2>
                    <p className="text-xs text-slate-500 mt-1">Selecione uma loja para gerenciar</p>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {restaurants.map(r => (
                        <button 
                            key={r.id} 
                            onClick={() => onLogin(r.id)}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-3 text-left group"
                        >
                            <img src={r.logo} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                            <div className="flex-1 overflow-hidden">
                                <span className="font-bold text-sm text-slate-800 block truncate group-hover:text-red-600 transition-colors">{r.name}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-500" />
                        </button>
                    ))}
                    {restaurants.length === 0 && (
                        <p className="text-center text-slate-400 text-xs py-4 italic">Nenhuma loja cadastrada no sistema.</p>
                    )}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-6" onClick={onBack}>Voltar</Button>
            </Card>
        </div>
    )
}

export default function App() {
  const [viewState, setViewState] = useState<ViewState>({ view: 'LANDING' });

  useEffect(() => {
      const handleHashChange = () => {
          const hash = window.location.hash.slice(1);
          if (hash.startsWith('menu/')) {
              const slug = hash.split('/')[1];
              if (slug) setViewState({ view: 'CUSTOMER_MENU', slug });
          } else if (hash === 'admin') {
              setViewState({ view: 'SUPER_ADMIN' });
          } else if (hash === 'customer-login') {
              setViewState({ view: 'CUSTOMER_LOGIN' });
          } else if (hash === '') {
              setViewState({ view: 'LANDING' });
          }
      };

      window.addEventListener('hashchange', handleHashChange);
      handleHashChange();
      return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleRoleSelect = async (role: 'admin' | 'manager' | 'customer') => {
      if (role === 'admin') {
          setViewState({ view: 'SUPER_ADMIN' });
          window.location.hash = 'admin';
      } else if (role === 'manager') {
          setViewState({ view: 'MANAGER_LOGIN' });
          window.location.hash = 'manager-login';
      } else if (role === 'customer') {
          // Check if already logged in via localStorage
          const saved = localStorage.getItem('zapmenu_customer');
          if (saved) {
            const restaurants = await db.getRestaurants();
            if (restaurants.length > 0) {
                const r = restaurants[0];
                setViewState({ view: 'CUSTOMER_MENU', slug: r.slug });
                window.location.hash = `menu/${r.slug}`;
            } else {
                alert("Nenhum restaurante cadastrado.");
            }
          } else {
              setViewState({ view: 'CUSTOMER_LOGIN' });
              window.location.hash = 'customer-login';
          }
      }
  };

  const renderView = () => {
    switch (viewState.view) {
      case 'LANDING':
        return <LandingPage onRoleSelect={handleRoleSelect} />;
      case 'SUPER_ADMIN':
        return <AdminDashboard 
            onNavigate={(slug) => {
                setViewState({ view: 'CUSTOMER_MENU', slug });
                window.location.hash = `menu/${slug}`;
            }} 
            onManage={(id) => {
                setViewState({ view: 'MANAGER_DASHBOARD', restaurantId: id });
            }}
            onBack={() => {
                setViewState({ view: 'LANDING' });
                window.location.hash = '';
            }}
        />;
      case 'MANAGER_LOGIN':
        return <ManagerLogin 
            onLogin={(id) => setViewState({ view: 'MANAGER_DASHBOARD', restaurantId: id })} 
            onBack={() => setViewState({ view: 'LANDING' })}
        />;
      case 'CUSTOMER_LOGIN':
        return <CustomerLogin 
            onLogin={async (customer) => {
                localStorage.setItem('zapmenu_customer', JSON.stringify(customer));
                const restaurants = await db.getRestaurants();
                if (restaurants.length > 0) {
                    setViewState({ view: 'CUSTOMER_MENU', slug: restaurants[0].slug });
                    window.location.hash = `menu/${restaurants[0].slug}`;
                }
            }}
            onGoToRegister={() => setViewState({ view: 'CUSTOMER_REGISTER' })}
            onBack={() => {
                setViewState({ view: 'LANDING' });
                window.location.hash = '';
            }}
        />;
      case 'CUSTOMER_REGISTER':
        return <CustomerRegister 
            onRegister={async (customer) => {
                localStorage.setItem('zapmenu_customer', JSON.stringify(customer));
                const restaurants = await db.getRestaurants();
                if (restaurants.length > 0) {
                    setViewState({ view: 'CUSTOMER_MENU', slug: restaurants[0].slug });
                    window.location.hash = `menu/${restaurants[0].slug}`;
                }
            }}
            onBackToLogin={() => setViewState({ view: 'CUSTOMER_LOGIN' })}
        />;
      case 'MANAGER_DASHBOARD':
        return <ManagerDashboard 
            restaurantId={viewState.restaurantId} 
            onLogout={() => {
                setViewState({ view: 'LANDING' });
                window.location.hash = '';
            }} 
        />;
      case 'CUSTOMER_MENU':
        return <CustomerMenu 
            slug={viewState.slug} 
            onBack={() => {
                setViewState({ view: 'LANDING' });
                window.location.hash = '';
            }} 
        />;
      default:
        return <LandingPage onRoleSelect={handleRoleSelect} />;
    }
  };

  return (
    <div className="antialiased text-slate-800 font-sans">
      <ToastProvider />
      {renderView()}
    </div>
  );
}