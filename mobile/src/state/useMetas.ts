import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { apiConfigurada } from '../services/api';
import { listarMetas, Metas, resgatarMeta } from '../services/jogoRemoto';
import { avisarJogadorAlterado, ouvirJogadorAlterado } from './sinais';

type Dados = { metas: Metas; recebidoEm: number };

// Metas diárias/semanais: o servidor calcula progresso e período; o app só exibe e pede o resgate.
// O tempo restante parte dos segundos informados pelo servidor, descontado o tempo decorrido no
// aparelho desde a resposta (não depende da data/hora configurada no celular).
export function useMetas() {
  const disponivel = apiConfigurada();
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resgatando, setResgatando] = useState<string | null>(null);
  const [agora, setAgora] = useState(0);

  const recarregar = useCallback(async () => {
    if (!disponivel) return;
    try {
      const metas = await listarMetas();
      const instante = Date.now();
      setDados({ metas, recebidoEm: instante });
      setAgora(instante);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }, [disponivel]);

  useFocusEffect(
    useCallback(() => {
      recarregar();
      const id = setInterval(() => setAgora(Date.now()), 30000);
      return () => clearInterval(id);
    }, [recarregar]),
  );

  // Abates, corridas, água e vendas mudam o progresso: recarrega quando o jogador muda
  useEffect(() => ouvirJogadorAlterado(() => void recarregar()), [recarregar]);

  const decorrido = dados ? Math.max(0, (agora - dados.recebidoEm) / 1000) : 0;
  const restanteDiarias = dados ? dados.metas.segundosParaRenovarDiarias - decorrido : 0;
  const restanteSemanais = dados ? dados.metas.segundosParaRenovarSemanais - decorrido : 0;

  // Virou o dia com a tela aberta: busca as metas do novo período (verificado a cada tique de 30 s)
  useEffect(() => {
    if (!dados || restanteDiarias > 0) return;
    const t = setTimeout(() => void recarregar(), 1000);
    return () => clearTimeout(t);
  }, [dados, restanteDiarias, recarregar]);

  const resgatar = useCallback(
    async (codigo: string): Promise<number> => {
      setResgatando(codigo);
      try {
        const r = await resgatarMeta(codigo);
        await recarregar();
        avisarJogadorAlterado(); // moedas no cabeçalho
        return r.moedas;
      } finally {
        setResgatando(null);
      }
    },
    [recarregar],
  );

  return {
    disponivel,
    metas: dados?.metas ?? null,
    erro,
    resgatando,
    resgatar,
    recarregar,
    restanteDiarias,
    restanteSemanais,
  };
}
