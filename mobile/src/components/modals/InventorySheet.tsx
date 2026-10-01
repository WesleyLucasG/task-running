import React, { useState } from 'react';

interface Item {
  id: string;
  name: string;
  type: 'Arma' | 'Escudo' | 'Peito' | 'Botas' | 'Amuleto';
  rarity: 'Comum' | 'Raro' | 'Épico' | 'Lendário';
  stat: string;
  price: number;
  icon: string;
}

const MOCK_ITEMS: Item[] = [
  { id: '1', name: 'Xifos do Viajante', type: 'Arma', rarity: 'Raro', stat: '+14 Força', price: 240, icon: '🗡️' },
  { id: '2', name: 'Lança de Eleusis', type: 'Arma', rarity: 'Épico', stat: '+21 Precisão', price: 520, icon: '🔱' },
  { id: '3', name: 'Hoplon Rachado', type: 'Escudo', rarity: 'Comum', stat: '+6 Defesa', price: 80, icon: '🛡️' },
  { id: '4', name: 'Sandálias Aladas', type: 'Botas', rarity: 'Lendário', stat: '+30 Agilidade', price: 1200, icon: '🪽' },
  { id: '5', name: 'Túnica de Linho', type: 'Peito', rarity: 'Comum', stat: '+5 Vitalidade', price: 60, icon: '🥋' },
  { id: '6', name: 'Amuleto de Tyche', type: 'Amuleto', rarity: 'Épico', stat: '+12 Sorte', price: 480, icon: '📿' },
];

export const InventorySheet: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(MOCK_ITEMS[0]);
  const [filter, setFilter] = useState<string>('Tudo');

  const getRarityColor = (rarity: Item['rarity']) => {
    switch (rarity) {
      case 'Lendário': return 'border-amber-400 bg-amber-500/10 text-amber-300';
      case 'Épico': return 'border-purple-500 bg-purple-500/10 text-purple-300';
      case 'Raro': return 'border-blue-500 bg-blue-500/10 text-blue-300';
      default: return 'border-slate-700 bg-slate-950 text-slate-300';
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Slots Equipados */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
        <div className="text-center p-1 border border-amber-500/30 rounded-lg bg-amber-500/5">
          <p className="text-[9px] text-slate-400 uppercase">Arma</p>
          <span className="text-sm">🗡️</span>
          <p className="text-[10px] font-bold text-amber-400 truncate">Xifos</p>
        </div>
        <div className="text-center p-1 border border-slate-800 rounded-lg bg-slate-900/40">
          <p className="text-[9px] text-slate-400 uppercase">Escudo</p>
          <span className="text-sm">🛡️</span>
          <p className="text-[10px] font-bold text-slate-300 truncate">Hoplon</p>
        </div>
        <div className="text-center p-1 border border-amber-400/30 rounded-lg bg-amber-400/5">
          <p className="text-[9px] text-slate-400 uppercase">Botas</p>
          <span className="text-sm">🪽</span>
          <p className="text-[10px] font-bold text-amber-300 truncate">Sandálias</p>
        </div>
      </div>

      {/* Filtros de Categoria */}
      <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
        {['Tudo', 'Arma', 'Escudo', 'Peito', 'Botas', 'Amuleto'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-2.5 py-1 rounded-lg border whitespace-nowrap ${
              filter === cat
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grade de Slots Mochila (Quadrados) */}
      <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto pr-1">
        {MOCK_ITEMS.filter((i) => filter === 'Tudo' || i.type === filter).map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition active:scale-95 ${getRarityColor(
              item.rarity
            )} ${selectedItem?.id === item.id ? 'ring-2 ring-amber-400' : ''}`}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <p className="text-[11px] font-bold truncate w-full text-center">{item.name}</p>
            <p className="text-[9px] opacity-80">{item.stat}</p>
          </div>
        ))}
      </div>

      {/* Caixa do Hermes & Ações do Item Selecionado */}
      {selectedItem && (
        <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/20 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold text-amber-400">{selectedItem.name}</p>
            <p className="text-[10px] text-slate-400">
              {selectedItem.stat} • Valor: 💰 {selectedItem.price}
            </p>
          </div>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg active:scale-95">
              Equipar
            </button>
            <button className="px-2 py-1.5 bg-slate-800 text-red-400 border border-slate-700 text-xs rounded-lg active:scale-95">
              💰 Vender
            </button>
          </div>
        </div>
      )}
    </div>
  );
};