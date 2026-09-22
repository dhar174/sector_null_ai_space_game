import { ShipState, Encounter } from '../types';

interface Star {
  x: number;
  y: number;
  size: number;
  speedMultiplier: number;
  alpha: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface HazardObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotSpeed: number;
  points: number[];
  color: string;
  type: string;
}

export class SpaceRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private particles: Particle[] = [];
  private hazards: HazardObject[] = [];
  private animId: number = 0;
  private lastTime: number = 0;
  private scanWaveRadius: number = 0;
  private isScanning: boolean = false;
  public shakeIntensity: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D context unsupported');
    this.ctx = context;
    this.initStars();
  }

  private initStars() {
    this.stars = [];
    const count = 180;
    const w = this.canvas.width || 800;
    const h = this.canvas.height || 600;

    const colors = ['#ffffff', '#bae6fd', '#fef08a', '#e0e7ff', '#7dd3fc'];

    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.8 + 0.6,
        speedMultiplier: Math.random() * 0.8 + 0.2, // Layer depth
        alpha: Math.random() * 0.7 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.initStars();
  }

  public triggerShake(amount: number = 10) {
    this.shakeIntensity = Math.min(25, this.shakeIntensity + amount);
  }

  public triggerScan() {
    this.isScanning = true;
    this.scanWaveRadius = 10;
  }

  public addImpactSparks(x: number, y: number, color: string = '#f87171', count: number = 24) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1,
        color,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 35 + 20,
      });
    }
  }

  public addRepairSparks(x: number, y: number) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 0.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: Math.random() * 2.5 + 1,
        color: '#38bdf8',
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 40 + 20,
      });
    }
  }

  public syncHazardsWithEncounter(encounter: Encounter | null) {
    if (!encounter || !encounter.active) {
      this.hazards = [];
      return;
    }

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Spawn hazards if list is empty or doesn't match encounter type
    if (this.hazards.length === 0 || this.hazards[0].type !== encounter.type) {
      this.hazards = [];
      
      if (encounter.type === 'asteroid_field') {
        const count = 7;
        for (let i = 0; i < count; i++) {
          const points: number[] = [];
          const numVerts = 8 + Math.floor(Math.random() * 4);
          for (let p = 0; p < numVerts; p++) {
            points.push(0.7 + Math.random() * 0.6);
          }
          this.hazards.push({
            x: Math.random() * (w * 0.8) + w * 0.1,
            y: Math.random() * (h * 0.5) - h * 0.2,
            vx: (Math.random() - 0.5) * 0.5,
            vy: Math.random() * 0.4 + 0.3,
            radius: Math.random() * 22 + 16,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.02,
            points,
            color: '#64748b',
            type: 'asteroid_field',
          });
        }
      } else if (encounter.type === 'spatial_anomaly') {
        this.hazards.push({
          x: w * 0.5,
          y: h * 0.22,
          vx: 0,
          vy: 0.1,
          radius: 48,
          rotation: 0,
          rotSpeed: 0.03,
          points: [],
          color: '#a855f7',
          type: 'spatial_anomaly',
        });
      } else if (encounter.type === 'abandoned_vessel') {
        this.hazards.push({
          x: w * 0.5,
          y: h * 0.25,
          vx: 0.1,
          vy: 0.15,
          radius: 36,
          rotation: 0.2,
          rotSpeed: 0.005,
          points: [],
          color: '#94a3b8',
          type: 'abandoned_vessel',
        });
      } else if (encounter.type === 'ion_storm') {
        const count = 5;
        for (let i = 0; i < count; i++) {
          this.hazards.push({
            x: Math.random() * w,
            y: Math.random() * (h * 0.4),
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 0.5 + 0.5,
            radius: Math.random() * 35 + 25,
            rotation: 0,
            rotSpeed: 0.02,
            points: [],
            color: '#38bdf8',
            type: 'ion_storm',
          });
        }
      } else if (encounter.type === 'alien_beacon') {
        this.hazards.push({
          x: w * 0.5,
          y: h * 0.24,
          vx: 0,
          vy: 0.08,
          radius: 30,
          rotation: 0,
          rotSpeed: 0.015,
          points: [],
          color: '#10b981',
          type: 'alien_beacon',
        });
      }
    }
  }

  public render(ship: ShipState, encounter: Encounter | null, now: number) {
    const dt = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.1) : 0.016;
    this.lastTime = now;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Camera shake handling
    ctx.save();
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(sx, sy);
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 25);
    }

    // 1. Dark space backdrop with radial deep blue vignette
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
    bgGrad.addColorStop(0, '#0a0f1d');
    bgGrad.addColorStop(0.7, '#05070e');
    bgGrad.addColorStop(1, '#020306');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-20, -20, w + 40, h + 40);

    // 2. Distant colorful cosmic nebula glow
    const nebulaGrad = ctx.createRadialGradient(w * 0.3, h * 0.35, 10, w * 0.3, h * 0.35, w * 0.5);
    nebulaGrad.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
    nebulaGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.03)');
    nebulaGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = nebulaGrad;
    ctx.fillRect(0, 0, w, h);

    // 3. Starfield simulation proportional to speed
    const baseSpeed = 20;
    const speedMultiplier = ship.speed === 0 ? 0.3 : ship.speed * 1.5;
    const starVelocity = baseSpeed * (1 + speedMultiplier * 2.2);

    for (const star of this.stars) {
      star.y += starVelocity * star.speedMultiplier * dt;
      if (star.y > h) {
        star.y = 0;
        star.x = Math.random() * w;
      }

      ctx.beginPath();
      // Draw streak if speed is high
      if (ship.speed >= 3) {
        const streakLen = ship.speed * 4 * star.speedMultiplier;
        ctx.strokeStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.lineWidth = star.size * 0.8;
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x, star.y - streakLen);
        ctx.stroke();
      } else {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // 4. Render encounter hazards
    this.syncHazardsWithEncounter(encounter);
    for (const haz of this.hazards) {
      haz.y += (haz.vy + (ship.speed * 0.4)) * 60 * dt;
      haz.x += haz.vx * 60 * dt;
      haz.rotation += haz.rotSpeed;

      // Wrap around top if dropped off bottom while encounter is active
      if (haz.y > h + 60 && encounter && encounter.active) {
        haz.y = -50;
        haz.x = Math.random() * (w * 0.8) + w * 0.1;
      }

      ctx.save();
      ctx.translate(haz.x, haz.y);
      ctx.rotate(haz.rotation);

      if (haz.type === 'asteroid_field') {
        // Jagged asteroid polygon
        ctx.beginPath();
        const numPts = haz.points.length;
        for (let p = 0; p < numPts; p++) {
          const angle = (p / numPts) * Math.PI * 2;
          const r = haz.radius * haz.points[p];
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#334155';
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Asteroid crater details
        ctx.beginPath();
        ctx.arc(-haz.radius * 0.25, -haz.radius * 0.2, haz.radius * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (haz.type === 'spatial_anomaly') {
        // Swirling vortex rings
        for (let r = 3; r >= 1; r--) {
          const ringRad = haz.radius * (r / 3);
          const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, ringRad);
          grad.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
          grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, ringRad, 0, Math.PI * 2);
          ctx.fill();
        }
        // Spinning energy tendrils
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2;
        for (let a = 0; a < 4; a++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(haz.radius * 0.5, haz.radius * 0.2, haz.radius * 0.8, -haz.radius * 0.3, haz.radius * 1.1, 0);
          ctx.stroke();
        }
      } else if (haz.type === 'abandoned_vessel') {
        // Derelict ship silhouette
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        // Central fuselage
        ctx.fillRect(-12, -26, 24, 52);
        ctx.strokeRect(-12, -26, 24, 52);
        // Broken solar panel
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-34, -8, 22, 16);
        ctx.strokeRect(-34, -8, 22, 16);
        // Blinking red emergency beacon
        if (Math.sin(now * 0.006) > 0) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, -20, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (haz.type === 'ion_storm') {
        // Ion cloud with electric arcs
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, haz.radius);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        grad.addColorStop(0.8, 'rgba(14, 165, 233, 0.15)');
        grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, haz.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (haz.type === 'alien_beacon') {
        // Ancient obsidian obelisk prism
        ctx.fillStyle = '#064e3b';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -haz.radius);
        ctx.lineTo(haz.radius * 0.6, haz.radius * 0.7);
        ctx.lineTo(0, haz.radius * 0.4);
        ctx.lineTo(-haz.radius * 0.6, haz.radius * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pulsing emerald core
        const pulse = (Math.sin(now * 0.005) + 1) * 0.5;
        ctx.fillStyle = `rgba(52, 211, 153, ${0.4 + pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(0, 0, 6 + pulse * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 5. Science scan wave effect
    if (this.isScanning) {
      this.scanWaveRadius += dt * 450;
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.7, this.scanWaveRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.restore();

      if (this.scanWaveRadius > Math.max(w, h)) {
        this.isScanning = false;
        this.scanWaveRadius = 0;
      }
    }

    // 6. Draw Player Starship
    const shipX = w / 2;
    const shipY = h * 0.72;

    // Thruster exhaust particles
    if (ship.speed > 0) {
      const emitRate = ship.speed * 2;
      for (let i = 0; i < emitRate; i++) {
        const spread = (Math.random() - 0.5) * 8;
        this.particles.push({
          x: shipX + spread,
          y: shipY + 28,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * (ship.speed * 3.5 + 2) + 2,
          size: Math.random() * (ship.speed * 1.2 + 2) + 2,
          color: ship.speed >= 4 ? '#ec4899' : '#38bdf8',
          alpha: 0.9,
          life: 0,
          maxLife: Math.random() * 20 + 15,
        });
      }
    }

    // Update & draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Ship Hull rendering
    ctx.save();
    ctx.translate(shipX, shipY);

    // Deflector Shield Bubble
    if (ship.shields > 0) {
      const shieldAlpha = Math.min(0.6, 0.15 + (ship.shields / 100) * 0.35);
      const shieldGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 48);
      shieldGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      shieldGrad.addColorStop(0.85, `rgba(56, 189, 248, ${shieldAlpha * 0.4})`);
      shieldGrad.addColorStop(1, `rgba(56, 189, 248, ${shieldAlpha})`);
      ctx.fillStyle = shieldGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.fill();

      // Shield contour ring
      ctx.strokeStyle = `rgba(186, 230, 253, ${shieldAlpha * 1.2})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Ship Chassis
    // Wings
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -32); // Nose
    ctx.lineTo(26, 18);  // Right wingtip
    ctx.lineTo(16, 26);  // Right thruster bay
    ctx.lineTo(0, 20);   // Engine centerline
    ctx.lineTo(-16, 26); // Left thruster bay
    ctx.lineTo(-26, 18); // Left wingtip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner Armor Plate / Cockpit
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(12, 10);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit Glass
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(6, -4);
    ctx.lineTo(-6, -4);
    ctx.closePath();
    ctx.fill();

    // Thruster engine glow nozzles
    ctx.fillStyle = ship.speed > 0 ? (ship.speed >= 4 ? '#f43f5e' : '#38bdf8') : '#475569';
    ctx.fillRect(-12, 22, 6, 4);
    ctx.fillRect(6, 22, 6, 4);

    ctx.restore();

    // 7. Tactical HUD Overlay in Canvas
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`VECTOR: HEADING 000° // SPD: ${ship.speed}`, 16, 24);
    if (encounter && encounter.active) {
      const dangerColor = 
        encounter.dangerLevel === 'Extreme' ? '#ef4444' :
        encounter.dangerLevel === 'Hazardous' ? '#f97316' : '#38bdf8';
      ctx.fillStyle = dangerColor;
      ctx.fillText(`ALERT: ${encounter.title.toUpperCase()}`, 16, 40);
      ctx.fillText(`RANGE: ${Math.round(encounter.distanceRemaining)} KM`, 16, 54);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.fillText('RADAR: DEEP VOID // NO ACTIVE THREATS', 16, 40);
    }
    ctx.restore();

    ctx.restore(); // Restore camera shake
  }
}
