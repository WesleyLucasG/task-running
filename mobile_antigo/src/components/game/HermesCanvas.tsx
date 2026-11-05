import React, { useRef, useEffect } from 'react';

interface HermesCanvasProps {
  speed: number;
}

export const HermesCanvas: React.FC<HermesCanvasProps> = ({ speed }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgOffsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Atualiza o deslocamento do fundo proporcional à velocidade de Hermes
      bgOffsetRef.current = (bgOffsetRef.current + speed * 2) % canvas.width;

      // Limpar Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Desenhar Fundo Parallax Simples (Linhas de chão simulando velocidade)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 20);
      ctx.lineTo(canvas.width, canvas.height - 20);
      ctx.stroke();

      // Marcadores no chão rolando
      for (let x = -bgOffsetRef.current; x < canvas.width; x += 60) {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(x, canvas.height - 18, 20, 4);
      }

      // Desenhar Hermes (Sprite Simplificado/Retângulo Representativo com Animação de Salto)
      const bounce = Math.abs(Math.sin(Date.now() / 150 * (speed / 2))) * 10;
      const hermesX = 80;
      const hermesY = canvas.height - 60 - bounce;

      ctx.fillStyle = '#f59e0b'; // Cor Dourada de Hermes
      ctx.fillRect(hermesX, hermesY, 30, 40);

      // Asas dos pés (Detalhe conceitual)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hermesX - 5, hermesY + 30, 6, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [speed]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={180}
      className="w-full max-w-md rounded-lg shadow-lg border border-slate-700 bg-slate-900"
    />
  );
};