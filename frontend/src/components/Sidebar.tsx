import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, ShoppingBag, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Hub do Herói' },
  { to: '/atividades', icon: Activity, label: 'Atividades' },
  { to: '/loja', icon: ShoppingBag, label: 'Loja' },
  { to: '/perfil', icon: User, label: 'Meu Perfil' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Até logo, herói!');
    navigate('/login');
  };

  return (
    <aside className="w-64 h-full flex flex-col bg-navy-800 border-r border-navy-600">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-navy-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-lg shadow-orange-500/20 shrink-0">
            <img src="/logo.jpg" alt="Task Running" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-white font-bold tracking-widest text-sm uppercase leading-none">
              Task Running
            </p>
            <p className="text-slate-500 text-xs tracking-wide mt-0.5">Aventure-se e Evolua</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={20} />
            <span className="font-semibold tracking-wide text-sm uppercase">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-navy-600">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={20} />
          <span className="font-semibold tracking-wide text-sm uppercase">Sair da Jornada</span>
        </button>
      </div>
    </aside>
  );
}
