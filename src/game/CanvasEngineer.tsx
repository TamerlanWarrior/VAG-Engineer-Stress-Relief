import React, { useEffect, useRef } from 'react';
import { GameState, ToolDef } from './logic';

interface CanvasEngineerProps {
  gameState: GameState;
  activeTool: ToolDef;
  onHit: (x: number, y: number, isSpecial?: boolean) => void;
  isSpecialActive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  scale: number;
  alpha: number;
  color: string;
  type: 'spark' | 'bolt' | 'plastic' | 'coolant' | 'smoke' | 'text' | 'star';
  text?: string;
  life: number;
  maxLife: number;
}

const MAX_PARTICLES = 160;

export const CanvasEngineer: React.FC<CanvasEngineerProps> = ({
  gameState,
  activeTool,
  onHit,
  isSpecialActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep references to latest props to prevent 60fps loop re-binds
  const propsRef = useRef({ gameState, activeTool, onHit, isSpecialActive });
  propsRef.current = { gameState, activeTool, onHit, isSpecialActive };

  // Physics & Animation state refs (kept outside React re-renders)
  const animRef = useRef({
    // Head & Body spring state
    headX: 0,
    headY: 0,
    headVx: 0,
    headVy: 0,
    targetHeadX: 0,
    targetHeadY: 0,

    bodyX: 0,
    bodyY: 0,
    bodyVx: 0,
    bodyVy: 0,

    // Squash & Stretch
    scaleX: 1,
    scaleY: 1,

    // Hit flash & shake
    hitFlash: 0,
    shakeX: 0,
    shakeY: 0,
    shakeIntensity: 0,

    // Gaze tracking (cursor)
    cursorX: 0,
    cursorY: 0,

    // Dragging
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,

    // Comic speech bubble bounce
    bubbleScale: 1,
    lastQuote: '' as string | null,

    // Stars circling head in stage 4
    starAngle: 0,

    // Service Mode special fx
    specialFxTimer: 0,

    lastTime: performance.now(),
    lastFrameTime: performance.now(),
  });

  // Particle pool
  const particlesRef = useRef<Particle[]>([]);

  // Helper to spawn particles
  const spawnParticles = (
    x: number,
    y: number,
    toolType: ToolDef['sound'],
    isCrit: boolean,
    dmgText?: string
  ) => {
    const pool = particlesRef.current;
    const count = toolType === 'sledge' || isCrit ? 22 : toolType === 'pneumo' ? 14 : 8;

    // Damage number popup
    if (dmgText) {
      pool.push({
        x: x + (Math.random() * 40 - 20),
        y: y - 20,
        vx: (Math.random() - 0.5) * 60,
        vy: -140 - Math.random() * 60,
        rotation: (Math.random() - 0.5) * 0.4,
        vRot: 0,
        scale: isCrit ? 1.5 : 1.1,
        alpha: 1,
        color: isCrit ? '#f43f5e' : '#f59e0b',
        type: 'text',
        text: dmgText,
        life: 0.9,
        maxLife: 0.9,
      });
    }

    // Comic exclamation text
    const comicWords: Record<string, string[]> = {
      slap: ['ХЛОП!', 'ЛЕЩ!', 'ШМЯК!'],
      wrench: ['КЛАНГ!', 'ДЗЫНЬ!', '10-КА!'],
      sledge: ['БА-БАХ!', '140 КМ/Ч!', 'ХРУСЬ!'],
      pneumo: ['ТР-Р-Р!', 'БОЛТ!', 'XZN M10!'],
      cleaner: ['ПШ-Ш-Ш!', 'В ГЛАЗА!', 'ОЧИСТОС!'],
      gas: ['Ш-Ш-Ш!', 'АВТОГЕН!', 'ОГОНЬ!'],
      part: ['ПОМПА!', '90 000 ₽!', 'ПЛАСТИК!'],
      special: ['СЕРВИСНЫЙ РЕЖИМ!', 'МОРДУ ДОЛОЙ!', 'ВЕСЬ РАЗОБРАН!'],
    };

    const words = comicWords[toolType] || ['БАМ!'];
    const chosenWord = words[Math.floor(Math.random() * words.length)];

    pool.push({
      x: x + (Math.random() * 60 - 30),
      y: y - 60,
      vx: (Math.random() - 0.5) * 80,
      vy: -110 - Math.random() * 50,
      rotation: (Math.random() - 0.5) * 0.5,
      vRot: (Math.random() - 0.5) * 0.8,
      scale: 1.2,
      alpha: 1,
      color: '#facc15',
      type: 'text',
      text: chosenWord,
      life: 0.75,
      maxLife: 0.75,
    });

    for (let i = 0; i < count; i++) {
      if (pool.length > MAX_PARTICLES) pool.shift();

      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 320;
      let pType: Particle['type'] = 'spark';
      let pColor = '#fbbf24';

      if (toolType === 'cleaner') {
        pType = 'smoke';
        pColor = '#ffffff';
      } else if (toolType === 'part') {
        pType = 'coolant';
        pColor = Math.random() > 0.4 ? '#ec4899' : '#0284c7'; // Pink G12 or blue coolant
      } else if (toolType === 'pneumo' || toolType === 'wrench') {
        pType = Math.random() > 0.5 ? 'bolt' : 'spark';
        pColor = '#94a3b8';
      } else if (toolType === 'gas') {
        pType = 'spark';
        pColor = Math.random() > 0.5 ? '#f97316' : '#ef4444';
      }

      pool.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 12,
        scale: 0.8 + Math.random() * 1.4,
        alpha: 1,
        color: pColor,
        type: pType,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
      });
    }
  };

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (now: number) => {
      const anim = animRef.current;
      const timeSinceLastFrame = now - anim.lastFrameTime;
      if (timeSinceLastFrame < 24) {
        animId = requestAnimationFrame(render);
        return;
      }
      anim.lastFrameTime = now;

      const rawDt = (now - anim.lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05); // clamped dt
      anim.lastTime = now;

      const { gameState: state, isSpecialActive: isSpecial } = propsRef.current;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      // Spring physics for Head & Body
      const springK = 180;
      const springDamp = 14;

      const headFx = -springK * (anim.headX - anim.targetHeadX) - springDamp * anim.headVx;
      const headFy = -springK * (anim.headY - anim.targetHeadY) - springDamp * anim.headVy;
      anim.headVx += headFx * dt;
      anim.headVy += headFy * dt;
      anim.headX += anim.headVx * dt;
      anim.headY += anim.headVy * dt;

      const bodyFx = -springK * anim.bodyX - springDamp * anim.bodyVx;
      const bodyFy = -springK * anim.bodyY - springDamp * anim.bodyVy;
      anim.bodyVx += bodyFx * dt;
      anim.bodyVy += bodyFy * dt;
      anim.bodyX += anim.bodyVx * dt;
      anim.bodyY += anim.bodyVy * dt;

      // Decay squash and stretch back to 1.0
      anim.scaleX += (1.0 - anim.scaleX) * 10 * dt;
      anim.scaleY += (1.0 - anim.scaleY) * 10 * dt;

      // Screen shake decay
      if (anim.shakeIntensity > 0) {
        anim.shakeX = (Math.random() - 0.5) * anim.shakeIntensity * 20;
        anim.shakeY = (Math.random() - 0.5) * anim.shakeIntensity * 20;
        anim.shakeIntensity = Math.max(0, anim.shakeIntensity - 5.0 * dt);
      } else {
        anim.shakeX = 0;
        anim.shakeY = 0;
      }

      // Hit flash decay
      if (anim.hitFlash > 0) {
        anim.hitFlash = Math.max(0, anim.hitFlash - 7.0 * dt);
      }

      // Star rotation for stage 4
      anim.starAngle += 4 * dt;

      // Check quote changes for bouncy popup
      if (state.currentQuote !== anim.lastQuote) {
        anim.lastQuote = state.currentQuote;
        anim.bubbleScale = 0.2;
      }
      anim.bubbleScale += (1.0 - anim.bubbleScale) * 12 * dt;

      // Clear frame
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(anim.shakeX, anim.shakeY);

      // Draw Auto Dealer Workshop Bay Background Elements
      drawWorkshopBackground(ctx, width, height, state.stage);

      // Center coordinates for Engineer with mobile adaptation
      const isMobile = width < 600;
      const baseScale = isMobile ? Math.max(0.78, Math.min(1.0, width / 440)) : 1.0;
      const centerX = width / 2 + anim.bodyX;
      const centerY = (isMobile ? height * 0.52 : height * 0.48) + anim.bodyY;

      // Draw Engineer
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(anim.scaleX * baseScale, anim.scaleY * baseScale);

      drawEngineerCaricature(
        ctx,
        anim.headX,
        anim.headY,
        anim.cursorX - centerX,
        anim.cursorY - centerY,
        state.stage,
        anim.hitFlash,
        anim.starAngle,
        isSpecial
      );

      ctx.restore();

      // Draw Comic Speech Bubble
      if (state.currentQuote && state.quoteTimer > 0) {
        drawSpeechBubble(
          ctx,
          centerX + anim.headX,
          centerY + (anim.headY - 135) * baseScale,
          state.currentQuote,
          anim.bubbleScale,
          state.quotePriority,
          width
        );
      }

      // Update & Draw Particles (Sparks, Bolts, Coolant, Text)
      updateAndDrawParticles(ctx, particlesRef.current, dt);

      // Special Service Mode Screen Border Aura
      if (isSpecial) {
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + Math.sin(now * 0.01) * 0.3})`;
        ctx.lineWidth = 14;
        ctx.strokeRect(0, 0, width, height);

        ctx.fillStyle = '#ef4444';
        ctx.font = '900 16px "Russo One", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ ВНИМАНИЕ: СЕРВИСНЫЙ РЕЖИМ МОРДЫ АКТИВИРОВАН! ⚠', width / 2, 34);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle pointer down (Hit or Drag)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const anim = animRef.current;
    anim.cursorX = x;
    anim.cursorY = y;

    // Check hit on engineer region
    const isMobile = canvas.clientWidth < 600;
    const centerX = canvas.clientWidth / 2;
    const centerY = isMobile ? canvas.clientHeight * 0.52 : canvas.clientHeight * 0.48;
    const dist = Math.hypot(x - centerX, y - centerY);

    // Hit the engineer!
    const { activeTool, isSpecialActive, onHit } = propsRef.current;

    // Squash & stretch reaction
    if (activeTool.sound === 'sledge' || isSpecialActive) {
      anim.scaleX = 1.35;
      anim.scaleY = 0.72;
      anim.shakeIntensity = 1.0;
      anim.hitFlash = 1.0;
    } else {
      anim.scaleX = 1.18;
      anim.scaleY = 0.86;
      anim.shakeIntensity = 0.45;
      anim.hitFlash = 0.8;
    }

    // Impulse to head away from hit position
    const dx = centerX - x;
    const dy = centerY - y;
    const norm = Math.max(1, Math.hypot(dx, dy));
    const hitForce = activeTool.damage * 4.5;
    anim.headVx += (dx / norm) * hitForce;
    anim.headVy += (dy / norm) * hitForce;

    // Call game hit callback
    onHit(x, y, isSpecialActive);

    // Trigger visual particles
    spawnParticles(
      x,
      y,
      isSpecialActive ? 'special' : activeTool.sound,
      Math.random() < 0.25 || isSpecialActive,
      `-${activeTool.damage}`
    );
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    animRef.current.cursorX = e.clientX - rect.left;
    animRef.current.cursorY = e.clientY - rect.top;
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-none">
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="w-full h-full block cursor-crosshair touch-none"
      />
    </div>
  );
};

// ==================== DRAWING HELPERS ====================

function drawWorkshopBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stage: number
) {
  // Service Bay Wall Gradients
  const wallGrad = ctx.createLinearGradient(0, 0, 0, height);
  wallGrad.addColorStop(0, '#090d16');
  wallGrad.addColorStop(0.65, '#131b2e');
  wallGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, width, height);

  // Workshop concrete floor line
  const floorY = height * 0.72;
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, height);
  floorGrad.addColorStop(0, '#1e293b');
  floorGrad.addColorStop(0.1, '#334155');
  floorGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, width, height - floorY);

  // Yellow and black warning hazard safety stripes on floor
  ctx.save();
  ctx.fillStyle = '#eab308';
  for (let x = -height; x < width + height; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x + 18, floorY);
    ctx.lineTo(x + 18 - (height - floorY), height);
    ctx.lineTo(x - (height - floorY), height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Hydraulic 2-Post Car Lift Columns (Left & Right)
  ctx.fillStyle = '#3b82f6';
  // Left post
  ctx.fillRect(width * 0.08, height * 0.15, 24, height * 0.6);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(width * 0.08 + 4, height * 0.15, 6, height * 0.6);
  // Right post
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(width * 0.88, height * 0.15, 24, height * 0.6);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(width * 0.88 + 4, height * 0.15, 6, height * 0.6);

  // Car silhouette hoisted up on the lift (VAG sedan / Golf chassis)
  ctx.save();
  const carY = width < 600 ? height * 0.11 : height * 0.16;
  const carScale = width < 600 ? 0.75 : 1.0;
  ctx.translate(width / 2, carY);
  ctx.scale(carScale, carScale);
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-130, -35, 260, 45, 12);
  ctx.fill();
  // Roof & windshield
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(-70, -35);
  ctx.lineTo(-40, -65);
  ctx.lineTo(50, -65);
  ctx.lineTo(85, -35);
  ctx.closePath();
  ctx.fill();
  // Lift arms underneath car
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-120, 10, 240, 10);
  ctx.restore();

  // Dealership Banner / Signboard
  ctx.save();
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(width / 2 - 140, 16, 280, 32);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(width / 2 - 140, 16, 280, 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 13px "Russo One", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VAG SERVICE · ОТДЕЛ РАЗРАБОТКИ', width / 2, 36);
  ctx.restore();

  // Diagnostic Laptop screen on tool cart (Right side)
  ctx.save();
  ctx.translate(width * 0.82, height * 0.62);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-35, -28, 70, 48);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(-35, -28, 70, 48);
  // Screen glowing blue/green with fault codes
  ctx.fillStyle = '#022c22';
  ctx.fillRect(-32, -25, 64, 34);
  ctx.fillStyle = '#10b981';
  ctx.font = '8px monospace';
  ctx.fillText('ODIS / VCDS', -28, -15);
  ctx.fillStyle = '#ef4444';
  ctx.fillText('P001600 EPC', -28, -5);
  ctx.fillText('00532 VAG-COM', -28, 5);
  ctx.restore();

  // Oil barrel with VAG approved label (Left side)
  ctx.save();
  ctx.translate(width * 0.14, height * 0.64);
  ctx.fillStyle = '#15803d'; // Green oil drum
  ctx.beginPath();
  ctx.roundRect(-24, -30, 48, 60, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('504/507', 0, -5);
  ctx.fillText('0W-30', 0, 8);
  ctx.restore();
}

/**
 * Draws the caricatured German VAG Engineer.
 */
function drawEngineerCaricature(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headY: number,
  eyeTrackX: number,
  eyeTrackY: number,
  stage: 1 | 2 | 3 | 4,
  hitFlash: number,
  starAngle: number,
  isSpecial: boolean
) {
  // Body (Torso & Shoulders)
  ctx.save();
  // White Lab / Engineer Coat
  ctx.fillStyle = hitFlash > 0.4 ? '#fca5a5' : '#f8fafc';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(-60, 40);
  ctx.lineTo(-45, -20);
  ctx.lineTo(45, -20);
  ctx.lineTo(60, 40);
  ctx.lineTo(65, 120);
  ctx.lineTo(-65, 120);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Blue collar & tie
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.moveTo(-25, -20);
  ctx.lineTo(0, 10);
  ctx.lineTo(25, -20);
  ctx.lineTo(15, -15);
  ctx.lineTo(0, -5);
  ctx.lineTo(-15, -15);
  ctx.closePath();
  ctx.fill();

  // Red/Stripe necktie (crooked if stage > 1)
  ctx.save();
  const tieAngle = stage > 1 ? (stage === 4 ? 0.35 : -0.2) : 0;
  ctx.rotate(tieAngle);
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(-8, 5);
  ctx.lineTo(8, 5);
  ctx.lineTo(12, 65);
  ctx.lineTo(0, 80);
  ctx.lineTo(-12, 65);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // VAG ID Badge on chest
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(20, 20, 32, 22);
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, 32, 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 6px sans-serif';
  ctx.fillText('VAG R&D', 23, 30);
  ctx.font = '5px sans-serif';
  ctx.fillText('HANS', 23, 38);

  // Pen and Vernier caliper in pocket
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-38, 25, 4, 15);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-32, 22, 5, 18);

  // Arms and Hands
  // Left arm
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-85, 20, 26, 70, 10);
  ctx.fill();
  ctx.stroke();

  // Right arm
  ctx.beginPath();
  ctx.roundRect(59, 20, 26, 70, 10);
  ctx.fill();
  ctx.stroke();

  // Hands (or holding clipboard in stage 1, raised defensively in stage 2-4)
  ctx.fillStyle = '#fbcfe8'; // Skin tone
  ctx.beginPath();
  ctx.arc(-72, 92, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (stage === 4) {
    // Stage 4: Waving white surrender cloth!
    ctx.save();
    ctx.translate(72, 60);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(0, -30, 25, 18, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('NEIN!', 3, -18);
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(72, 92, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore(); // End Body

  // ==================== HEAD ====================
  ctx.save();
  ctx.translate(headX, headY - 55);

  // Comic head wobble on hit
  if (hitFlash > 0.1) {
    ctx.rotate((Math.random() - 0.5) * 0.25 * hitFlash);
  }

  // Neck
  ctx.fillStyle = '#fbcfe8';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.fillRect(-18, 30, 36, 25);
  ctx.strokeRect(-18, 30, 36, 25);

  // Big cartoon head shape
  ctx.fillStyle = hitFlash > 0.4 ? '#ffaaaa' : '#fed7aa'; // Rosy German skin tone
  ctx.beginPath();
  ctx.ellipse(0, 0, 52, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ears
  // Left ear
  ctx.beginPath();
  ctx.arc(-53, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Right ear
  ctx.beginPath();
  ctx.arc(53, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Stiff Parted Hair (Aristocratic German Engineer haircut)
  ctx.fillStyle = '#cbd5e1'; // Silver blonde
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-54, -25);
  ctx.quadraticCurveTo(-45, -72, 0, -68);
  ctx.quadraticCurveTo(45, -72, 54, -25);
  ctx.lineTo(40, -35);
  ctx.lineTo(10, -50);
  ctx.lineTo(-20, -45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forehead wrinkles
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-25, -35);
  ctx.lineTo(25, -35);
  ctx.moveTo(-18, -42);
  ctx.lineTo(18, -42);
  ctx.stroke();

  // Eyes & Eyebrows
  const eyeRadius = 13;
  const leftEyeX = -20;
  const rightEyeX = 20;
  const eyeY = -6;

  // Eyebrows
  ctx.fillStyle = '#64748b';
  ctx.save();
  if (stage === 1) {
    // Smug arrogant arch
    ctx.fillRect(-34, -26, 26, 5);
    ctx.fillRect(8, -28, 26, 5);
  } else if (stage === 2) {
    // Worried furrowed
    ctx.translate(-22, -24);
    ctx.rotate(0.2);
    ctx.fillRect(-12, 0, 24, 5);
    ctx.rotate(-0.4);
    ctx.fillRect(32, 0, 24, 5);
  } else {
    // Pain & panic
    ctx.translate(-22, -24);
    ctx.rotate(-0.3);
    ctx.fillRect(-12, 0, 24, 6);
    ctx.rotate(0.6);
    ctx.fillRect(32, 0, 24, 6);
  }
  ctx.restore();

  // Left Eye
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(leftEyeX, eyeY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Right Eye (Can be a swollen black eye in stage 3 & 4)
  if (stage >= 3) {
    ctx.fillStyle = '#7e22ce'; // Purple shiner
    ctx.beginPath();
    ctx.arc(rightEyeX, eyeY, eyeRadius + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rightEyeX, eyeY, eyeRadius - 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(rightEyeX, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Pupils (track cursor / crosshair!)
  const pupilAngle = Math.atan2(eyeTrackY, eyeTrackX);
  const pupilDist = Math.min(5, Math.hypot(eyeTrackX, eyeTrackY) * 0.02);
  const pupX = Math.cos(pupilAngle) * pupilDist;
  const pupY = Math.sin(pupilAngle) * pupilDist;

  ctx.fillStyle = '#0f172a';
  if (stage === 4) {
    // Swirly cartoon eyes when totally dizzy!
    ctx.beginPath();
    ctx.arc(leftEyeX, eyeY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX, eyeY, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(leftEyeX + pupX, eyeY + pupY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + pupX, eyeY + pupY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glasses (Thick black frames - hallmark of the VAG engineer)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3.5;
  // Left rim
  ctx.beginPath();
  ctx.arc(leftEyeX, eyeY, eyeRadius + 4, 0, Math.PI * 2);
  ctx.stroke();
  // Right rim
  ctx.beginPath();
  ctx.arc(rightEyeX, eyeY, eyeRadius + 4, 0, Math.PI * 2);
  ctx.stroke();
  // Bridge
  ctx.beginPath();
  ctx.moveTo(leftEyeX + eyeRadius + 4, eyeY);
  ctx.lineTo(rightEyeX - eyeRadius - 4, eyeY);
  ctx.stroke();

  // Broken glass crack if stage >= 3
  if (stage >= 3) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(leftEyeX - 6, eyeY - 8);
    ctx.lineTo(leftEyeX + 4, eyeY + 6);
    ctx.lineTo(leftEyeX + 8, eyeY - 2);
    ctx.stroke();
  }

  // Big Cartoon German Nose
  ctx.fillStyle = '#fb923c';
  ctx.strokeStyle = '#c2410c';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-4, eyeY + 8);
  ctx.lineTo(-8, 20);
  ctx.quadraticCurveTo(0, 27, 8, 20);
  ctx.lineTo(4, eyeY + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mouth & Expression
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#334155';
  if (stage === 1) {
    // Smug smirk: "Just 140 km/h!"
    ctx.beginPath();
    ctx.moveTo(-16, 32);
    ctx.quadraticCurveTo(0, 36, 18, 28);
    ctx.stroke();
  } else if (stage === 2) {
    // Uneasy grimace
    ctx.beginPath();
    ctx.moveTo(-18, 34);
    ctx.lineTo(18, 34);
    ctx.stroke();
  } else if (stage === 3) {
    // Gritted teeth
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.rect(-18, 28, 36, 14);
    ctx.fill();
    ctx.stroke();
    // Tooth lines
    ctx.beginPath();
    ctx.moveTo(-9, 28);
    ctx.lineTo(-9, 42);
    ctx.moveTo(0, 28);
    ctx.lineTo(0, 42);
    ctx.moveTo(9, 28);
    ctx.lineTo(9, 42);
    ctx.moveTo(-18, 35);
    ctx.lineTo(18, 35);
    ctx.stroke();
  } else {
    // Screaming open mouth shouting "NEIN! 140 KM/H!"
    ctx.fillStyle = '#881337';
    ctx.beginPath();
    ctx.ellipse(0, 36, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tongue
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.ellipse(0, 42, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bandages / Swelling on face for stage 3 & 4
  if (stage >= 3) {
    // Band-Aid cross on cheek
    ctx.fillStyle = '#fde68a';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.fillRect(-42, 12, 16, 6);
    ctx.strokeRect(-42, 12, 16, 6);
    ctx.fillRect(-37, 7, 6, 16);
    ctx.strokeRect(-37, 7, 6, 16);
  }

  // Comic Swollen Bump on head with circling stars for Stage 4
  if (stage === 4) {
    // Bump
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(-25, -60, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Circling yellow stars
    for (let i = 0; i < 3; i++) {
      const angle = starAngle + (i * Math.PI * 2) / 3;
      const sx = Math.cos(angle) * 48;
      const sy = -65 + Math.sin(angle) * 16;
      drawStar(ctx, sx, sy, 7, '#facc15');
    }

    // G12 Coolant / Oil tears streaming from eyes
    ctx.fillStyle = '#f43f5e'; // Pink G12
    ctx.beginPath();
    ctx.ellipse(leftEyeX - 8, eyeY + 22, 3, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightEyeX + 8, eyeY + 22, 3, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore(); // End Head
}

/**
 * Draws a comic speech bubble with pointer tail.
 */
function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  scale: number,
  isPriority: boolean,
  canvasWidth: number
) {
  ctx.save();

  // Clamp bubble within screen bounds
  const maxWidth = Math.min(360, canvasWidth * 0.92);
  ctx.font = '800 13px "Russo One", Impact, sans-serif';

  // Multi-line wrap
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width < maxWidth - 36) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);

  const bubbleHeight = 24 + lines.length * 18;
  const bubbleWidth = maxWidth;

  // Center horizontally, clamp to screen
  const bx = Math.max(bubbleWidth / 2 + 10, Math.min(canvasWidth - bubbleWidth / 2 - 10, x));
  const by = Math.max(bubbleHeight / 2 + 65, y);

  ctx.translate(bx, by);
  ctx.scale(scale, scale);

  // Bubble drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(-bubbleWidth / 2 + 5, -bubbleHeight / 2 + 5, bubbleWidth, bubbleHeight, 16);
  ctx.fill();

  // Bubble background (High-voltage yellow for priority quotes, bright white for standard)
  ctx.fillStyle = isPriority ? '#fef08a' : '#ffffff';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3.5;

  ctx.beginPath();
  ctx.roundRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 16);
  ctx.fill();
  ctx.stroke();

  // Comic tail pointing down to engineer's mouth
  ctx.fillStyle = isPriority ? '#fef08a' : '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-14, bubbleHeight / 2 - 2);
  ctx.lineTo(0, bubbleHeight / 2 + 20);
  ctx.lineTo(14, bubbleHeight / 2 - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Retouch overlap
  ctx.fillStyle = isPriority ? '#fef08a' : '#ffffff';
  ctx.fillRect(-13, bubbleHeight / 2 - 3, 26, 4);

  // Kicker header if core quote
  if (isPriority) {
    ctx.fillStyle = '#dc2626';
    ctx.font = '900 9px "Russo One", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ ИНЖЕНЕР VAG В ПАНИКЕ:', -bubbleWidth / 2 + 14, -bubbleHeight / 2 + 14);
  }

  // Text Lines
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 12px "Russo One", Impact, sans-serif';
  ctx.textAlign = 'center';

  const startY = isPriority
    ? -bubbleHeight / 2 + 28
    : -bubbleHeight / 2 + 20;

  lines.forEach((line, idx) => {
    ctx.fillText(line, 0, startY + idx * 18);
  });

  ctx.restore();
}

/**
 * Draws a 5-pointed comic star.
 */
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const aInner = a + Math.PI / 5;
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.lineTo(cx + Math.cos(aInner) * (r * 0.45), cy + Math.sin(aInner) * (r * 0.45));
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Updates and draws particle ring buffer.
 */
function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  dt: number
) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rotation += p.vRot * dt;

    if (p.type !== 'text') {
      p.vy += 450 * dt; // Gravity
    }

    const progress = p.life / p.maxLife;
    p.alpha = Math.max(0, progress);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.scale(p.scale, p.scale);
    ctx.globalAlpha = p.alpha;

    if (p.type === 'text') {
      ctx.font = '900 16px "Russo One", Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(p.text || '', 0, 0);
      ctx.fillText(p.text || '', 0, 0);
    } else if (p.type === 'bolt') {
      // Hex nut / Triple square bolt
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const a = (j * Math.PI) / 3;
        const bx = Math.cos(a) * 6;
        const by = Math.sin(a) * 6;
        if (j === 0) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.type === 'coolant') {
      // Coolant blob
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'smoke') {
      // Cleaner spray mist
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 8 * (1.5 - progress), 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Spark
      ctx.fillStyle = p.color;
      ctx.fillRect(-2, -2, 4, 4);
    }

    ctx.restore();
  }
}
