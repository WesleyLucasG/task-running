import * as Crypto from 'expo-crypto';
import type { Ferramentas } from './regrasLoot';

// Número aleatório em [0, 1) vindo do gerador criptográfico do sistema
export function aleatorioSeguro(): number {
  return Crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}

export const ferramentasReais: Ferramentas = {
  aleatorio: aleatorioSeguro,
  novoId: () => Crypto.randomUUID(),
  agora: () => new Date(),
};
