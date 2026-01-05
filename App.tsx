import React, { useState, useEffect } from 'react';
import { ViewState, Restaurant } from './types';
import { AdminDashboard } from './views/AdminDashboard';
import { ManagerDashboard } from './views/ManagerDashboard';
import { CustomerMenu } from './views/CustomerMenu';
import { db } from './services/db';
import { Button, Card } from './components/ui';
import { ChefHat, Smartphone, UserCog, ExternalLink, ArrowRight, Database } from 'lucide-react';

const LandingPage: React.FC<{ 
  onRoleSelect: (role: 'admin' | 'manager' | 'customer') => void 
}> = ({ onRoleSelect }) => {
  const [hasRestaurants, setHasRestaurants] = useState<boolean | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    // Check if we have data
    const checkData = async () => {
        const restaurants = await db.getRestaurants();
        setHasRestaurants(restaurants.length > 0);
    };
    checkData();
  }, [isSeeding]);

  const handleSeed = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsSeeding(true);
      await db.seedDatabase();
      setIsSeeding(false);
      alert("Dados de demonstração criados!");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden flex flex-col justify-center items-center p-6 text-white font-sans">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto mb-16 animate-in fade-in zoom-in duration-700">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/10 text-emerald-300 text-sm font-medium mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
            Sistema v2.0 Live (Supabase)
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Zap<span className="text-emerald-400">Menu</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Transforme seu atendimento com nosso cardápio digital inteligente. 
          Pedidos automáticos via WhatsApp, painel de gestão completo e zero taxas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full relative z-10">
        {/* Admin Card */}
        <div onClick={() => onRoleSelect('admin')} className="group cursor-pointer">
            <div className="h-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:border-white/20 hover:shadow-2xl hover:shadow-emerald-900/20">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors duration-300">
                    <UserCog className="w-8 h-8 text-slate-300 group-hover:text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-white">Super Admin</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">Controle total da plataforma. Gerencie múltiplos estabelecimentos e assinaturas.</p>
                <div className="flex items-center text-emerald-400 font-semibold group-hover:translate-x-2 transition-transform">
                    Acessar Painel <ArrowRight className="ml-2 w-4 h-4" />
                </div>
            </div>
        </div>

        {/* Manager Card */}
        <div onClick={() => onRoleSelect('manager')} className="group cursor-pointer">
             <div className="h-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:border-white/20 hover:shadow-2xl hover:shadow-blue-900/20">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors duration-300">
                    <ChefHat className="w-8 h-8 text-slate-300 group-hover:text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-white">Gerente</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">Área do restaurante. Atualize cardápios, preços e acompanhe pedidos em tempo real.</p>
                <div className="flex items-center text-blue-400 font-semibold group-hover:translate-x-2 transition-transform">
                    Login Gerente <ArrowRight className="ml-2 w-4 h-4" />
                </div>
            </div>
        </div>

        {/* Customer Card */}
        <div onClick={() => onRoleSelect('customer')} className="group cursor-pointer relative">
            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-20">
                DEMO LIVE
            </div>
            <div className="h-full bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-lg border border-emerald-500/30 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20">
                <div className="w-16 h-16 bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors duration-300 border border-emerald-500/20">
                    <Smartphone className="w-8 h-8 text-emerald-400 group-hover:text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-white">Cliente</h2>
                <p className="text-slate-300 mb-8 leading-relaxed">Experiência do usuário final. Navegação fluida, carrinho e checkout WhatsApp.</p>
                
                {hasRestaurants === false ? (
                    <Button onClick={handleSeed} isLoading={isSeeding} variant="primary" className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold border-0">
                       <Database className="w-4 h-4 mr-2" /> Restaurar Dados
                    </Button>
                ) : (
                    <Button variant="primary" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold border-0">
                       Ver Cardápio <ExternalLink className="ml-2 w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
      </div>
      
      <p className="mt-16 text-slate-500 text-sm font-medium">Design System v2 • React 19 • Tailwind CSS</p>
    </div>
  );
};

// Simple Manager Login Mock
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
            <Card className="w-full max-w-md p-8 md:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
                        <ChefHat size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Portal do Gerente</h2>
                    <p className="text-slate-500 mt-2">Selecione uma loja para administrar</p>
                </div>
                
                <div className="space-y-3">
                    {restaurants.map(r => (
                        <button 
                            key={r.id} 
                            onClick={() => onLogin(r.id)}
                            className="w-full p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all flex items-center gap-4 text-left group"
                        >
                            <img src={r.logo} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                            <div className="flex-1">
                                <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{r.name}</span>
                                <p className="text-xs text-slate-400">ID: {r.id.slice(0, 8)}...</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                        </button>
                    ))}
                    {restaurants.length === 0 && <p className="text-center text-slate-400">Nenhum restaurante encontrado.</p>}
                </div>
                <Button variant="ghost" className="w-full mt-8" onClick={onBack}>Voltar ao Início</Button>
            </Card>
        </div>
    )
}

export default function App() {
  const [viewState, setViewState] = useState<ViewState>({ view: 'LANDING' });

  // Simple Hash Router for demo URL persistence
  useEffect(() => {
      const handleHashChange = () => {
          const hash = window.location.hash.slice(1); // remove #
          if (hash.startsWith('menu/')) {
              const slug = hash.split('/')[1];
              if (slug) setViewState({ view: 'CUSTOMER_MENU', slug });
          } else if (hash === 'admin') {
              setViewState({ view: 'SUPER_ADMIN' });
          } else if (hash === '') {
              setViewState({ view: 'LANDING' });
          }
      };

      window.addEventListener('hashchange', handleHashChange);
      handleHashChange(); // Check on mount
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
          const restaurants = await db.getRestaurants();
          // Use first available or stay on landing if empty to allow seeding
          if (restaurants.length > 0) {
            const r = restaurants[0];
            setViewState({ view: 'CUSTOMER_MENU', slug: r.slug });
            window.location.hash = `menu/${r.slug}`;
          } else {
             // Stay on landing, the UI will show the seed button
             alert("Nenhum restaurante encontrado. Clique em 'Restaurar Dados' no cartão de Cliente.");
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
      {renderView()}
    </div>
  );
}