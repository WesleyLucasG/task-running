export interface PlayerStats {
  level: number;
  distanceTraveledMeters: number;
  stepsCount: number;
  gold: number;
  gems: number;
  speedMultiplier: number; // Multiplicador vindo de upgrades
}

export interface Chest {
  id: string;
  requiredDistanceMeters: number;
  rewards: {
    gold: number;
    gems: number;
  };
  isUnlocked: boolean;
  isOpened: boolean;
}

export interface Upgrade {
  id: string;
  name: string;
  baseCost: number;
  costMultiplier: number;
  level: number;
  speedBonusPerLevel: number;
}