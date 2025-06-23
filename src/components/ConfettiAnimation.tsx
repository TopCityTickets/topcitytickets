"use client";

import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  color: string;
  size: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
}

export default function ConfettiAnimation() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const colors = ['#E946E7', '#4F7CFF', '#FFD700', '#FF6B6B', '#00D4AA'];
    const pieces: ConfettiPiece[] = [];

    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        left: Math.random() * 100,
        animationDuration: Math.random() * 3 + 2,
        animationDelay: Math.random() * 2,
      });
    }

    setConfetti(pieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall opacity-60"
          style={{
            backgroundColor: piece.color,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            left: `${piece.left}%`,
            animationDuration: `${piece.animationDuration}s`,
            animationDelay: `${piece.animationDelay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  );
}
