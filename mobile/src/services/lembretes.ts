import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CANAL = 'hidratacao';
const HORA_INICIO = 8;
const HORA_FIM = 20;

// Vira true só se o canal foi criado com sucesso neste aparelho
let canalDisponivel = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function garantirPermissao(): Promise<boolean> {
  const atual = await Notifications.getPermissionsAsync();
  if (atual.status === 'granted') return true;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.status === 'granted';
}

// O canal é opcional: se falhar, as notificações usam o canal padrão do Android
async function prepararCanal() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Lembretes de hidratação',
      importance: 4, // 4 = importância alta
    });
    canalDisponivel = true;
  } catch (e) {
    canalDisponivel = false;
    console.warn('Canal de notificação indisponível, usando o padrão do sistema.', e);
  }
}

const canal = () => (canalDisponivel ? { channelId: CANAL } : {});

// Agenda um lembrete diário a cada N horas, entre 8h e 20h
export async function agendarLembretes(intervaloHoras: number): Promise<boolean> {
  if (!(await garantirPermissao())) return false;
  await prepararCanal();
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (let hora = HORA_INICIO; hora <= HORA_FIM; hora += intervaloHoras) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Hora de beber água!', body: 'Registre seu consumo no Task Running e ganhe XP.' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hora,
        minute: 0,
        ...canal(),
      },
    });
  }
  return true;
}

export async function cancelarLembretes(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Dispara uma notificação em 5 segundos, só para você conferir que funciona
export async function testarLembrete(): Promise<boolean> {
  if (!(await garantirPermissao())) return false;
  await prepararCanal();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Teste de lembrete', body: 'Se você viu isto, os lembretes funcionam.' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      ...canal(),
    },
  });
  return true;
}