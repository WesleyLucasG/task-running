import React from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-t-2 border-amber-500/40 rounded-t-3xl p-5 h-[65vh] flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Cabeçalho da Gaveta */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-lg font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <span>🛡️</span> {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold transition active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo Dinâmico (Inventário, Loja, Atributos, etc) */}
        <div className="flex-1 overflow-y-auto py-4 text-slate-200">
          {children}
        </div>

      </div>
    </div>
  );
};