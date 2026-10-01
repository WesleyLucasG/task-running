// mobile/src/components/IdleGameEngine.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface IdleGameProps {
  distanceMeters: number;
  goalMeters: number;
  onBossUnlocked: () => void;
}

export const IdleGameEngine: React.FC<IdleGameProps> = ({
  distanceMeters,
  goalMeters,
  onBossUnlocked,
}) => {
  const [heroPos, setHeroPos] = useState(0);
  const isGoalReached = distanceMeters >= goalMeters;

  useEffect(() => {
    // Animação de caminhada Idle do herói proporcional à distância percorrida
    const progressPercent = Math.min((distanceMeters / goalMeters) * 100, 100);
    setHeroPos(progressPercent);
  }, [distanceMeters, goalMeters]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Mapa da Fase 1 - Floresta das Tarefas</Text>
      
      {/* Barra de Progresso do Jogador no Mapa */}
      <View style={styles.track}>
        <View style={[styles.heroMarker, { left: `${Math.max(0, heroPos - 5)}%` }]}>
          <Text style={styles.emoji}>🏃</Text>
        </View>
        <View style={styles.bossMarker}>
          <Text style={styles.emoji}>👹</Text>
        </View>
      </View>

      <Text style={styles.progressText}>
        Progresso: {distanceMeters}m / {goalMeters}m ({Math.round((distanceMeters / goalMeters) * 100)}%)
      </Text>

      {/* Liberação do confronto com o Chefe */}
      {isGoalReached ? (
        <TouchableOpacity style={styles.bossButton} onPress={onBossUnlocked}>
          <Text style={styles.bossButtonText}>⚔️ Enfrentar o Chefe da Fase</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.lockText}>Alcance a meta de distância para desbloquear o Chefe!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#1e1e2e', padding: 16, borderRadius: 12, marginVertical: 10 },
  title: { color: '#cba6f7', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  track: { height: 40, backgroundColor: '#313244', borderRadius: 20, justifyContent: 'center', position: 'relative', marginVertical: 10 },
  heroMarker: { position: 'absolute', top: 5 },
  bossMarker: { position: 'absolute', right: 10, top: 5 },
  emoji: { fontSize: 22 },
  progressText: { color: '#a6adc8', textAlign: 'center', marginVertical: 6 },
  bossButton: { backgroundColor: '#f38ba8', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  bossButtonText: { color: '#11111b', fontWeight: 'bold', fontSize: 15 },
  lockText: { color: '#6c7086', fontSize: 12, textAlign: 'center', fontStyle: 'italic', marginTop: 6 },
});