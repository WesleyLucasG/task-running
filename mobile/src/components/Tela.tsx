import { ReactNode, RefObject } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, ScrollViewInstance, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cores, espaco } from '../theme';

export function Tela({ children, rolagemRef }: { children: ReactNode; rolagemRef?: RefObject<ScrollViewInstance | null> }) {
  return (
    <SafeAreaView style={estilos.raiz} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={estilos.raiz}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={rolagemRef}
          contentContainerStyle={estilos.conteudo}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { flexGrow: 1, padding: espaco.lg, gap: espaco.md },
});