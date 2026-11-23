import { Outlet } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Package, User } from 'lucide-react';
import Sidebar from './Sidebar';

const mobileNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Hub', activeColor: 'text-brand-500' },
  { to: '/atividades', icon: Activity, label: 'Corrida', activeColor: 'text-game-cyan' },
  { to: '/inventario', icon: Package, label: 'Inventário', activeColor: 'text-game-purple' },
  { to: '/perfil', icon: User, label: 'Perfil', activeColor: 'text-game-yellow' },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none z-0" />

      {/* Sidebar - desktop only */}
      <div className="relative z-10 hidden lg:block">
        <Sidebar />
      </div>

      {/* Main */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>

        {/* Bottom nav - mobile only */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20">
          {/* Top accent */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
          <div className="bg-navy-800/95 backdrop-blur-sm border-t border-navy-600">
            <div className="flex">
              {mobileNavItems.map(({ to, icon: Icon, label, activeColor }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex-1 flex flex-col items-center gap-1 py-3 transition-all relative ${
                      isActive ? activeColor : 'text-slate-600'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-500 rounded-full" />
                      )}
                      <Icon size={20} />
                      <span className="text-[10px] font-black tracking-wider uppercase">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
