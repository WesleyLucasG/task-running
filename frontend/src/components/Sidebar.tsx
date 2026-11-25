import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, Package, User, LogOut, Swords, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Hub do Herói', color: 'text-brand-500' },
  { to: '/atividades', icon: Activity, label: 'Atividades', color: 'text-game-cyan' },
  { to: '/inventario', icon: Package, label: 'Inventário', color: 'text-game-purple' },
  { to: '/perfil', icon: User, label: 'Meu Perfil', color: 'text-game-yellow' },
];

export default function Sidebar() {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Até logo, herói!');
    navigate('/login');
  };

  return (
    <aside className="w-64 h-full flex flex-col bg-navy-800 border-r border-navy-600 relative overflow-hidden">
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none z-0" />

      {/* Top accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-brand-500 to-transparent shrink-0" />

      {/* Logo */}
      <div className="relative z-10 px-5 py-5 border-b border-navy-600/60">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-brand-500/40 rounded-xl blur-md" />
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white shadow-lg shadow-orange-500/30">
              <img src="/logo.jpg" alt="Task Running" className="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <p className="text-white font-black tracking-widest text-sm uppercase leading-none">
              Task <span className="text-brand-500">Running</span>
            </p>
            <p className="text-navy-400 text-[10px] tracking-[0.2em] mt-1 uppercase">Aventure-se · Evolua</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden ${
                isActive
                  ? 'bg-brand-500/15 border border-brand-500/30 text-white'
                  : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand-500 rounded-full" />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-transparent pointer-events-none" />
                  </>
                )}
                <Icon size={18} className={isActive ? 'text-brand-500' : `${color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <span className="font-bold tracking-wider text-xs uppercase">{label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 shadow-sm shadow-orange-500/50" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Admin section */}
      {isAdmin && (
        <div className="relative z-10 px-3 pb-2">
          <div className="flex items-center gap-2 px-4 mb-1">
            <div className="flex-1 h-px bg-red-500/20" />
            <span className="text-[9px] font-black tracking-widest uppercase text-red-500/60">Admin</span>
            <div className="flex-1 h-px bg-red-500/20" />
          </div>
          <NavLink
            to="/admin/logs"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden ${
                isActive
                  ? 'bg-red-500/15 border border-red-500/30 text-white'
                  : 'text-slate-500 hover:text-white hover:bg-red-500/5 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-red-500 rounded-full" />
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
                  </>
                )}
                <ShieldAlert size={18} className={isActive ? 'text-red-400' : 'text-red-500/50 group-hover:text-red-400 transition-colors'} />
                <span className="font-bold tracking-wider text-xs uppercase">Logs</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                )}
              </>
            )}
          </NavLink>
        </div>
      )}

      {/* Divider with icon */}
      <div className="relative z-10 px-5 flex items-center gap-3 mb-2">
        <div className="flex-1 h-px bg-navy-600/60" />
        <Swords size={12} className="text-navy-500" />
        <div className="flex-1 h-px bg-navy-600/60" />
      </div>

      {/* Logout */}
      <div className="relative z-10 px-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all group"
        >
          <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
          <span className="font-bold tracking-wider text-xs uppercase">Sair da Jornada</span>
        </button>
      </div>

      {/* Bottom accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-brand-500/40 to-transparent shrink-0" />
    </aside>
  );
}
