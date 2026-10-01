export class ActivityTracker {
  private lastStepTimestamp: number = 0;
  private stepCallback?: (steps: number, distanceMeters: number) => void;

  public startTracking(onActivity: (steps: number, distanceMeters: number) => void) {
    this.stepCallback = onActivity;

    // Tenta usar API de Acelerômetro no celular
    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', this.handleMotion.bind(this));
    }
  }

  private handleMotion(event: DeviceMotionEvent) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    // Algoritmo simples de detecção de pico de aceleração (Passo)
    const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
    const now = Date.now();

    // Limiar empírico para um passo humanamente realista (~1.2G a 1.5G)
    if (magnitude > 13 && now - this.lastStepTimestamp > 350) {
      this.lastStepTimestamp = now;
      const stepLengthMeters = 0.75; // Médio comprimento do passo
      this.stepCallback?.(1, stepLengthMeters);
    }
  }

  // Método utilitário para simulação manual no Desktop (Modo de Testes)
  public simulateStep() {
    this.stepCallback?.(1, 0.75);
  }

  public stopTracking() {
    if ('DeviceMotionEvent' in window) {
      window.removeEventListener('devicemotion', this.handleMotion.bind(this));
    }
  }
}