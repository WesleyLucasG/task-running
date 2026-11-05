import React, { useState } from 'react';

interface Attribute {
  key: string;
  label: string;
  value: number;
  desc: string;
  runBonus: string;
  color: string;
}

export const AttributesSheet: React.FC = () => {
  const [points, setPoints] = useState(3);
  const [attributes, setAttributes] = useState<Attribute[]>([
    { key: 'str', label: 'Força', value: 62, desc: 'Dano bruto dos golpes', runBonus: '+2 por km corrido', color: 'text-amber-400' },
    { key: 'vit', label: 'Vitalidade', value: 48, desc: 'Vida máxima do herói', runBonus: '+1 a cada 100 kcal', color: 'text-red-400' },
    { key: 'agi', label: 'Agilidade', value: 71, desc: 'Velocidade de ataque', runBonus: '+3 em corridas > 5 km', color: 'text-emerald-400' },
    { key: 'acc', label: 'Precisão', value: 39, desc: 'Chance de acerto crítico', runBonus: '+1 por missão diária', color: 'text-blue-400' },
    { key: 'luk', label: 'Sorte', value: 27, desc: 'Qualidade dos drops', runBonus: '+1 por dia consecutivo', color: 'text-yellow-300' },
    { key: 'def', label: 'Defesa', value: 55, desc: 'Redução de dano recebido', runBonus: '+1 por chefão derrotado', color: 'text-purple-400' },
  ]);

  const addPoint = (index: number) => {
    if (points <= 0) return;
    setPoints((p) => p - 1);
    setAttributes((prev) => {
      const next = [...prev];
      next[index].value += 1;
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Banner de Pontos Disponíveis */}
      <div className="flex justify-between items-center bg-amber-500/10 p-3 rounded-xl border border-amber-500/30">
        <span className="text-xs text-amber-300 font-semibold">Pontos de Atributo disponíveis:</span>
        <span className="text-lg font-black text-amber-400 bg-amber-500/20 px-3 py-0.5 rounded-lg border border-amber-400/40">
          {points}
        </span>
      </div>

      {/* Lista de Atributos */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {attributes.map((attr, idx) => (
          <div key={attr.key} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={`text-xs font-black uppercase ${attr.color}`}>{attr.label}</p>
                <span className="text-xs font-bold text-slate-200">({attr.value})</span>
              </div>
              <p className="text-[10px] text-slate-400">{attr.desc}</p>
              <p className="text-[9px] text-amber-400/80 italic mt-0.5">🏃 Bônus: {attr.runBonus}</p>
            </div>

            <button
              onClick={() => addPoint(idx)}
              disabled={points <= 0}
              className={`w-8 h-8 rounded-lg font-black text-base flex items-center justify-center transition active:scale-90 ${
                points > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};