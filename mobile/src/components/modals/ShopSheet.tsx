import React, { useState } from 'react';

export const ShopSheet: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Skins');

  const items = [
    { id: '1', name: 'Herói de Bronze', desc: 'Aparência clássica de hoplita', price: 900, icon: '🛡️', cat: 'Skins' },
    { id: '2', name: 'Sombra de Estige', desc: 'Silhueta escura com brilho azul', price: 1600, icon: '🌌', cat: 'Skins' },
    { id: '3', name: 'Xifos Dourado', desc: 'Lâmina abençoada por Apolo', price: 1200, icon: '⚔️', cat: 'Espadas' },
    { id: '4', name: 'Elixir de Velocidade', desc: '+10% velocidade de ataque por 1h', price: 150, icon: '🧪', cat: 'Poções' },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Banner Sem Microtransações */}
      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
          ✦ Tudo conquistado no farm — sem atalhos ✦
        </p>
      </div>

      {/* Categorias da Loja */}
      <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
        {['Skins', 'Espadas', 'Poções', 'Efeitos', 'Chaves'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-3 py-1 rounded-lg border whitespace-nowrap ${
              activeTab === cat
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Vitrine de Itens */}
      <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-1">
        {items.filter((i) => i.cat === activeTab || activeTab === 'Skins').map((item) => (
          <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between items-center text-center">
            <span className="text-3xl my-1">{item.icon}</span>
            <p className="text-xs font-bold text-slate-200">{item.name}</p>
            <p className="text-[9px] text-slate-400 my-1">{item.desc}</p>
            <button className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-lg mt-1 flex items-center justify-center gap-1">
              <span>💰</span> {item.price}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};