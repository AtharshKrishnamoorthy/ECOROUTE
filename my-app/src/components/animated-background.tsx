'use client';

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  direction: number;
}

export default function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    if (typeof window !== 'undefined') {
      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 25; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          size: Math.random() * 4 + 2,
          speed: Math.random() * 2 + 0.5,
          direction: Math.random() * 360,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, [dimensions]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100" />
      
      {/* Animated Gradient Orbs */}
      <motion.div
        className="absolute top-20 -left-20 w-80 h-80 bg-gradient-to-br from-emerald-400/30 to-teal-500/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-green-400/25 to-emerald-500/25 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-20 left-1/4 w-72 h-72 bg-gradient-to-br from-teal-400/20 to-green-400/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.4, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-emerald-400/40"
          style={{
            width: particle.size,
            height: particle.size,
          }}
          initial={{
            x: particle.x,
            y: particle.y,
          }}
          animate={{
            x: particle.x + Math.cos(particle.direction) * 100,
            y: particle.y + Math.sin(particle.direction) * 100,
          }}
          transition={{
            duration: 10 + Math.random() * 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
        />
      ))}

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, #10b981 1px, transparent 1px),
            linear-gradient(to bottom, #10b981 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Subtle Noise Texture */}
      <div 
        className="absolute inset-0 opacity-10 mix-blend-soft-light"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.4"/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
}