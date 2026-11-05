import { useState, useEffect, useRef } from 'react';
import { PlayerStats } from '../domain/types/game';
import { ActivityTracker } from '../infrastructure/sensors/ActivityTracker';

const STORAGE_KEY = 'HERMES_GAME_SAVE_V1';

export function useGameEngine() {
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      level: 1,
      distanceTraveledMeters: 0,
      stepsCount: 0,
      gold: 0,
      gems: 0,
      speedMultiplier: 1.0,
    };
  });

  const trackerRef = useRef<ActivityTracker | null>(null);

  // 1. Iniciar Rastreamento Físico de Passos
  useEffect(() => {
    trackerRef.current = new ActivityTracker();
    trackerRef.current.startTracking((steps, distance) => {
      setStats((prev) => {
        // Passos físicos dão um bônus de ouro instantâneo e avanço rápido de distância
        const bonusGold = Math.floor(steps * 2 * prev.speedMultiplier);
        return {
          ...prev,
          stepsCount: prev.stepsCount + steps,
          distanceTraveledMeters: prev.distanceTraveledMeters + distance,
          gold: prev.gold + bonusGold,
        };
      });
    });

    return () => trackerRef.current?.stopTracking();
  }, []);

  // 2. Game Loop Passivo (Idle Progression via Delta Time)
  useEffect(() => {
    let lastTime = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000; // segundos passados
      lastTime = now;

      setStats((prev) => {
        const passiveSpeed = 0.5 * prev.speedMultiplier; // 0.5 m/s passivo
        const addedDistance = passiveSpeed * dt;
        const addedGold = Math.floor(addedDistance * 0.2);

        return {
          ...prev,
          distanceTraveledMeters: prev.distanceTraveledMeters + addedDistance,
          gold: prev.gold + addedGold,
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // 3. Persistência Automática
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  const triggerManualStep = () => trackerRef.current?.simulateStep();

  return { stats, setStats, triggerManualStep };
}