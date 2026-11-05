import React from 'react';

const STAGES = [
  { id: 1, name: 'Bosque de Arcádia', status: 'Concluída', icon: '🌲' },
  { id: 2, name: 'Trilha dos Sátiros', status: 'Concluída', icon: '🐾' },
  { id: 3, name: 'Clareira do Centauro', status: 'Chefão Derrotado', icon: '🏹' },
  { id: 4, name: 'Ruínas de Eleusis', status: 'Onda 7/10 (Atual)', icon: '🏛️' },
  { id: 5, name: 'Cripta de Mármore', status: 'Bloqueada', icon: '🪦' },
  { id: 6, name: 'Templo de Hélio', status: 'Bloqueada', icon: '☀️' },
  { id: 7, name: 'Pátio das Oferendas', status: 'Bloqueada', icon: '🏺' },
  { id: 8, name: 'Encosta do Olimpo', status: 'Bloqueada', icon: '⛰️' },
  { id: 9, name: 'Vale Gelado', status: 'Bloqueada', icon: '❄️' },
  { id: 10, name: 'Cume do Trovão', status: 'Chefão Final', icon: '⚡' },
];

export const WorldMapSheet: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto pr-1">
      {STAGES.map((stage) => {
        const isCurrent = stage.status.includes('Atual');
        const isCompleted = stage.status.includes('Concluída') || stage.status.includes('Derrotado');

        return (
          <div
            key={stage.id}
            className={`p-3 rounded-xl border flex items-center justify-between transition ${
              isCurrent
                ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                : isCompleted
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stage.icon}</span>
              <div>
                <p className="text-xs font-bold">Fase {stage.id}: {stage.name}</p>
                <p className="text-[10px] opacity-80">{stage.status}</p>
              </div>
            </div>

            {isCurrent && (
              <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full uppercase">
                Em Combate
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};