import { Outlet } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, ShoppingBag, User } from 'lucide-react';
import Sidebar from './Sidebar';

const mobileNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Hub' },
  { to: '/atividades', icon: Activity, label: 'Corrida' },
  { to: '/loja', icon: ShoppingBag, label: 'Loja' },
  { to: '/perfil', icon: User, label: 'Perfil' },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      {/* Sidebar - desktop only */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>

        {/* Bottom nav - mobile only */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-navy-800 border-t border-navy-600 z-20 safe-bottom">
          <div className="flex">
            {mobileNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                    isActive ? 'text-brand-500' : 'text-slate-500'
                  }`
                }
              >
                <Icon size={22} />
                <span className="text-xs font-semibold tracking-wider uppercase">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
