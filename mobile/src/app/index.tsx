import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayWaterTotal, addWaterLog } from '../database/waterRepository';
import { captureCurrentLocation } from '../services/locationService';

type ActiveModal = 'inventory' | 'attributes' | 'shop' | 'map' | null;

interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  bonusText: string;
  rarity: 'common' | 'uncommon' | 'rare';
}

export default function HomeScreen() {
  // --- ESTADOS DO JOGO & PERSONAGEM ---
  const [level, setLevel] = useState(12);
  const [coins, setCoins] = useState(2480);
  const [xp, setXp] = useState(1640);
  const maxXp = 2400;

  // --- ATRIBUTOS DO HERÓI & PROGRESSÃO ---
  const [attributePoints, setAttributePoints] = useState(3);
  const [strength, setStrength] = useState(62);
  const [agility, setAgility] = useState(71);

  // DPS calculado em tempo real com base na Força e Agilidade
  const dps = Math.floor(strength * 2.2 + agility * 1.5);

  // --- INVENTÁRIO DO HERÓI ---
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', name: 'Xifos Raro', icon: '🗡️', bonusText: '+14 Força', rarity: 'rare' },
    { id: '2', name: 'Hoplon', icon: '🛡️', bonusText: '+6 Defesa', rarity: 'common' },
    { id: '3', name: 'Sandálias de Hermes', icon: '👟', bonusText: '+30 Agilidade', rarity: 'uncommon' },
  ]);

  // --- MODAIS DO MENU ---
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // --- ESTADOS DA FASE & RPG IDLE ---
  const [phaseName] = useState('Fase 4 - Ruínas de Elêusis');
  const [wave, setWave] = useState(7);
  const maxWave = 10;
  const [distanceKm, setDistanceKm] = useState(1.4); // km percorridos
  const goalKm = 2.0; // meta da fase em km

  // --- ESTADOS DE SUPORTE (GPS E ÁGUA) ---
  const [isTrackingGps, setIsTrackingGps] = useState(false);
  const [waterTotal, setWaterTotal] = useState(0);

  useEffect(() => {
    try {
      const water = getTodayWaterTotal();
      setWaterTotal(water);
    } catch (e) {
      console.log('Banco de dados em inicialização...');
    }
  }, []);

  // Progresso da fase em porcentagem
  const phaseProgress = Math.min(Math.round((distanceKm / goalKm) * 100), 100);
  const isBossUnlocked = distanceKm >= goalKm;

  // Ações de Atributos
  const handleUpgradeStrength = () => {
    if (attributePoints > 0) {
      setAttributePoints((prev) => prev - 1);
      setStrength((prev) => prev + 2);
    } else {
      Alert.alert('Pontos Insuficientes', 'Você não possui pontos de atributo disponíveis!');
    }
  };

  const handleUpgradeAgility = () => {
    if (attributePoints > 0) {
      setAttributePoints((prev) => prev - 1);
      setAgility((prev) => prev + 2);
    } else {
      Alert.alert('Pontos Insuficientes', 'Você não possui pontos de atributo disponíveis!');
    }
  };

  // Ação de Compra na Loja
  const handleBuyItem = (
    item: { name: string; icon: string; price: number; strBonus: number; agiBonus: number; rarity: 'common' | 'uncommon' | 'rare' }
  ) => {
    if (coins >= item.price) {
      setCoins((prev) => prev - item.price);
      setStrength((prev) => prev + item.strBonus);
      setAgility((prev) => prev + item.agiBonus);

      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name: item.name,
        icon: item.icon,
        bonusText: item.strBonus > 0 ? `+${item.strBonus} Força` : `+${item.agiBonus} Agilidade`,
        rarity: item.rarity,
      };

      setInventory((prev) => [...prev, newItem]);
      Alert.alert('Compra Realizada! 🛍️', `${item.name} adicionado ao seu inventário e atributos aumentados!`);
    } else {
      Alert.alert('Ouro Insuficiente', 'Você precisa de mais moedas para comprar este item!');
    }
  };

  // Ação Principal
  const handleMainAction = async () => {
    if (isBossUnlocked) {
      Alert.alert(
        '⚔️ BATALHA CONTRA O CHEFÃO!',
        'Você entrou na arena contra o Guardião das Ruínas de Elêusis!',
        [{ text: 'Iniciar Combate', onPress: () => setWave(10) }]
      );
    } else {
      setIsTrackingGps(!isTrackingGps);
      try {
        if (!isTrackingGps) {
          await captureCurrentLocation();
          setDistanceKm((prev) => parseFloat((prev + 0.2).toFixed(1)));
          setCoins((prev) => prev + 50);
          setXp((prev) => Math.min(prev + 150, maxXp));
        }
      } catch (err) {
        Alert.alert('Aviso GPS', 'GPS ativo em modo de simulação offline.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#070c1e" />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* 1. HUD SUPERIOR DO JOGO */}
        <View style={styles.hudCard}>
          <View style={styles.hudHeaderRow}>
            <View style={styles.profileBox}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>🏃</Text>
              </View>
              <View>
                <Text style={styles.playerName}>Wesley, o Veloz</Text>
                <Text style={styles.locationText}>{phaseName}</Text>
              </View>
            </View>

            <View style={styles.resourcesBox}>
              <View style={styles.resourceBadge}>
                <Text style={styles.resourceText}>🪙 {coins.toLocaleString('pt-BR')}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>⭐ {level}</Text>
              </View>
            </View>
          </View>

          {/* Barra de XP */}
          <View style={styles.xpSection}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpTitle}>Nível {level}</Text>
              <Text style={styles.xpValue}>{xp} / {maxXp} XP</Text>
            </View>
            <View style={styles.barBackground}>
              <View style={[styles.barFill, { width: `${(xp / maxXp) * 100}%`, backgroundColor: '#f5a623' }]} />
            </View>
          </View>
        </View>

        {/* 2. ARENA DE COMBATE 2D IDLE */}
        <View style={styles.arenaCard}>
          <View style={styles.arenaHeader}>
            <View style={styles.waveBadge}>
              <Text style={styles.waveText}>Onda {wave}/{maxWave}</Text>
            </View>
            <Text style={styles.dpsText}>⚡ DPS {dps}</Text>
          </View>

          {/* Campo de Batalha (Cenário RPG) */}
          <View style={styles.battleground}>
            {/* Indicadores de Drops / Baús */}
            <View style={styles.chestsContainer}>
              <View style={[styles.chestBadge, { backgroundColor: '#1e293b' }]}>
                <Text style={styles.chestText}>COMUM</Text>
              </View>
              <View style={[styles.chestBadge, { backgroundColor: '#064e3b' }]}>
                <Text style={[styles.chestText, { color: '#34d399' }]}>INCOMUM</Text>
              </View>
              <View style={[styles.chestBadge, { backgroundColor: '#78350f' }]}>
                <Text style={[styles.chestText, { color: '#fbbf24' }]}>RARO</Text>
              </View>
            </View>

            {/* Personagem e Inimigo em Batalha */}
            <View style={styles.spritesRow}>
              <View style={styles.heroSprite}>
                <Text style={styles.spriteText}>🗡️</Text>
                <Text style={styles.spriteLabel}>Herói</Text>
              </View>
              <Text style={styles.vsText}>⚔️</Text>
              <View style={styles.enemySprite}>
                <Text style={styles.spriteText}>👾</Text>
                <Text style={styles.spriteLabel}>Inimigo</Text>
              </View>
            </View>

            {/* Barra de Progresso da Fase */}
            <View style={styles.phaseProgressBox}>
              <View style={styles.phaseProgressHeader}>
                <Text style={styles.phaseProgressTitle}>Progresso da fase</Text>
                <Text style={styles.phaseProgressPercent}>{phaseProgress}%</Text>
              </View>
              <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: `${phaseProgress}%`, backgroundColor: '#ff9800' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* 3. BALÃO DE DIÁLOGO DO GUIA HERMES */}
        <View style={styles.hermesCard}>
          <View style={styles.hermesAvatar}>
            <Text style={{ fontSize: 24 }}>🏛️</Text>
          </View>
          <View style={styles.hermesContent}>
            <Text style={styles.hermesName}>HERMES</Text>
            <Text style={styles.hermesText}>
              "Beba água, mortal! Registrado hoje: {waterTotal} ml. Fortaleça seus atributos para superar o chefão!"
            </Text>
          </View>
        </View>

        {/* 4. MISSÕES DIÁRIAS */}
        <View style={styles.missionsCard}>
          <View style={styles.missionsHeader}>
            <Text style={styles.missionsTitle}>🎯 Missões diárias (1/3)</Text>
            <TouchableOpacity onPress={() => {
              addWaterLog(250);
              setWaterTotal((prev) => prev + 250);
            }}>
              <Text style={styles.seeAllText}>+ 250ml Água</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.missionItem}>
            <View style={styles.missionInfoRow}>
              <Text style={styles.missionName}>Correr 2 km</Text>
              <Text style={styles.missionReward}>🪙 +120</Text>
            </View>
            <Text style={styles.missionProgressText}>{distanceKm} km / {goalKm} km ({phaseProgress}%)</Text>
            <View style={styles.barBackground}>
              <View style={[styles.barFill, { width: `${phaseProgress}%`, backgroundColor: '#3498db' }]} />
            </View>
          </View>
        </View>

        {/* 5. MENU DE ATALHOS RÁPIDOS */}
        <View style={styles.quickMenuGrid}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setActiveModal('inventory')}>
            <Text style={styles.menuIcon}>🎒</Text>
            <Text style={styles.menuLabel}>Inventário</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => setActiveModal('attributes')}>
            <Text style={styles.menuIcon}>⚔️</Text>
            <Text style={styles.menuLabel}>Atributos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => setActiveModal('shop')}>
            <Text style={styles.menuIcon}>🏪</Text>
            <Text style={styles.menuLabel}>Loja</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => setActiveModal('map')}>
            <Text style={styles.menuIcon}>🗺️</Text>
            <Text style={styles.menuLabel}>Mapa</Text>
          </TouchableOpacity>
        </View>

        {/* 6. BOTÃO PRINCIPAL DE AÇÃO */}
        <TouchableOpacity
          style={[
            styles.mainActionButton,
            isBossUnlocked ? styles.bossActionButton : styles.runActionButton,
          ]}
          onPress={handleMainAction}
        >
          <Text style={styles.mainActionButtonText}>
            {isBossUnlocked ? '🔥 ENFRENTAR CHEFÃO' : isTrackingGps ? '⏹️ PAUSAR CORRIDA' : '🏃 INICIAR CORRIDA'}
          </Text>
          <Text style={styles.mainActionSubtext}>
            {isBossUnlocked
              ? 'A fase 4 está pronta para o combate final!'
              : `Faltam ${(goalKm - distanceKm).toFixed(1)} km para desbloquear o Chefão`}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* --- MODAIS DE NAVEGAÇÃO --- */}

      {/* MODAL: ATRIBUTOS */}
      <Modal visible={activeModal === 'attributes'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚔️ Atributos ({attributePoints} pts disponíveis)</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.attributeRow}>
                <View>
                  <Text style={styles.attributeName}>Força ({strength})</Text>
                  <Text style={styles.attributeDesc}>Aumenta o dano físico do herói</Text>
                </View>
                <TouchableOpacity style={styles.plusButton} onPress={handleUpgradeStrength}>
                  <Text style={styles.plusButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.attributeRow}>
                <View>
                  <Text style={styles.attributeName}>Agilidade ({agility})</Text>
                  <Text style={styles.attributeDesc}>Aumenta a velocidade de ataque</Text>
                </View>
                <TouchableOpacity style={styles.plusButton} onPress={handleUpgradeAgility}>
                  <Text style={styles.plusButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dpsSummaryBox}>
                <Text style={styles.dpsSummaryTitle}>DPS TOTAL</Text>
                <Text style={styles.dpsSummaryValue}>⚡ {dps}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: INVENTÁRIO */}
      <Modal visible={activeModal === 'inventory'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎒 Inventário ({inventory.length}/180)</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.inventoryGrid}>
              {inventory.map((item) => (
                <View key={item.id} style={styles.inventoryCard}>
                  <Text style={styles.inventoryIcon}>{item.icon}</Text>
                  <Text style={styles.inventoryItemName}>{item.name}</Text>
                  <Text style={styles.inventoryItemBonus}>{item.bonusText}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: LOJA */}
      <Modal visible={activeModal === 'shop'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏪 Loja de Equipamentos</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.shopCoinsBox}>
              <Text style={styles.shopCoinsText}>Seu Saldo: 🪙 {coins.toLocaleString('pt-BR')}</Text>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {[
                { name: 'Xifos de Aço', icon: '🗡️', price: 500, strBonus: 10, agiBonus: 0, rarity: 'uncommon' as const },
                { name: 'Sandálias Aladas', icon: '👟', price: 750, strBonus: 0, agiBonus: 15, rarity: 'rare' as const },
                { name: 'Elmo de Bronze', icon: '🪖', price: 900, strBonus: 8, agiBonus: 8, rarity: 'rare' as const },
              ].map((item, index) => (
                <View key={index} style={styles.shopItemRow}>
                  <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.shopItemTitle}>{item.name}</Text>
                    <Text style={styles.shopItemSubtitle}>
                      {item.strBonus > 0 ? `+${item.strBonus} Força ` : ''}
                      {item.agiBonus > 0 ? `+${item.agiBonus} Agilidade` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.buyButton} onPress={() => handleBuyItem(item)}>
                    <Text style={styles.buyButtonText}>🪙 {item.price}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: MAPA */}
      <Modal visible={activeModal === 'map'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🗺️ Mapa do Mundo</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.mapPhaseItemConcluded}>
                <Text style={styles.mapPhaseTitle}>Fase 1: Bosque de Arcádia</Text>
                <Text style={styles.mapPhaseStatusCompleted}>Concluída</Text>
              </View>
              <View style={styles.mapPhaseItemCurrent}>
                <Text style={styles.mapPhaseTitleCurrent}>Fase 4: Ruínas de Elêusis</Text>
                <Text style={styles.mapPhaseStatusCurrent}>Atual</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070c1e' },
  container: { padding: 14, gap: 12 },
  
  // HUD
  hudCard: { backgroundColor: '#101a35', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1f2e54' },
  hudHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#253761', justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 20 },
  playerName: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  locationText: { color: '#8b9bb4', fontSize: 12 },
  resourcesBox: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  resourceBadge: { backgroundColor: '#1a294d', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#2d4375' },
  resourceText: { color: '#f1c40f', fontWeight: 'bold', fontSize: 13 },
  levelBadge: { backgroundColor: '#e67e22', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  levelBadgeText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  
  xpSection: { marginTop: 10 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  xpTitle: { color: '#8b9bb4', fontSize: 11, fontWeight: 'bold' },
  xpValue: { color: '#8b9bb4', fontSize: 11 },

  // Barra de progresso genérica
  barBackground: { height: 8, backgroundColor: '#1a2542', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },

  // Arena 2D
  arenaCard: { backgroundColor: '#101a35', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1f2e54' },
  arenaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  waveBadge: { backgroundColor: '#1e2c4f', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  waveText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  dpsText: { color: '#f5a623', fontSize: 13, fontWeight: 'bold' },
  battleground: { backgroundColor: '#091124', borderRadius: 8, padding: 12, alignItems: 'center' },
  chestsContainer: { flexDirection: 'row', gap: 6, alignSelf: 'flex-end', marginBottom: 12 },
  chestBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  chestText: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold' },
  spritesRow: { flexDirection: 'row', alignItems: 'center', gap: 30, marginVertical: 16 },
  heroSprite: { alignItems: 'center' },
  enemySprite: { alignItems: 'center' },
  spriteText: { fontSize: 36 },
  spriteLabel: { color: '#8b9bb4', fontSize: 11, marginTop: 4 },
  vsText: { color: '#e74c3c', fontSize: 18, fontWeight: 'bold' },
  phaseProgressBox: { width: '100%', marginTop: 10 },
  phaseProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  phaseProgressTitle: { color: '#8b9bb4', fontSize: 12 },
  phaseProgressPercent: { color: '#ff9800', fontSize: 12, fontWeight: 'bold' },

  // Hermes
  hermesCard: { backgroundColor: '#101e3d', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: '#213561' },
  hermesAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#243b6e', justifyContent: 'center', alignItems: 'center' },
  hermesContent: { flex: 1 },
  hermesName: { color: '#f5a623', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  hermesText: { color: '#d0dbe8', fontSize: 12, marginTop: 2, fontStyle: 'italic' },

  // Missões
  missionsCard: { backgroundColor: '#101a35', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1f2e54' },
  missionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  missionsTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  seeAllText: { color: '#3498db', fontSize: 12 },
  missionItem: { backgroundColor: '#091124', padding: 10, borderRadius: 8 },
  missionInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  missionName: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  missionReward: { color: '#f1c40f', fontSize: 12, fontWeight: 'bold' },
  missionProgressText: { color: '#8b9bb4', fontSize: 11, marginBottom: 6 },

  // Atalhos Rápidos Grid
  quickMenuGrid: { flexDirection: 'row', gap: 8 },
  menuButton: { flex: 1, backgroundColor: '#101a35', paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1f2e54' },
  menuIcon: { fontSize: 20, marginBottom: 2 },
  menuLabel: { color: '#cbd5e1', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

  // Botão de Ação Principal
  mainActionButton: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  runActionButton: { backgroundColor: '#f39c12' },
  bossActionButton: { backgroundColor: '#e74c3c' },
  mainActionButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 18, letterSpacing: 0.5 },
  mainActionSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4 },

  // Modais Estilização
  modalOverlay: { flex: 1, backgroundColor: 'rgba(7, 12, 30, 0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#101a35', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderWidth: 1, borderColor: '#2d4375' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  closeButton: { color: '#94a3b8', fontSize: 20, fontWeight: 'bold', padding: 4 },
  modalBody: { gap: 12 },

  // Atributos Modal
  attributeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#091124', padding: 12, borderRadius: 10 },
  attributeName: { color: '#f5a623', fontWeight: 'bold', fontSize: 14 },
  attributeDesc: { color: '#64748b', fontSize: 11 },
  plusButton: { backgroundColor: '#f5a623', width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  plusButtonText: { color: '#070c1e', fontWeight: 'bold', fontSize: 18 },
  dpsSummaryBox: { backgroundColor: '#1a294d', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  dpsSummaryTitle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  dpsSummaryValue: { color: '#f5a623', fontSize: 22, fontWeight: 'bold', marginTop: 2 },

  // Inventário Modal
  inventoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  inventoryCard: { width: '31%', backgroundColor: '#091124', padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1f2e54' },
  inventoryIcon: { fontSize: 24, marginBottom: 4 },
  inventoryItemName: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  inventoryItemBonus: { color: '#94a3b8', fontSize: 9, marginTop: 2 },

  // Loja Modal
  shopCoinsBox: { backgroundColor: '#091124', padding: 8, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  shopCoinsText: { color: '#f1c40f', fontWeight: 'bold', fontSize: 13 },
  shopItemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#091124', padding: 10, borderRadius: 10, marginBottom: 8 },
  shopItemTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  shopItemSubtitle: { color: '#34d399', fontSize: 11 },
  buyButton: { backgroundColor: '#f5a623', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  buyButtonText: { color: '#070c1e', fontWeight: 'bold', fontSize: 12 },

  // Mapa Modal
  mapPhaseItemConcluded: { backgroundColor: '#064e3b', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mapPhaseTitle: { color: '#34d399', fontWeight: 'bold', fontSize: 13 },
  mapPhaseStatusCompleted: { color: '#a7f3d0', fontSize: 10, backgroundColor: '#022c22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  mapPhaseItemCurrent: { backgroundColor: '#78350f', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mapPhaseTitleCurrent: { color: '#fbbf24', fontWeight: 'bold', fontSize: 13 },
  mapPhaseStatusCurrent: { color: '#fef3c7', fontSize: 10, backgroundColor: '#451a03', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
});