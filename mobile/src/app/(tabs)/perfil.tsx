import { StyleSheet, Text } from 'react-native';
import { Botao } from '../../components/Botao';
import { Tela } from '../../components/Tela';
import { useAuth } from '../../state/AuthContext';
import { cores, espaco, fontes } from '../../theme';

export default function Perfil() {
  const { usuario, sair } = useAuth();

  return (
    <Tela>
      <Text style={estilos.titulo}>PERFIL</Text>
      <Text style={estilos.nome}>{usuario?.nome}</Text>
      <Text style={estilos.texto}>{usuario?.email}</Text>
      <Text style={estilos.texto}>Meta diária de água: {usuario?.metaAguaMl} ml</Text>
      <Botao titulo="SAIR" variante="contorno" onPress={sair} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontFamily: fontes.pixel, color: cores.laranja, fontSize: 16, marginTop: espaco.md },
  nome: { color: cores.texto, fontSize: 20, fontWeight: '700' },
  texto: { color: cores.textoSuave, fontSize: 15 },
});