import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const RaceScreen: React.FC = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [path, setPath] = useState<[number, number][]>([]);

  // Rastreamento GPS em tempo real via HTML5 Geolocation API
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        setPath((prev) => [...prev, coords]);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden text-white">
      
      {/* 70% DA TELA: MAPA DE CORRIDA */}
      <section className="h-[70vh] w-full relative border-b-2 border-amber-500/30">
        {position ? (
          <MapContainer center={position} zoom={17} scrollWheelZoom={false} className="h-full w-full z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} />
            <Polyline positions={path} color="#f59e0b" weight={5} />
          </MapContainer>
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-900 text-slate-400">
            Aguardando sinal de GPS...
          </div>
        )}
      </section>

      {/* 30% DA TELA: INFORMAÇÕES E RECOMPENSAS */}
      <section className="h-[30vh] w-full bg-slate-900 p-4 flex flex-col justify-between border-t border-slate-800">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase">Distância</p>
            <p className="text-lg font-extrabold text-amber-400">1.4 <span className="text-xs">km</span></p>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase">Ritmo</p>
            <p className="text-lg font-extrabold text-emerald-400">5'30" <span className="text-xs">/km</span></p>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase">Ouro</p>
            <p className="text-lg font-extrabold text-yellow-300">💰 120</p>
          </div>
        </div>

        <button className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm uppercase">
          Finalizar Corrida
        </button>
      </section>

    </div>
  );
};