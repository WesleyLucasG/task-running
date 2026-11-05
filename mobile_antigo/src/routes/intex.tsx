import React, { useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { HermesCanvas } from '../components/game/HermesCanvas';
import { RaceScreen } from '../components/RaceScreen';
import { BottomSheet } from '../components/ui/BottomSheet';
import 'leaflet/dist/leaflet.css';

type ActiveModal = 'inventory' | 'attributes' | 'shop' | 'map' | null;

export default function HomeGame() {
  const { stats, triggerManualStep } = useGameEngine();
  const [isRacing, setIsRacing] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const handleFinishRace = (rewards: { distanceMeters: number; goldEarned: number }) => {
    if (rewards.distanceMeters > 0) {
      triggerManualStep();
    }
    setIsRacing(false);
  };

  if (isRacing) {
    return <RaceScreen onFinish={handleFinishRace} />;
  }

  return (
    <main className="flex flex-col h-screen w-screen bg-[#0d1527] text-white overflow-y-auto justify-between p-4 space-y-3 font-sans">
      
      {/* 1. BARRA SUPERIOR (HUD DO HERÓI & EXPERIÊNCIA) */}
      <header className="flex flex-col gap-2 bg-[#131d33]/90 p-3 rounded-2xl border border-slate-700/60 shadow-lg backdrop-blur-md z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar do Herói */}
            <div className="relative w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center font-bold text-amber-400 text-sm">
              <span>12</span>
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-wide">
                {stats?.heroName || 'Wesley, o Veloz'}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Fase 4 · Ruínas de Eleusis
              </p>
            </div>
          </div>

          {/* Ouro */}
          <div className="bg-[#0a101d] px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 shadow-inner">
            <span className="text-sm">🪙</span>
            <span className="text-sm font-black text-amber-400">
              {stats?.gold ? stats.gold.toLocaleString('pt-BR') : '2.480'}
            </span>
          </div>
        </div>

        {/* Barra de XP */}
        <div className="w-full bg-[#090d18] rounded-full p-1 border border-slate-800">
          <div className="flex justify-between text-[10px] px-1 mb-0.5 text-slate-300 font-bold">
            <span className="text-amber-400">Nível 12</span>
            <span>1.640 / 2.400 XP</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-300"
              style={{ width: `${(1640 / 2400) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* 2. ÁREA CENTRAL: COMBATE 2D EM TEMPO REAL */}
      <section className="relative flex-1 min-h-[260px] flex flex-col justify-between bg-[#111a2e]/60 rounded-2xl border border-slate-700/50 overflow-hidden p-3 shadow-inner">
        
        {/* HUD de Combate (Onda, DPS e Baús) */}
        <div className="flex justify-between items-start z-10">
          <div className="flex items-center gap-2 bg-[#090e1a]/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-xs font-bold">
            <span className="text-amber-400">🛡️ Onda 7 / 10</span>
          </div>
          
          <div className="flex items-center gap-2 bg-[#090e1a]/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-xs font-bold">
            <span className="text-amber-400">⚡ DPS 214</span>
          </div>

          <div className="flex flex-col gap-1 text-[10px] font-bold">
            <span className="bg-[#1b263b] text-slate-300 px-2 py-0.5 rounded border border-slate-600">COMUM</span>
            <span className="bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/50">INCOMUM</span>
            <span className="bg-amber-950/80 text-amber-400 px-2 py-0.5 rounded border border-amber-500/50">RARO</span>
          </div>
        </div>

        {/* Canvas de Animação do Jogo */}
        <div className="absolute inset-0 z-0">
          <HermesCanvas speed={stats?.speedMultiplier || 1} />
        </div>

        {/* Progresso da Fase & Fala do Hermes */}
        <div className="z-10 flex flex-col gap-2 mt-auto">
          {/* Barra de Progresso da Fase */}
          <div className="bg-[#090e1a]/80 p-2 rounded-xl border border-slate-700/60 backdrop-blur-sm">
            <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
              <span>Progresso da fase</span>
              <span className="text-amber-400">72%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '72%' }} />
            </div>
          </div>

          {/* Diálogo do Hermes */}
          <div className="bg-[#090e1a]/90 p-3 rounded-xl border border-amber-500/40 flex items-center gap-3 backdrop-blur-md shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0">
              <span className="text-xl">🏛️</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">Hermes</p>
              <p className="text-xs text-slate-200 font-medium leading-snug">
                "Cada passo seu vira aço na lâmina do herói. Bora?"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MISSÕES DIÁRIAS */}
      <section className="bg-[#131d33]/90 p-3 rounded-2xl border border-slate-700/60 shadow-md">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400">🎯</span>
            <span className="text-xs font-black uppercase text-slate-200 tracking-wider">Missões diárias</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-bold">1/3</span>
          </div>
          <button className="text-xs font-bold text-amber-400 hover:underline">Ver todas &gt;</button>
        </div>

        <div className="bg-[#0a101d] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xl">🏃</span>
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-white">Correr 2 km</span>
                <span className="text-slate-400 text-[11px]">1.4 km / 2 · 70%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
          </div>
          <div className="ml-3 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 text-amber-400 text-xs font-bold">
            <span>🪙</span>
            <span>120</span>
          </div>
        </div>
      </section>

      {/* 4. ATALHOS RÁPIDOS */}
      <div className="grid grid-cols-4 gap-2 z-10">
        <button
          onClick={() => setActiveModal('inventory')}
          className="bg-[#131d33] hover:bg-[#1c2a47] border border-slate-700/60 p-2.5 rounded-xl text-center transition active:scale-95 shadow-md flex flex-col items-center justify-center"
        >
          <span className="text-xl mb-0.5">🎒</span>
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Inventário</span>
        </button>

        <button
          onClick={() => setActiveModal('attributes')}
          className="bg-[#131d33] hover:bg-[#1c2a47] border border-slate-700/60 p-2.5 rounded-xl text-center transition active:scale-95 shadow-md flex flex-col items-center justify-center"
        >
          <span className="text-xl mb-0.5">⚔️</span>
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Atributos</span>
        </button>

        <button
          onClick={() => setActiveModal('shop')}
          className="bg-[#131d33] hover:bg-[#1c2a47] border border-slate-700/60 p-2.5 rounded-xl text-center transition active:scale-95 shadow-md flex flex-col items-center justify-center"
        >
          <span className="text-xl mb-0.5">🏪</span>
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Loja</span>
        </button>

        <button
          onClick={() => setActiveModal('map')}
          className="bg-[#131d33] hover:bg-[#1c2a47] border border-slate-700/60 p-2.5 rounded-xl text-center transition active:scale-95 shadow-md flex flex-col items-center justify-center"
        >
          <span className="text-xl mb-0.5">🗺️</span>
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Mapa</span>
        </button>
      </div>

      {/* 5. BOTÃO PRINCIPAL DE CORRIDA */}
      <footer className="w-full z-10">
        <button
          onClick={() => setIsRacing(true)}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-95 transition text-slate-950 font-black rounded-2xl text-base shadow-lg shadow-orange-500/20 uppercase tracking-wider flex items-center justify-center gap-2 border border-amber-300/40"
        >
          <span className="text-xl">👟</span> INICIAR CORRIDA
        </button>
      </footer>

      {/* --- BOTTOM SHEETS (GAVETAS) --- */}

      <BottomSheet
        isOpen={activeModal === 'inventory'}
        onClose={() => setActiveModal(null)}
        title="Inventário (40/180)"
      >
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0a101d] p-3 rounded-xl border border-amber-500/30 text-center">
            <span className="text-2xl">🗡️</span>
            <p className="text-xs font-bold text-amber-400 mt-1">Xifos Raro</p>
            <p className="text-[10px] text-slate-400">+14 Força</p>
          </div>
          <div className="bg-[#0a101d] p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-2xl">🛡️</span>
            <p className="text-xs font-bold text-slate-300 mt-1">Hoplon</p>
            <p className="text-[10px] text-slate-400">+6 Defesa</p>
          </div>
          <div className="bg-[#0a101d] p-3 rounded-xl border border-purple-500/30 text-center">
            <span className="text-2xl">👟</span>
            <p className="text-xs font-bold text-purple-400 mt-1">Sandálias</p>
            <p className="text-[10px] text-slate-400">+30 Agilidade</p>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={activeModal === 'attributes'}
        onClose={() => setActiveModal(null)}
        title="Atributos (3 pts)"
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center bg-[#0a101d] p-3 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs font-bold text-amber-400">Força (62)</p>
              <p className="text-[10px] text-slate-400">Aumenta dano bruto</p>
            </div>
            <button className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs">+</button>
          </div>
          <div className="flex justify-between items-center bg-[#0a101d] p-3 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs font-bold text-emerald-400">Agilidade (71)</p>
              <p className="text-[10px] text-slate-400">Velocidade de ataque</p>
            </div>
            <button className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs">+</button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={activeModal === 'shop'}
        onClose={() => setActiveModal(null)}
        title="Loja Medieval"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0a101d] p-3 rounded-xl border border-slate-800 text-center">
            <p className="text-xs font-bold text-slate-200">Herói de Bronze</p>
            <p className="text-sm font-extrabold text-yellow-400 my-1">💰 900</p>
            <button className="w-full py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs">Comprar</button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={activeModal === 'map'}
        onClose={() => setActiveModal(null)}
        title="Mapa do Mundo"
      >
        <div className="flex flex-col gap-2">
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-400">Fase 1: Bosque de Arcádia</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Concluída</span>
          </div>
          <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-500/30 flex justify-between items-center">
            <span className="text-xs font-bold text-amber-400">Fase 4: Ruínas de Eleusis</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">Atual</span>
          </div>
        </div>
      </BottomSheet>

    </main>
  );
}