
import React, { useEffect, useRef } from 'react';

const TechnicalBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let pulses: Pulse[] = [];
    const particleCount = 80;
    const connectionDistance = 180;
    let mouse = { x: -100, y: -100 };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      originX: number;
      originY: number;

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.originX = this.x;
        this.originY = this.y;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 0.5;
      }

      update(w: number, h: number) {
        this.x += this.vx;
        this.y += this.vy;

        // Subtle magnetism to mouse
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          this.x += dx * 0.005;
          this.y += dy * 0.005;
        }

        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 184, 0, 0.3)';
        ctx.fill();
      }
    }

    class Pulse {
      x: number;
      y: number;
      r: number;
      maxR: number;
      life: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.r = 0;
        this.maxR = 100 + Math.random() * 100;
        this.life = 1;
      }

      update() {
        this.r += 2;
        this.life -= 0.01;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 184, 0, ${this.life * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (Math.random() > 0.985) {
        const p = particles[Math.floor(Math.random() * particles.length)];
        pulses.push(new Pulse(p.x, p.y));
      }

      pulses = pulses.filter(p => p.life > 0);
      pulses.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      particles.forEach((p, i) => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            // Dynamic connection color - slightly brighter near mouse
            const mdx = (p.x + p2.x) / 2 - mouse.x;
            const mdy = (p.y + p2.y) / 2 - mouse.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            const opacity = mdist < 200 ? 0.4 : 0.15;

            ctx.strokeStyle = `rgba(255, 184, 0, ${opacity * (1 - dist / connectionDistance)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img
        src="/images/earth.png"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-tekimax-navy/80 to-tekimax-navy/95"></div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-30"
      />
    </div>
  );
};

export default TechnicalBackground;
