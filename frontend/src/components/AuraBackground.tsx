import { useEffect, useRef } from 'react';

const ORBS = [
  {
    size: '50vmax',
    color: 'rgba(57,197,187,0.6)',
    colorMid: 'rgba(57,197,187,0.2)',
  },
  {
    size: '45vmax',
    color: 'rgba(243,44,158,0.6)',
    colorMid: 'rgba(243,44,158,0.2)',
  },
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomPosition() {
  return {
    x: randomBetween(-20, 60),
    y: randomBetween(-20, 60),
    scale: randomBetween(0.9, 1.15),
  };
}

export default function AuraBackground() {
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Keep track of the current timeout for each orb to avoid memory leaks
    const currentTimeouts = new Map<number, NodeJS.Timeout>();

    orbRefs.current.forEach((el, index) => {
      if (!el) return;

      // Set initial random position immediately (no transition)
      const initialPos = randomPosition();
      el.style.transition = 'none';
      el.style.transform = `translate(${initialPos.x}vw, ${initialPos.y}vh) scale(${initialPos.scale})`;

      const animateOrb = () => {
        if (!el) return;

        // 1. Move to a random spot
        const pos = randomPosition();
        const travelDuration = randomBetween(12, 20); // 12-20 seconds to move

        el.style.transition = `transform ${travelDuration}s cubic-bezier(0.4, 0, 0.2, 1)`;
        el.style.transform = `translate(${pos.x}vw, ${pos.y}vh) scale(${pos.scale})`;

        // 2. Stop/pause randomly at the destination (2 to 6 seconds)
        const pauseDuration = randomBetween(2, 6);
        const totalDuration = (travelDuration + pauseDuration) * 1000;

        const timeout = setTimeout(animateOrb, totalDuration);
        currentTimeouts.set(index, timeout);
      };

      // Start the loop after a small initial delay to let the initial position register
      const startTimeout = setTimeout(animateOrb, 100);
      currentTimeouts.set(index, startTimeout);
    });

    return () => {
      currentTimeouts.forEach((timeout) => clearTimeout(timeout));
      currentTimeouts.clear();
    };
  }, []);

  return (
    <div className="miku-aura-bg">
      {ORBS.map((orb, i) => (
        <div
          key={i}
          ref={(el) => { orbRefs.current[i] = el; }}
          style={{
            position: 'absolute',
            width: orb.size,
            height: orb.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color} 0%, ${orb.colorMid} 40%, ${orb.color.replace('0.6', '0').replace('0.2', '0')} 70%)`,
            animation: `pulseGlow ${randomBetween(4, 8)}s ease-in-out ${randomBetween(0, 3)}s infinite alternate`,
            willChange: 'transform, opacity, filter',
          }}
        />
      ))}
    </div>
  );
}
