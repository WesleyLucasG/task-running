import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js';

// Chave AES-256 dos pontos GPS (RNF11): gerada uma vez por aparelho e guardada no
// SecureStore (Android Keystore), nunca no SQLite junto com os dados.
const CHAVE = 'tr.chave.gps.v1';
let cache: Uint8Array | null = null;

export async function chaveGps(): Promise<Uint8Array> {
  if (cache) return cache;
  const salva = await SecureStore.getItemAsync(CHAVE);
  if (salva) {
    cache = hexToBytes(salva);
    return cache;
  }
  const nova = Crypto.getRandomBytes(32);
  await SecureStore.setItemAsync(CHAVE, bytesToHex(nova));
  cache = nova;
  return nova;
}

export function novoNonce(): Uint8Array {
  return Crypto.getRandomBytes(12);
}
