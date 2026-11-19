import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { requisitosSenha } from '../domain/validacoes';
import { cores, espaco, fontes } from '../theme';

type Props = {
  senha: string;
  confirmacao?: string; // quando informado, também mostra se as senhas coincidem
};

// Checklist RF08 atualizado a cada tecla (mesmos textos do Web).
export function RequisitosSenha({ senha, confirmacao }: Props) {
  const requisitos = requisitosSenha(senha);
  const valida = requisitos.every((r) => r.atendido);
  const digitouConfirmacao = confirmacao !== undefined && confirmacao.length > 0;

  return (
    <View style={estilos.caixa} accessibilityLiveRegion="polite">
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>Sua senha deve conter:</Text>
        {senha.length > 0 && (
          <Text style={[estilos.status, { color: valida ? cores.sucesso : cores.dourado }]}>
            {valida ? 'Senha válida' : 'Ainda não é válida'}
          </Text>
        )}
      </View>
      {requisitos.map((r) => (
        <View
          key={r.id}
          style={estilos.linha}
          accessible
          accessibilityLabel={`${r.rotulo}: ${r.atendido ? 'atendido' : 'pendente'}`}>
          <Ionicons
            name={r.atendido ? 'checkmark-circle' : 'ellipse-outline'}
            size={16}
            color={r.atendido ? cores.sucesso : cores.textoApagado}
          />
          <Text style={[estilos.item, { color: r.atendido ? cores.sucesso : cores.textoSuave }]}>{r.rotulo}</Text>
        </View>
      ))}
      {digitouConfirmacao && (
        <View style={estilos.linha}>
          <Ionicons
            name={confirmacao === senha ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={confirmacao === senha ? cores.sucesso : cores.erro}
          />
          <Text style={[estilos.item, { color: confirmacao === senha ? cores.sucesso : cores.erro }]}>
            {confirmacao === senha ? 'As senhas coincidem' : 'As senhas não coincidem'}
          </Text>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    gap: espaco.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.bordaClara,
    backgroundColor: cores.superficie,
    padding: espaco.md,
  },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  titulo: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 13 },
  status: { fontFamily: fontes.mono, fontSize: 11 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  item: { fontFamily: fontes.texto, fontSize: 13 },
});
