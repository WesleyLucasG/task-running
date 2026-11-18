// RNF11: coordenadas GPS guardadas no aparelho são criptografadas com AES-256-GCM.
// O GCM também autentica: um ponto adulterado no SQLite (para "aumentar" a distância)
// falha na leitura em vez de ser aceito. O horário fica em claro (só serve para ordenar).
import { gcm } from '@noble/ciphers/aes.js';
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js';

export type CoordenadasGps = { latitude: number; longitude: number; altitude: number | null };

const VERSAO = 'g1:';

/** nonce: 12 bytes aleatórios e únicos por ponto (nunca reutilizar com a mesma chave). */
export function cifrarPonto(chave: Uint8Array, nonce: Uint8Array, c: CoordenadasGps, atividadeId: string): string {
  if (chave.length !== 32) throw new Error('Chave GPS inválida.');
  if (nonce.length !== 12) throw new Error('Nonce inválido.');
  const claro = utf8ToBytes(JSON.stringify([c.latitude, c.longitude, c.altitude]));
  // atividadeId como dado associado: o ponto não pode ser "movido" para outra atividade
  const cifrado = gcm(chave, nonce, utf8ToBytes(atividadeId)).encrypt(claro);
  return VERSAO + bytesToHex(nonce) + bytesToHex(cifrado);
}

export function decifrarPonto(chave: Uint8Array, armazenado: string, atividadeId: string): CoordenadasGps {
  if (!armazenado.startsWith(VERSAO)) throw new Error('Formato de ponto desconhecido.');
  const hex = armazenado.slice(VERSAO.length);
  const nonce = hexToBytes(hex.slice(0, 24));
  const cifrado = hexToBytes(hex.slice(24));
  const claro = gcm(chave, nonce, utf8ToBytes(atividadeId)).decrypt(cifrado); // lança se adulterado
  const [latitude, longitude, altitude] = JSON.parse(bytesToUtf8(claro)) as [number, number, number | null];
  return { latitude, longitude, altitude };
}
