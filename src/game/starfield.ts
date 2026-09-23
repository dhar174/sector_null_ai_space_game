import {
  ShipState,
  Encounter,
  DisplayProperties,
  CameraViewMode,
  VisualSpectrum,
  TacticalTarget,
  ThreatLevel,
  TacticalTargetType,
  TacticalTargetDetails,
} from '../types';

interface Star {
  x: number;
  y: number;
  z: number; // 0 (far/slow) to 1 (near/fast) depth
  size: number;
  speedMultiplier: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  twinkleSpeed: number;
  twinkleOffset: number;
  layer: number; // 0: distant, 1: mid, 2: foreground
}

export interface SectorVisualProfile {
  name: string;
  themeTitle: string;
  spaceGradients: [string, string, string];
  nebulaLobeA: { color0: string; color1: string; pos: [number, number]; radius: number };
  nebulaLobeB: { color0: string; color1: string; pos: [number, number]; radius: number };
  dustColor: string;
  dustCount: number;
  starDensity: number; // Star count for this sector
  starColors: string[];
  gridColor: string;
  planetHue: number;
  planetRings: boolean;
  planetLabel: string;
  ambientParticles?: boolean;
}

export const SECTOR_VISUAL_PROFILES: Record<number, SectorVisualProfile> = {
  1: {
    name: 'Sector 01 - Orion Verge',
    themeTitle: 'ORION EXPEDITION ZONE',
    spaceGradients: ['#0a0e1c', '#050710', '#020307'],
    nebulaLobeA: {
      color0: 'rgba(14, 165, 233, 0.12)',
      color1: 'rgba(99, 102, 241, 0.05)',
      pos: [0.28, 0.3],
      radius: 0.45,
    },
    nebulaLobeB: {
      color0: 'rgba(217, 70, 239, 0.08)',
      color1: 'rgba(147, 51, 234, 0.03)',
      pos: [0.72, 0.65],
      radius: 0.4,
    },
    dustColor: '#bae6fd',
    dustCount: 45,
    starDensity: 280,
    starColors: ['#ffffff', '#c7d2fe', '#7dd3fc', '#fef08a', '#fed7aa', '#fca5a5'],
    gridColor: 'rgba(56, 189, 248, 0.18)',
    planetHue: 205,
    planetRings: true,
    planetLabel: 'Gas Giant Aegis-Prime',
  },
  2: {
    name: 'Sector Null - Remnant Void',
    themeTitle: 'CRIMSON ION REMNANT',
    spaceGradients: ['#160812', '#0e050d', '#050205'],
    nebulaLobeA: {
      color0: 'rgba(244, 63, 94, 0.15)',
      color1: 'rgba(190, 18, 60, 0.06)',
      pos: [0.35, 0.25],
      radius: 0.52,
    },
    nebulaLobeB: {
      color0: 'rgba(249, 115, 22, 0.12)',
      color1: 'rgba(180, 83, 9, 0.04)',
      pos: [0.65, 0.75],
      radius: 0.45,
    },
    dustColor: '#fed7aa',
    dustCount: 65,
    starDensity: 360,
    starColors: ['#ffffff', '#fed7aa', '#fca5a5', '#f87171', '#fbbf24', '#ffedd5'],
    gridColor: 'rgba(244, 63, 94, 0.22)',
    planetHue: 15,
    planetRings: false,
    planetLabel: 'Barren Smoldering Core',
  },
  3: {
    name: 'Sector Null - Tachyon Abyss',
    themeTitle: 'TACHYON SINGULARITY VEIL',
    spaceGradients: ['#110822', '#080415', '#03010a'],
    nebulaLobeA: {
      color0: 'rgba(168, 85, 247, 0.18)',
      color1: 'rgba(126, 34, 206, 0.08)',
      pos: [0.22, 0.4],
      radius: 0.5,
    },
    nebulaLobeB: {
      color0: 'rgba(192, 132, 252, 0.14)',
      color1: 'rgba(79, 70, 229, 0.06)',
      pos: [0.78, 0.55],
      radius: 0.48,
    },
    dustColor: '#e9d5ff',
    dustCount: 80,
    starDensity: 440,
    starColors: ['#ffffff', '#e9d5ff', '#c084fc', '#a855f7', '#818cf8', '#67e8f9'],
    gridColor: 'rgba(168, 85, 247, 0.24)',
    planetHue: 280,
    planetRings: true,
    planetLabel: 'Singularity Event Horizon',
  },
  4: {
    name: 'Sector Null - Deep Core Singularity',
    themeTitle: 'QUANTUM GRAVITON WELL',
    spaceGradients: ['#041a18', '#020e0d', '#010505'],
    nebulaLobeA: {
      color0: 'rgba(20, 184, 166, 0.2)',
      color1: 'rgba(13, 148, 136, 0.08)',
      pos: [0.3, 0.35],
      radius: 0.55,
    },
    nebulaLobeB: {
      color0: 'rgba(16, 185, 129, 0.16)',
      color1: 'rgba(5, 150, 105, 0.07)',
      pos: [0.7, 0.6],
      radius: 0.5,
    },
    dustColor: '#99f6e4',
    dustCount: 100,
    starDensity: 520,
    starColors: ['#ffffff', '#99f6e4', '#2dd4bf', '#34d399', '#6ee7b7', '#a7f3d0'],
    gridColor: 'rgba(20, 184, 166, 0.28)',
    planetHue: 165,
    planetRings: true,
    planetLabel: 'Supermassive Chrono-Anchor',
  },
};

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
  glow?: boolean;
}

interface HazardObject {
  id: string;
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
  pulse?: number;
  isScanTarget?: boolean;
  hazardLabel?: string;
  hazardSublabel?: string;
  category?: string;
  threatLevel?: ThreatLevel;
  scanned?: boolean;
  scanProgress?: number;
  details?: TacticalTargetDetails;
}

interface CelestialPlanet {
  x: number;
  y: number;
  radius: number;
  hue: number;
  rings: boolean;
  angle: number;
}

export class SpaceRenderer {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private cosmicDust: { x: number; y: number; speed: number; size: number; alpha: number }[] = [];
  private particles: Particle[] = [];
  private hazards: HazardObject[] = [];
  private lastTime: number = 0;
  private scanWaveRadius: number = 0;
  private isScanning: boolean = false;
  public shakeIntensity: number = 0;

  // Radar Sweep & Active Sensor Ping System
  private isRadarSweeping: boolean = false;
  private radarSweepElapsed: number = 0;
  private radarSweepDuration: number = 2.8; // Duration in seconds
  private radarSweepAngle: number = -Math.PI / 2;
  private radarTargetPingPos: { x: number; y: number } | null = null;
  private radarPingColor: string = '#06b6d4';
  private radarContactAcquired: boolean = false;
  private onContactPingAcquired?: () => void;

  // Flight dynamics & banking
  private shipVisualX: number = 0;
  private shipVisualY: number = 0;
  private shipBankAngle: number = 0; // In radians
  private targetBankAngle: number = 0;
  private targetOffsetX: number = 0;
  private targetOffsetY: number = 0;
  private currentOffsetX: number = 0;
  private currentOffsetY: number = 0;
  private engineGlowPhase: number = 0;
  private shieldHitTimer: number = 0;
  private shieldRippleAngle: number = 0;

  // Celestial background feature (drifting gas giant / moon)
  private planet: CelestialPlanet | null = null;

  // Sector Level visual transition tracking
  public currentSectorLevel: number = 1;
  private targetSectorLevel: number = 1;
  private sectorTransitionProgress: number = 1; // 0 to 1 during transition
  private previousVisualProfile: SectorVisualProfile = SECTOR_VISUAL_PROFILES[1];
  private currentVisualProfile: SectorVisualProfile = SECTOR_VISUAL_PROFILES[1];

  // Dynamic Parallax Motion State
  private lateralParallaxOffset: number = 0; // Cumulative horizontal drift from speed/steering
  private verticalParallaxOffset: number = 0; // Cumulative forward parallax shift

  // Display properties config
  public displayProps: DisplayProperties = {
    viewMode: 'chase',
    spectrum: 'optical',
    showFlightVectors: true,
    showNavGrid: true,
    showShieldHexes: true,
    showThrusterTrails: true,
    zoomLevel: 1.0,
    dynamicBanking: true,
    bloomEffects: true,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D context unsupported');
    this.ctx = context;
    this.initEnvironment();
  }

  public setDisplayProperties(props: Partial<DisplayProperties>) {
    this.displayProps = { ...this.displayProps, ...props };
  }

  public setSteeringInput(normX: number, normY: number) {
    // normX & normY are between -1 and +1
    this.targetOffsetX = normX * 45;
    this.targetOffsetY = normY * 25;
    if (this.displayProps.dynamicBanking) {
      this.targetBankAngle = normX * 0.32; // up to ~18 degrees bank
    } else {
      this.targetBankAngle = 0;
    }
  }

  public resetSteering() {
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
    this.targetBankAngle = 0;
  }

  public getVisualProfile(sectorLevel: number = this.currentSectorLevel): SectorVisualProfile {
    const clamped = Math.max(1, Math.min(4, Math.floor(sectorLevel)));
    return SECTOR_VISUAL_PROFILES[clamped] || SECTOR_VISUAL_PROFILES[1];
  }

  public updateSectorProfile(targetLevel: number, immediate: boolean = false) {
    const safeTarget = Math.max(1, Math.min(4, Math.floor(targetLevel)));
    if (this.targetSectorLevel === safeTarget && !immediate) return;

    this.previousVisualProfile = this.currentVisualProfile;
    this.targetSectorLevel = safeTarget;
    this.currentSectorLevel = safeTarget;
    this.currentVisualProfile = this.getVisualProfile(safeTarget);

    if (immediate) {
      this.sectorTransitionProgress = 1;
      this.initEnvironment();
    } else {
      this.sectorTransitionProgress = 0; // Trigger smooth crossfade transition
      this.rebalanceStarDensity(this.currentVisualProfile.starDensity, this.currentVisualProfile.starColors);
    }
  }

  private rebalanceStarDensity(targetCount: number, colors: string[]) {
    const w = this.canvas.width || 800;
    const h = this.canvas.height || 600;

    // Smoothly adjust star array without popping existing stars
    if (this.stars.length < targetCount) {
      const needed = targetCount - this.stars.length;
      for (let i = 0; i < needed; i++) {
        const z = Math.random();
        const layer = z < 0.35 ? 0 : z < 0.75 ? 1 : 2;
        this.stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          layer,
          size: (1 - z * 0.6) * 1.8 + 0.5,
          speedMultiplier: (1 - z * 0.75) * 1.2 + 0.15,
          alpha: 0, // Fade in
          baseAlpha: Math.random() * 0.5 + 0.4,
          color: colors[Math.floor(Math.random() * colors.length)],
          twinkleSpeed: Math.random() * 3 + 1,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    } else if (this.stars.length > targetCount) {
      // Trim excess stars gradually
      this.stars.length = targetCount;
    }

    // Refresh cosmic dust density for the sector
    const targetDust = this.currentVisualProfile.dustCount;
    if (this.cosmicDust.length !== targetDust) {
      this.cosmicDust = [];
      for (let i = 0; i < targetDust; i++) {
        this.cosmicDust.push({
          x: Math.random() * w,
          y: Math.random() * h,
          speed: Math.random() * 1.8 + 1.2,
          size: Math.random() * 1.2 + 0.5,
          alpha: Math.random() * 0.4 + 0.15,
        });
      }
    }
  }

  private initEnvironment() {
    const w = this.canvas.width || 800;
    const h = this.canvas.height || 600;
    const profile = this.currentVisualProfile;

    // 1. Starfield layers with 3-tier Parallax Depths
    this.stars = [];
    const starCount = profile.starDensity || 280;
    const spectralColors = profile.starColors;

    for (let i = 0; i < starCount; i++) {
      const z = Math.random();
      // layer: 0 = background deep space (low speed, small, faint),
      // 1 = midground (medium speed), 2 = foreground drift (fast, bright, high parallax)
      const layer = z < 0.4 ? 0 : z < 0.8 ? 1 : 2;
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z,
        layer,
        size: layer === 2 ? Math.random() * 1.2 + 1.8 : (1 - z * 0.6) * 1.6 + 0.5,
        speedMultiplier: layer === 2 ? (1 - z * 0.5) * 1.9 + 1.1 : (1 - z * 0.75) * 1.2 + 0.15,
        alpha: Math.random() * 0.5 + 0.4,
        baseAlpha: Math.random() * 0.5 + 0.4,
        color: spectralColors[Math.floor(Math.random() * spectralColors.length)],
        twinkleSpeed: Math.random() * 3 + 1,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    // 2. High-speed Cosmic Dust Motes scaled to sector
    this.cosmicDust = [];
    const dustCount = profile.dustCount || 45;
    for (let i = 0; i < dustCount; i++) {
      this.cosmicDust.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: Math.random() * 1.8 + 1.2,
        size: Math.random() * 1.2 + 0.5,
        alpha: Math.random() * 0.4 + 0.15,
      });
    }

    // 3. Distant celestial body customized by sector
    this.planet = {
      x: w * 0.78,
      y: h * 0.22,
      radius: Math.min(w, h) * 0.14,
      hue: profile.planetHue,
      rings: profile.planetRings,
      angle: -0.35,
    };
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.initEnvironment();
  }

  public triggerShake(amount: number = 10) {
    this.shakeIntensity = Math.min(28, this.shakeIntensity + amount);
    this.shieldHitTimer = 1.0;
    this.shieldRippleAngle = Math.random() * Math.PI * 2;
  }

  public triggerScan() {
    this.isScanning = true;
    this.scanWaveRadius = 15;
  }

  public triggerRadarSweep(
    targetPos?: { x: number; y: number },
    color: string = '#06b6d4',
    onContactAcquired?: () => void
  ) {
    this.isRadarSweeping = true;
    this.radarSweepElapsed = 0;
    this.radarSweepAngle = -Math.PI / 2;
    this.radarTargetPingPos = targetPos || null;
    this.radarPingColor = color;
    this.radarContactAcquired = false;
    this.onContactPingAcquired = onContactAcquired;
  }

  public isRadarActive(): boolean {
    return this.isRadarSweeping;
  }

  public addImpactSparks(x: number, y: number, color: string = '#f87171', count: number = 28) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 35 + 25,
        glow: true,
      });
    }
  }

  public addRepairSparks(x: number, y: number) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 0.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: Math.random() * 2.8 + 1,
        color: '#38bdf8',
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 45 + 20,
        glow: true,
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
        const count = 9;
        for (let i = 0; i < count; i++) {
          const points: number[] = [];
          const numVerts = 9 + Math.floor(Math.random() * 5);
          for (let p = 0; p < numVerts; p++) {
            points.push(0.65 + Math.random() * 0.65);
          }

          const isScanTarget = i === 1; // Mark second asteroid as high-value scannable ore deposit
          const isPrimaryCore = i === 0;

          this.hazards.push({
            id: `ast-${i}`,
            x: Math.random() * (w * 0.85) + w * 0.075,
            y: Math.random() * (h * 0.5) - h * 0.25,
            vx: (Math.random() - 0.5) * 0.6,
            vy: Math.random() * 0.4 + 0.35,
            radius: isPrimaryCore ? 34 : Math.random() * 24 + 18,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.025,
            points,
            color: isScanTarget ? '#38bdf8' : '#64748b',
            type: 'asteroid_field',
            isScanTarget,
            hazardLabel: isPrimaryCore
              ? 'DENSE ASTEROID CORE'
              : isScanTarget
              ? 'PALLASITE ORE DEPOSIT'
              : `ASTEROID FRAGMENT #${i + 1}`,
            hazardSublabel: isPrimaryCore
              ? 'COLLISION VECTOR'
              : isScanTarget
              ? 'TITANIUM/SILICATE MATRIX'
              : 'TUMBLING SILICATE',
            category: isScanTarget ? 'MINERAL CONCENTRATION' : 'ASTEROID CLUSTER',
            threatLevel: isPrimaryCore ? 'CRITICAL' : isScanTarget ? 'CAUTION' : 'HAZARD',
            scanned: encounter.scanned || false,
            details: isScanTarget
              ? {
                  composition: '82% High-Density Titanium, Ferrosilicon',
                  salvageValue: 'High mineral harvesting yield',
                  hazardVector: 'Low relative angular velocity',
                  recommendedAction: 'Engage mining pulse or sensor probe to catalog mineral coordinates',
                  threatClass: 'Class II Celestial Mineral',
                }
              : {
                  composition: 'Porous Iron-Silicate & Basalt',
                  hazardVector: 'Direct bow kinetic collision threat',
                  recommendedAction: 'Execute evasive yaw or boost forward deflector capacity',
                  threatClass: isPrimaryCore ? 'Class IV Collision Hazard' : 'Class III Stray Debris',
                },
          });
        }
      } else if (encounter.type === 'spatial_anomaly') {
        // Core Singularity Event Horizon
        this.hazards.push({
          id: 'anom-singularity',
          x: w * 0.5,
          y: h * 0.24,
          vx: 0,
          vy: 0.12,
          radius: 54,
          rotation: 0,
          rotSpeed: 0.035,
          points: [],
          color: '#d946ef',
          type: 'spatial_anomaly',
          isScanTarget: false,
          hazardLabel: 'SINGULARITY EVENT HORIZON',
          hazardSublabel: 'GRAVITATIONAL SHEAR - CLASS IV',
          category: 'SPATIAL DISTORTION',
          threatLevel: 'CRITICAL',
          scanned: encounter.scanned || false,
          details: {
            composition: 'Collapsed Micro-Singularity Degenerate Matter',
            radiationLevel: '380 mSv/h Hawking Radiation',
            hazardVector: 'Extreme gravitational tidal gradient',
            recommendedAction: 'Maintain clearance >= 25 km; do not engage warp drives',
            threatClass: 'Class V Gravitational Hazard',
          },
        });

        // Orbiting Tachyon Accretion Rift (High value scan target)
        this.hazards.push({
          id: 'anom-tachyon-rift',
          x: w * 0.5 + 68,
          y: h * 0.24 - 32,
          vx: -0.05,
          vy: 0.11,
          radius: 28,
          rotation: 0.4,
          rotSpeed: -0.045,
          points: [],
          color: '#e879f9',
          type: 'spatial_anomaly',
          isScanTarget: true,
          hazardLabel: 'TACHYON ACCRETION RIFT',
          hazardSublabel: 'EXOTIC ENERGY RESONANCE',
          category: 'EXOTIC FLUX NODE',
          threatLevel: 'CAUTION',
          scanned: encounter.scanned || false,
          details: {
            composition: 'Coherent Exotic Baryons & Dark Matter Condensate',
            energySignature: 'Subspace Harmonic Frequency 412.8 THz',
            salvageValue: 'Auxiliary capacitor recharge potential',
            recommendedAction: 'Deploy directional sensor array to capture quantum telemetry',
            threatClass: 'Class II Scientific Opportunity',
          },
        });
      } else if (encounter.type === 'abandoned_vessel') {
        // Derelict Main Hull & Cargo Bay
        this.hazards.push({
          id: 'derelict-vessel',
          x: w * 0.52,
          y: h * 0.26,
          vx: 0.08,
          vy: 0.16,
          radius: 44,
          rotation: 0.25,
          rotSpeed: 0.006,
          points: [],
          color: '#94a3b8',
          type: 'abandoned_vessel',
          isScanTarget: true,
          hazardLabel: 'DERELICT CARGO USV-88',
          hazardSublabel: 'CARGO BAY & DATA RECORDER',
          category: 'DERELICT VESSEL',
          threatLevel: 'NOMINAL',
          scanned: encounter.scanned || false,
          details: {
            structuralIntegrity: '18% Remaining; Catastrophic Micro-fractures',
            salvageValue: 'Intact Deuterium fuel cells & Flight Black Box',
            composition: 'Reinforced Duranium-Titanium alloy',
            recommendedAction: 'Lock scan brackets to triangulate cargo bay access hatches',
            threatClass: 'Class I Derelict Salvage',
          },
        });

        // Venting Core Plasma Breach
        this.hazards.push({
          id: 'derelict-leak',
          x: w * 0.52 - 42,
          y: h * 0.26 + 18,
          vx: 0.04,
          vy: 0.18,
          radius: 26,
          rotation: 0,
          rotSpeed: 0.015,
          points: [],
          color: '#f59e0b',
          type: 'abandoned_vessel',
          isScanTarget: false,
          hazardLabel: 'UNCONTAINED DRIVE CORE',
          hazardSublabel: 'THERMAL BLEED & PLASMA JET',
          category: 'RADIATION HAZARD',
          threatLevel: 'HAZARD',
          scanned: encounter.scanned || false,
          details: {
            hazardVector: 'Thermal ionizing flare venting at 450 m/s',
            radiationLevel: '140 Rads/sec Bremsstrahlung radiation',
            recommendedAction: 'Keep bow deflectors angled toward plasma outflow',
            threatClass: 'Class III Reactor Rupture',
          },
        });
      } else if (encounter.type === 'ion_storm') {
        const count = 5;
        for (let i = 0; i < count; i++) {
          const isScanNode = i === 1;
          this.hazards.push({
            id: `ion-node-${i}`,
            x: Math.random() * w,
            y: Math.random() * (h * 0.45),
            vx: (Math.random() - 0.5) * 1.8,
            vy: Math.random() * 0.6 + 0.4,
            radius: Math.random() * 40 + 30,
            rotation: 0,
            rotSpeed: 0.02,
            points: [],
            color: isScanNode ? '#a855f7' : '#38bdf8',
            type: 'ion_storm',
            isScanTarget: isScanNode,
            hazardLabel: isScanNode ? 'RESONANT PLASMA VORTEX' : `ION DISCHARGE NODE #${i + 1}`,
            hazardSublabel: isScanNode ? 'HARMONIC ION FLUX' : 'CAPACITOR DRAIN HAZARD',
            category: isScanNode ? 'PLASMA WAVE HARMONIC' : 'ELECTROMAGNETIC DISCHARGE',
            threatLevel: isScanNode ? 'CAUTION' : i === 0 ? 'CRITICAL' : 'HAZARD',
            scanned: encounter.scanned || false,
            details: isScanNode
              ? {
                  composition: 'Charged Helium-3 & Positronic Streamers',
                  energySignature: 'High-frequency electromagnetic eddy loops',
                  recommendedAction: 'Analyze frequency harmonic to tune shield phase modulation',
                  threatClass: 'Class II Atmospheric Plasma',
                }
              : {
                  hazardVector: 'Direct capacitor reverse-feed and arcing',
                  energySignature: '12-16 MW Transient Voltage Spikes',
                  recommendedAction: 'Isolate auxiliary capacitor circuits and reduce throttle to Speed 1-2',
                  threatClass: 'Class IV EMP Discharge',
                },
          });
        }
      } else if (encounter.type === 'alien_beacon') {
        // Alien Monolith Transponder
        this.hazards.push({
          id: 'alien-beacon-core',
          x: w * 0.5,
          y: h * 0.25,
          vx: 0,
          vy: 0.09,
          radius: 36,
          rotation: 0,
          rotSpeed: 0.018,
          points: [],
          color: '#10b981',
          type: 'alien_beacon',
          isScanTarget: true,
          hazardLabel: 'XENO TACHYON EMITTER',
          hazardSublabel: 'MODULATED HARMONIC BEACON',
          category: 'XENOTECHNOLOGY',
          threatLevel: 'NOMINAL',
          scanned: encounter.scanned || false,
          details: {
            composition: 'Hyper-dense Metamaterial with Quantum Monocrystalline Lattice',
            energySignature: 'Pulsed Subspace Modulation at 1420.405 MHz (Hydrogen Line)',
            salvageValue: 'Extraterrestrial linguistic and telemetry data archive',
            recommendedAction: 'Maintain target lock for full broadband sensor telemetry capture',
            threatClass: 'Class I Xeno Artifact',
          },
        });

        // Repulsor Distortion Perimeter
        this.hazards.push({
          id: 'alien-beacon-barrier',
          x: w * 0.5,
          y: h * 0.25,
          vx: 0,
          vy: 0.09,
          radius: 72,
          rotation: 0,
          rotSpeed: -0.012,
          points: [],
          color: '#06b6d4',
          type: 'alien_beacon',
          isScanTarget: false,
          hazardLabel: 'DISPLACEMENT HORIZON',
          hazardSublabel: 'GRAVITATIONAL REPULSOR',
          category: 'REPULSOR BARRIER',
          threatLevel: 'HAZARD',
          scanned: encounter.scanned || false,
          details: {
            hazardVector: 'Kinetic dampening and subspace displacement wave',
            structuralIntegrity: 'Non-collapsible gravimetric field barrier',
            recommendedAction: 'Approach at sub-light speed; do not ram displacement field',
            threatClass: 'Class III Kinetic Barrier',
          },
        });
      }
    }
  }

  /**
   * Converts world object coordinates into viewport canvas screen coordinates
   */
  public toScreenCoordinates(worldX: number, worldY: number, ship: ShipState, now: number): { x: number; y: number } {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const zoom = this.displayProps.zoomLevel || 1.0;
    const cx = w / 2;
    const cy = h / 2;

    let camOffsetX = 0;
    let camOffsetY = 0;
    if (this.displayProps.viewMode === 'chase') {
      camOffsetY = -ship.speed * 3.5;
    } else if (this.displayProps.viewMode === 'cinematic') {
      camOffsetX = Math.sin(now * 0.0008) * 16;
      camOffsetY = Math.cos(now * 0.0006) * 10;
    }

    const sx = cx + (worldX + camOffsetX - cx) * zoom;
    const sy = cy + (worldY + camOffsetY - cy) * zoom;
    return { x: sx, y: sy };
  }

  /**
   * Returns tactical targets with screen coordinates for HUD overlay
   */
  public getTacticalTargets(
    ship: ShipState,
    encounter: Encounter | null,
    now: number
  ): TacticalTarget[] {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (!w || !h) return [];

    const targets: TacticalTarget[] = [];
    const edgeMargin = 32;

    // Helper to clamp to screen edge if off-screen
    const processCoordinates = (screenX: number, screenY: number) => {
      const isOffScreen =
        screenX < edgeMargin ||
        screenX > w - edgeMargin ||
        screenY < edgeMargin ||
        screenY > h - edgeMargin;

      let edgeX = screenX;
      let edgeY = screenY;
      let edgeAngle = 0;

      if (isOffScreen) {
        const cx = w / 2;
        const cy = h / 2;
        const dx = screenX - cx;
        const dy = screenY - cy;
        edgeAngle = Math.atan2(dy, dx);

        // Intersect ray with screen edge bounds
        const halfW = w / 2 - edgeMargin;
        const halfH = h / 2 - edgeMargin;

        const slope = dy / (dx || 0.0001);
        let ix = dx > 0 ? halfW : -halfW;
        let iy = slope * ix;

        if (Math.abs(iy) > halfH) {
          iy = dy > 0 ? halfH : -halfH;
          ix = iy / slope;
        }

        edgeX = cx + ix;
        edgeY = cy + iy;
      }

      return { isOffScreen, edgeX, edgeY, edgeAngle };
    };

    // 1. If encounter is active, map active hazards & scan targets
    if (encounter && encounter.active && this.hazards.length > 0) {
      // Prioritize primary hazards and scan targets (up to 4 key targets)
      const relevantHazards = this.hazards
        .filter((h) => h.isScanTarget || h.threatLevel === 'CRITICAL' || h.threatLevel === 'HAZARD')
        .slice(0, 4);

      // If list is small, include others
      if (relevantHazards.length === 0) {
        relevantHazards.push(...this.hazards.slice(0, 3));
      }

      for (const haz of relevantHazards) {
        const screenPos = this.toScreenCoordinates(haz.x, haz.y, ship, now);
        const { isOffScreen, edgeX, edgeY, edgeAngle } = processCoordinates(screenPos.x, screenPos.y);

        // Distance in km based on encounter distance + relative Y position
        const yDistDelta = ((haz.y - h * 0.25) / h) * 12;
        const distanceKm = Math.max(1, Math.round(encounter.distanceRemaining + yDistDelta));

        const targetType: TacticalTargetType = haz.isScanTarget ? 'scan_target' : 'hazard';
        const threatLevel: ThreatLevel = haz.threatLevel || (haz.isScanTarget ? 'CAUTION' : 'HAZARD');
        const threatColor =
          threatLevel === 'CRITICAL'
            ? '#ef4444'
            : threatLevel === 'HAZARD'
            ? '#f97316'
            : haz.isScanTarget
            ? '#10b981'
            : '#38bdf8';

        targets.push({
          id: haz.id,
          type: targetType,
          label: haz.hazardLabel || encounter.title,
          sublabel: haz.hazardSublabel || encounter.type.replace('_', ' ').toUpperCase(),
          category: haz.category || (haz.isScanTarget ? 'SCAN TARGET' : 'HAZARD ZONE'),
          x: screenPos.x,
          y: screenPos.y,
          radius: haz.radius,
          threatLevel,
          threatColor,
          distanceKm,
          relativeVelocity: Math.round((haz.vy + ship.speed * 0.45) * 18) / 10,
          scanned: haz.scanned || encounter.scanned || false,
          scanProgress: haz.scanProgress || (encounter.scanned ? 100 : 0),
          details: haz.details,
          isOffScreen,
          edgeX,
          edgeY,
          edgeAngle,
        });
      }
    }

    // 2. Distant Celestial Planet Survey Target (always present in deep space)
    if (this.planet) {
      const p = this.planet;
      const planetY = ((p.y + ship.distance * 8) % (h + p.radius * 4)) - p.radius * 2;
      const planetScreen = this.toScreenCoordinates(p.x, planetY, ship, now);
      const { isOffScreen, edgeX, edgeY, edgeAngle } = processCoordinates(planetScreen.x, planetScreen.y);

      targets.push({
        id: 'celestial-gas-giant',
        type: 'celestial',
        label: 'EXOPLANET SURVEY: AERO-IV',
        sublabel: 'GAS GIANT & RING SYSTEM',
        category: 'CELESTIAL SURVEY',
        x: planetScreen.x,
        y: planetScreen.y,
        radius: p.radius,
        threatLevel: 'NOMINAL',
        threatColor: '#38bdf8',
        distanceKm: Math.round(145000 - ship.distance * 120),
        relativeVelocity: 0.4,
        scanned: false,
        scanProgress: 0,
        details: {
          composition: '84% Hydrogen, 15% Helium-3, Trace Methane & Silicate Rings',
          radiationLevel: 'Low (0.04 mSv/h Magnetosphere)',
          salvageValue: 'Massive atmospheric Helium-3 scoop reserve',
          recommendedAction: 'Perform orbital sensor sweep to calculate atmospheric density gradient',
          threatClass: 'Class 0 Celestial Body',
        },
        isOffScreen,
        edgeX,
        edgeY,
        edgeAngle,
      });
    }

    // 3. Navigation Hyper-Lane Corridor Waypoint (Forward Vector)
    const navPos = this.toScreenCoordinates(w * 0.5, h * 0.16, ship, now);
    const navBounds = processCoordinates(navPos.x, navPos.y);
    targets.push({
      id: 'nav-vector-corridor',
      type: 'waypoint',
      label: `NAV VECTOR // ${ship.sector.toUpperCase()}`,
      sublabel: 'HYPER-LANE CORRIDOR',
      category: 'NAV WAYPOINT',
      x: navPos.x,
      y: navPos.y,
      radius: 22,
      threatLevel: 'NOMINAL',
      threatColor: '#06b6d4',
      distanceKm: Math.round(ship.distance * 15 + 40),
      relativeVelocity: ship.speed * 2.2,
      scanned: true,
      scanProgress: 100,
      details: {
        hazardVector: 'Nominal flight corridor; micro-debris density < 0.01 per km³',
        recommendedAction: 'Maintain current sub-light vector heading 042°',
        threatClass: 'Safe Transit Corridor',
      },
      isOffScreen: navBounds.isOffScreen,
      edgeX: navBounds.edgeX,
      edgeY: navBounds.edgeY,
      edgeAngle: navBounds.edgeAngle,
    });

    // 4. Ambient Deep Space Tachyon Echo (if no active encounter)
    if (!encounter || !encounter.active) {
      const echoPos = this.toScreenCoordinates(w * 0.22, h * 0.38, ship, now);
      const echoBounds = processCoordinates(echoPos.x, echoPos.y);
      targets.push({
        id: 'deep-space-echo',
        type: 'scan_target',
        label: 'SUB-SPACE EMISSION ECHO',
        sublabel: 'FAINT TACHYON FLUX',
        category: 'SCAN TARGET',
        x: echoPos.x,
        y: echoPos.y,
        radius: 26,
        threatLevel: 'CAUTION',
        threatColor: '#a855f7',
        distanceKm: Math.round(620 + Math.sin(now * 0.001) * 20),
        relativeVelocity: 1.1,
        scanned: false,
        scanProgress: 0,
        details: {
          energySignature: 'Modulated harmonic pulse on 412.4 MHz band',
          composition: 'Diffuse tachyon particulate envelope',
          recommendedAction: 'Trigger science radar scan to resolve sensor clarity',
          threatClass: 'Unclassified Anomaly',
        },
        isOffScreen: echoBounds.isOffScreen,
        edgeX: echoBounds.edgeX,
        edgeY: echoBounds.edgeY,
        edgeAngle: echoBounds.edgeAngle,
      });
    }

    return targets;
  }

  /**
   * Mark target as scanned
   */
  public scanTarget(id: string): boolean {
    for (const h of this.hazards) {
      if (h.id === id) {
        h.scanned = true;
        h.scanProgress = 100;
        return true;
      }
    }
    return false;
  }

  /**
   * Get ship visual screen position
   */
  public getShipScreenPosition(): { x: number; y: number } {
    return {
      x: this.shipVisualX || this.canvas.width / 2,
      y: this.shipVisualY || this.canvas.height * 0.72,
    };
  }

  public render(ship: ShipState, encounter: Encounter | null, now: number) {
    const dt = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.1) : 0.016;
    this.lastTime = now;
    this.engineGlowPhase += dt * (5 + ship.speed * 4);

    // Sync Sector Visual Profile if sectorLevel updated
    const incomingSectorLevel = ship.sectorLevel || 1;
    if (incomingSectorLevel !== this.currentSectorLevel) {
      this.updateSectorProfile(incomingSectorLevel, false);
    }

    if (this.shieldHitTimer > 0) {
      this.shieldHitTimer = Math.max(0, this.shieldHitTimer - dt * 2.2);
    }

    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Smooth flight dynamics lerp
    this.currentOffsetX += (this.targetOffsetX - this.currentOffsetX) * (dt * 5);
    this.currentOffsetY += (this.targetOffsetY - this.currentOffsetY) * (dt * 5);
    this.shipBankAngle += (this.targetBankAngle - this.shipBankAngle) * (dt * 6);

    ctx.save();

    // 1. Camera Shake
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(sx, sy);
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 22);
    }

    // 2. Global View Zoom and Mode Offset
    const zoom = this.displayProps.zoomLevel || 1.0;
    const centerX = w / 2;
    const centerY = h / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);
    ctx.translate(-centerX, -centerY);

    // Mode-specific camera adjustments
    if (this.displayProps.viewMode === 'chase') {
      // Slight pitch tilt and forward acceleration zoom
      const speedPitch = ship.speed * 3.5;
      ctx.translate(0, -speedPitch);
    } else if (this.displayProps.viewMode === 'cinematic') {
      // Gentle floating orbital drift
      const orbitX = Math.sin(now * 0.0008) * 16;
      const orbitY = Math.cos(now * 0.0006) * 10;
      ctx.translate(orbitX, orbitY);
    }

    // 3. Space Background & Deep Cosmos Rendering
    this.renderDeepSpace(ctx, w, h, now, ship);

    // 4. Parallax Starfield & Cosmic Dust
    this.renderStarfield(ctx, w, h, dt, ship, now);

    // 5. Tactical Navigation Grid (if enabled in display properties)
    if (this.displayProps.showNavGrid) {
      this.renderNavGrid(ctx, w, h, now, ship);
    }

    // 6. Hazards & Encounter Entities
    this.syncHazardsWithEncounter(encounter);
    this.renderHazards(ctx, w, h, dt, ship, encounter, now);

    // 7. Science Scanner Wave
    this.renderScannerWave(ctx, w, h, dt);

    // 7b. Tactical Radar Sweep & Active Sensor Ping Animation
    this.renderRadarSweep(ctx, w, h, dt, now);

    // 8. Player Ship Rendering (The StarshipNSV Vanguard)
    this.renderStarship(ctx, w, h, dt, ship, now);

    // 9. Particles (Exhaust, Sparks, Embers)
    this.renderParticles(ctx, dt);

    // 10. Sensor Spectrum Filter (Thermal, Night EM, Wireframe Blueprint, or Optical)
    this.applySpectrumOverlay(ctx, w, h, now);

    // 11. Tactical HUD & Flight Vectors Overlay
    if (this.displayProps.showFlightVectors) {
      this.renderTacticalOverlay(ctx, w, h, ship, encounter, now);
    }

    ctx.restore();
  }

  private renderDeepSpace(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    now: number,
    ship: ShipState
  ) {
    const profile = this.currentVisualProfile;
    const [c0, c1, c2] = profile.spaceGradients;

    // Deep obsidian space backdrop with radial gradient themed by sector
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 30, w * 0.5, h * 0.5, Math.max(w, h));
    bg.addColorStop(0, c0);
    bg.addColorStop(0.5, c1);
    bg.addColorStop(1, c2);
    ctx.fillStyle = bg;
    ctx.fillRect(-60, -60, w + 120, h + 120);

    // Multi-lobe procedural cosmic nebula clouds responsive to sector palette and subtle parallax
    const nAData = profile.nebulaLobeA;
    const nAX = w * nAData.pos[0] - this.currentOffsetX * 0.12;
    const nAY = h * nAData.pos[1] - this.currentOffsetY * 0.1;
    const nARadius = w * nAData.radius;
    const nA = ctx.createRadialGradient(nAX, nAY, 10, nAX, nAY, nARadius);
    nA.addColorStop(0, nAData.color0);
    nA.addColorStop(0.5, nAData.color1);
    nA.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nA;
    ctx.fillRect(0, 0, w, h);

    const nBData = profile.nebulaLobeB;
    const nBX = w * nBData.pos[0] - this.currentOffsetX * 0.08;
    const nBY = h * nBData.pos[1] - this.currentOffsetY * 0.07;
    const nBRadius = w * nBData.radius;
    const nB = ctx.createRadialGradient(nBX, nBY, 10, nBX, nBY, nBRadius);
    nB.addColorStop(0, nBData.color0);
    nB.addColorStop(0.6, nBData.color1);
    nB.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nB;
    ctx.fillRect(0, 0, w, h);

    // Render distant celestial body (planet, moon, or singularity)
    if (this.planet) {
      const p = this.planet;
      // Parallax scroll with ship distance and lateral flight banking
      const planetY = ((p.y + ship.distance * 8) % (h + p.radius * 4)) - p.radius * 2;
      const planetX = p.x - this.currentOffsetX * 0.15;

      ctx.save();
      ctx.translate(planetX, planetY);
      ctx.rotate(p.angle);

      // Back half of planetary rings
      if (p.rings) {
        ctx.save();
        ctx.scale(1, 0.35);
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 1.85, Math.PI, Math.PI * 2);
        ctx.lineWidth = p.radius * 0.45;
        const ringGrad = ctx.createLinearGradient(-p.radius * 2, 0, p.radius * 2, 0);
        ringGrad.addColorStop(0, `hsla(${p.hue}, 80%, 75%, 0.02)`);
        ringGrad.addColorStop(0.3, `hsla(${p.hue}, 80%, 75%, 0.22)`);
        ringGrad.addColorStop(0.6, `hsla(${p.hue}, 85%, 65%, 0.12)`);
        ringGrad.addColorStop(1, `hsla(${p.hue}, 80%, 75%, 0.02)`);
        ctx.strokeStyle = ringGrad;
        ctx.stroke();
        ctx.restore();
      }

      // Planet Sphere with spherical shadow terminator themed by hue
      const pGrad = ctx.createRadialGradient(
        -p.radius * 0.35,
        -p.radius * 0.35,
        p.radius * 0.1,
        0,
        0,
        p.radius
      );
      pGrad.addColorStop(0, `hsl(${p.hue}, 85%, 65%)`);
      pGrad.addColorStop(0.4, `hsl(${p.hue}, 80%, 35%)`);
      pGrad.addColorStop(0.8, `hsl(${p.hue}, 80%, 15%)`);
      pGrad.addColorStop(1, '#020617');

      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = pGrad;
      ctx.fill();

      // Atmospheric limb glow
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${p.hue}, 85%, 60%, 0.4)`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Front half of rings
      if (p.rings) {
        ctx.save();
        ctx.scale(1, 0.35);
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 1.85, 0, Math.PI);
        ctx.lineWidth = p.radius * 0.45;
        const ringGradF = ctx.createLinearGradient(-p.radius * 2, 0, p.radius * 2, 0);
        ringGradF.addColorStop(0, `hsla(${p.hue}, 80%, 75%, 0.02)`);
        ringGradF.addColorStop(0.3, `hsla(${p.hue}, 80%, 75%, 0.35)`);
        ringGradF.addColorStop(0.6, `hsla(${p.hue}, 85%, 65%, 0.18)`);
        ringGradF.addColorStop(1, `hsla(${p.hue}, 80%, 75%, 0.02)`);
        ctx.strokeStyle = ringGradF;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }
  }

  private renderStarfield(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number,
    ship: ShipState,
    now: number
  ) {
    // Dynamic Speed Multipliers:
    // Speed 0 = calm drifting, Speed 1..5 = escalating warp acceleration
    const baseSpeed = 26;
    const speedRatio = ship.speed === 0 ? 0.35 : 0.8 + ship.speed * 1.45;
    const velocity = baseSpeed * (1 + speedRatio * 2.5);

    // Parallax Lateral Drift Vector based on ship steering and bank angle
    const lateralShiftFactor = this.currentOffsetX * 0.45;
    const bankShiftFactor = Math.sin(this.shipBankAngle) * 35;
    const totalLateralShift = lateralShiftFactor + bankShiftFactor;

    // Accumulate smooth parallax offset
    this.lateralParallaxOffset += totalLateralShift * dt;
    this.verticalParallaxOffset += velocity * dt;

    // 1. Dynamic Parallax Star Layers (Distant, Midground, Foreground)
    for (const star of this.stars) {
      // 3-Tier Layer Weighting:
      // Layer 0 (distant): 0.25x speed, minimal parallax shift
      // Layer 1 (midground): 0.75x speed, moderate parallax shift
      // Layer 2 (foreground): 1.6x speed, dramatic parallax shift
      const layerWeight = star.layer === 0 ? 0.35 : star.layer === 1 ? 0.85 : 1.7;
      const parallaxDriftX = totalLateralShift * layerWeight * dt * -0.65;

      // Update positions
      star.y += velocity * star.speedMultiplier * layerWeight * dt;
      star.x += parallaxDriftX;

      // Wrap-around bounds with margins
      if (star.y > h + 20) {
        star.y = -15;
        star.x = Math.random() * w;
      } else if (star.y < -20) {
        star.y = h + 15;
        star.x = Math.random() * w;
      }

      if (star.x > w + 20) {
        star.x = -15;
      } else if (star.x < -20) {
        star.x = w + 15;
      }

      // Dynamic twinkle
      const twinkle = Math.sin(now * 0.001 * star.twinkleSpeed + star.twinkleOffset) * 0.25;
      const alpha = Math.max(0.18, Math.min(1, star.baseAlpha + twinkle));

      ctx.save();
      ctx.globalAlpha = alpha;

      // Dynamic Warp Streaks when traveling at high speed
      if (ship.speed >= 3) {
        // Foreground stars stretch significantly longer to amplify 3D depth
        const streakLen = Math.min(55, (ship.speed * 6.5 + star.layer * 4.5) * star.speedMultiplier);
        // Warp angle shifts slightly with lateral bank
        const skewX = -Math.sin(this.shipBankAngle * 0.4) * (streakLen * 0.3);

        ctx.strokeStyle = star.color;
        ctx.lineWidth = star.size * (star.layer === 2 ? 0.95 : 0.7);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x + skewX, star.y - streakLen);
        ctx.stroke();

        // Warp particle head glint
        if (star.layer === 2) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Star corona glint for brighter / foreground stars
        if (star.size > 1.7) {
          ctx.strokeStyle = star.color;
          ctx.globalAlpha = alpha * 0.45;
          ctx.lineWidth = 0.65;
          ctx.beginPath();
          ctx.moveTo(star.x - star.size * 2.2, star.y);
          ctx.lineTo(star.x + star.size * 2.2, star.y);
          ctx.moveTo(star.x, star.y - star.size * 2.2);
          ctx.lineTo(star.x, star.y + star.size * 2.2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 2. High-speed Cosmic Dust with Sector Themed Shading & Extreme Parallax
    const dustColor = this.currentVisualProfile.dustColor;
    for (const dust of this.cosmicDust) {
      dust.y += velocity * dust.speed * 1.6 * dt;
      dust.x += totalLateralShift * dust.speed * dt * -0.85;

      if (dust.y > h + 25) {
        dust.y = -25;
        dust.x = Math.random() * w;
      }
      if (dust.x > w + 25) dust.x = -20;
      else if (dust.x < -25) dust.x = w + 20;

      ctx.save();
      ctx.globalAlpha = dust.alpha * (ship.speed > 0 ? 1 : 0.45);
      const dustLen = Math.max(3, ship.speed * 9 * dust.speed);
      const skewDustX = -Math.sin(this.shipBankAngle * 0.5) * (dustLen * 0.35);

      ctx.strokeStyle = dustColor;
      ctx.lineWidth = dust.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(dust.x, dust.y);
      ctx.lineTo(dust.x + skewDustX, dust.y - dustLen);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderNavGrid(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    now: number,
    ship: ShipState
  ) {
    ctx.save();
    ctx.strokeStyle = this.currentVisualProfile.gridColor || 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;

    // Moving vertical & horizontal vector grid lines with lateral parallax and speed flow
    const gridSize = 48;
    const gridOffsetY = (now * 0.04 * (ship.speed + 1)) % gridSize;
    const gridOffsetX = ((-this.currentOffsetX * 0.25) % gridSize + gridSize) % gridSize;

    for (let x = gridOffsetX; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = gridOffsetY; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Centerline heading marks
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.setLineDash([4, 12]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    ctx.restore();
  }

  private renderHazards(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number,
    ship: ShipState,
    encounter: Encounter | null,
    now: number
  ) {
    for (const haz of this.hazards) {
      haz.y += (haz.vy + ship.speed * 0.45) * 60 * dt;
      haz.x += haz.vx * 60 * dt;
      haz.rotation += haz.rotSpeed;

      // Recycle if dropped off screen
      if (haz.y > h + 70 && encounter && encounter.active) {
        haz.y = -60;
        haz.x = Math.random() * (w * 0.8) + w * 0.1;
      }

      ctx.save();
      ctx.translate(haz.x, haz.y);
      ctx.rotate(haz.rotation);

      if (haz.type === 'asteroid_field') {
        // Detailed 3D-shaded Asteroid with craters and rock faceting
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

        // Light direction gradient (sunlight from top-left)
        const astGrad = ctx.createLinearGradient(
          -haz.radius,
          -haz.radius,
          haz.radius,
          haz.radius
        );
        astGrad.addColorStop(0, '#64748b');
        astGrad.addColorStop(0.5, '#334155');
        astGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = astGrad;
        ctx.fill();

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Primary Crater with shadow lip
        ctx.save();
        ctx.translate(-haz.radius * 0.22, -haz.radius * 0.15);
        ctx.beginPath();
        ctx.arc(0, 0, haz.radius * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Secondary small crater
        ctx.save();
        ctx.translate(haz.radius * 0.35, haz.radius * 0.3);
        ctx.beginPath();
        ctx.arc(0, 0, haz.radius * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      } else if (haz.type === 'spatial_anomaly') {
        // Gravitational singularity vortex with event horizon
        for (let r = 4; r >= 1; r--) {
          const ringRad = haz.radius * (r / 4);
          const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, ringRad);
          grad.addColorStop(0, 'rgba(236, 72, 153, 0.7)');
          grad.addColorStop(0.4, 'rgba(168, 85, 247, 0.4)');
          grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.15)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, ringRad, 0, Math.PI * 2);
          ctx.fill();
        }

        // Accretion disk matter spirals
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.85)';
        ctx.lineWidth = 2;
        for (let a = 0; a < 4; a++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(
            haz.radius * 0.4,
            haz.radius * 0.25,
            haz.radius * 0.8,
            -haz.radius * 0.35,
            haz.radius * 1.25,
            0
          );
          ctx.stroke();
        }

        // Central pitch-black event horizon
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, haz.radius * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.9)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else if (haz.type === 'abandoned_vessel') {
        // High-detail derelict research vessel
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;

        // Command module
        ctx.fillRect(-14, -30, 28, 60);
        ctx.strokeRect(-14, -30, 28, 60);

        // Broken fractured solar panel
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-38, -12, 24, 20);
        ctx.strokeRect(-38, -12, 24, 20);
        // Shattered solar panel frame lines
        ctx.beginPath();
        ctx.moveTo(-38, -2);
        ctx.lineTo(-14, -2);
        ctx.moveTo(-26, -12);
        ctx.lineTo(-26, 8);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Right detached engine pod
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(16, 4, 16, 22);
        ctx.strokeRect(16, 4, 16, 22);

        // Blinking emergency distress strobe
        const strobe = Math.sin(now * 0.008) > 0.4;
        if (strobe) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, -22, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      } else if (haz.type === 'ion_storm') {
        // Volumetric electromagnetic plasma cloud
        const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, haz.radius);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        grad.addColorStop(0.5, 'rgba(14, 165, 233, 0.2)');
        grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, haz.radius, 0, Math.PI * 2);
        ctx.fill();

        // Dynamic electric discharge arc
        if (Math.random() < 0.35) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          let lx = (Math.random() - 0.5) * haz.radius * 0.8;
          let ly = (Math.random() - 0.5) * haz.radius * 0.8;
          ctx.moveTo(lx, ly);
          for (let s = 0; s < 3; s++) {
            lx += (Math.random() - 0.5) * 20;
            ly += (Math.random() - 0.5) * 20;
            ctx.lineTo(lx, ly);
          }
          ctx.stroke();
        }
      } else if (haz.type === 'alien_beacon') {
        // Alien monolith with resonant emerald glyphs
        ctx.fillStyle = '#064e3b';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -haz.radius);
        ctx.lineTo(haz.radius * 0.65, haz.radius * 0.7);
        ctx.lineTo(0, haz.radius * 0.45);
        ctx.lineTo(-haz.radius * 0.65, haz.radius * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pulsing emerald tachyon core
        const pulse = (Math.sin(now * 0.005) + 1) * 0.5;
        const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 14 + pulse * 6);
        coreGrad.addColorStop(0, '#a7f3d0');
        coreGrad.addColorStop(0.4, '#10b981');
        coreGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 14 + pulse * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderScannerWave(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number
  ) {
    if (!this.isScanning) return;

    this.scanWaveRadius += dt * 520;
    const originX = w / 2 + this.currentOffsetX;
    const originY = h * 0.72 + this.currentOffsetY;

    ctx.save();
    ctx.beginPath();
    ctx.arc(originX, originY, this.scanWaveRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 8]);
    ctx.stroke();

    // Radar pulse wave echo
    ctx.beginPath();
    ctx.arc(originX, originY, Math.max(0, this.scanWaveRadius - 28), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();

    if (this.scanWaveRadius > Math.max(w, h) * 1.3) {
      this.isScanning = false;
      this.scanWaveRadius = 0;
    }
  }

  private renderRadarSweep(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number,
    now: number
  ) {
    if (!this.isRadarSweeping) return;

    this.radarSweepElapsed += dt;
    if (this.radarSweepElapsed >= this.radarSweepDuration) {
      this.isRadarSweeping = false;
      this.radarSweepElapsed = 0;
      return;
    }

    const progress = Math.min(1, this.radarSweepElapsed / this.radarSweepDuration);

    // Alpha fade envelope: smooth fade in at start, smooth fade out at end
    const alphaIn = Math.min(1, progress / 0.12);
    const alphaOut = Math.min(1, (1 - progress) / 0.22);
    const globalAlpha = Math.min(alphaIn, alphaOut);
    if (globalAlpha <= 0) return;

    // Origin centered on starship forward sensor emitter
    const originX = this.shipVisualX || w / 2;
    const originY = (this.shipVisualY || h * 0.72) - 15;
    const maxRadius = Math.hypot(w, h);

    // Radar rotational sweep: 2 full 360° sweeps across the duration
    // Starting straight forward (-PI / 2)
    const sweepAngle = -Math.PI / 2 + progress * Math.PI * 4;
    this.radarSweepAngle = sweepAngle;

    ctx.save();

    // 1. Concentric Tactical Radar Range Rings
    const ringRadii = [
      Math.min(w, h) * 0.16,
      Math.min(w, h) * 0.32,
      Math.min(w, h) * 0.52,
      Math.min(w, h) * 0.76,
    ];
    const rangeLabels = ['10 KM', '25 KM', '50 KM', '75 KM'];

    for (let rIdx = 0; rIdx < ringRadii.length; rIdx++) {
      const radius = ringRadii[rIdx];
      const ringAlpha = (0.28 - rIdx * 0.04) * globalAlpha;

      ctx.beginPath();
      ctx.arc(originX, originY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(6, 182, 212, ${ringAlpha})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.stroke();

      // Range distance label
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(56, 189, 248, ${ringAlpha * 1.4})`;
      ctx.fillText(rangeLabels[rIdx], originX + 6, originY - radius + 11);
    }

    // 2. Cardinal Crosshairs & Azimuth Ticks
    const outerRadius = ringRadii[ringRadii.length - 1];
    ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(6, 182, 212, ${0.2 * globalAlpha})`;
    ctx.lineWidth = 1;

    // Forward vector line
    ctx.beginPath();
    ctx.moveTo(originX, originY - outerRadius - 15);
    ctx.lineTo(originX, originY + outerRadius * 0.4);
    ctx.stroke();

    // Horizontal axis line
    ctx.beginPath();
    ctx.moveTo(originX - outerRadius, originY);
    ctx.lineTo(originX + outerRadius, originY);
    ctx.stroke();

    // Azimuth degree tick marks every 30 degrees around outer ring
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180 - Math.PI / 2;
      const innerX = originX + Math.cos(rad) * (outerRadius - 6);
      const innerY = originY + Math.sin(rad) * (outerRadius - 6);
      const outerX = originX + Math.cos(rad) * (outerRadius + 4);
      const outerY = originY + Math.sin(rad) * (outerRadius + 4);

      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(outerX, outerY);
      ctx.stroke();

      if (deg % 90 === 0) {
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = `rgba(56, 189, 248, ${0.35 * globalAlpha})`;
        const lblX = originX + Math.cos(rad) * (outerRadius + 14);
        const lblY = originY + Math.sin(rad) * (outerRadius + 14);
        const label = deg === 0 ? '000°' : deg === 90 ? '090°' : deg === 180 ? '180°' : '270°';
        ctx.fillText(label, lblX - 10, lblY + 3);
      }
    }

    // 3. High-Speed Expanding Sensor Ping Shockwaves
    const waveCount = 2;
    for (let wi = 0; wi < waveCount; wi++) {
      const wavePhase = ((this.radarSweepElapsed * 1.6 + wi * 0.8) % 1.6) / 1.6;
      const waveRadius = wavePhase * maxRadius;
      const waveAlpha = (1 - wavePhase) * 0.45 * globalAlpha;

      if (waveRadius > 10) {
        ctx.beginPath();
        ctx.arc(originX, originY, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${waveAlpha})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    }

    // 4. Phosphor Persistence Fan (Trailing Radar Sweep Cone)
    // Fades smoothly from the leading edge back ~57 degrees
    const trailSpan = Math.PI * 0.32;
    const sliceCount = 14;

    for (let s = 0; s < sliceCount; s++) {
      const startAngle = sweepAngle - ((s + 1) / sliceCount) * trailSpan;
      const endAngle = sweepAngle - (s / sliceCount) * trailSpan;
      const sliceT = 1 - s / sliceCount; // 1 at leading edge, 0 at tail
      const sliceAlpha = Math.pow(sliceT, 1.8) * 0.18 * globalAlpha;

      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.arc(originX, originY, maxRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = `rgba(6, 182, 212, ${sliceAlpha})`;
      ctx.fill();
    }

    // 5. Leading Radar Sweep Vector Beam
    const beamEndX = originX + Math.cos(sweepAngle) * maxRadius;
    const beamEndY = originY + Math.sin(sweepAngle) * maxRadius;

    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(beamEndX, beamEndY);
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.9 * globalAlpha})`;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();

    // Sensor emitter center pulse
    ctx.beginPath();
    ctx.arc(originX, originY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.fill();

    // 6. Target Contact Acquisition & Hazard Ping Blips
    const targetPos = this.radarTargetPingPos || (this.hazards.length > 0 ? { x: this.hazards[0].x, y: this.hazards[0].y } : null);

    if (targetPos) {
      // Trigger contact acquisition callback once sweep crosses the contact
      if (progress > 0.22 && !this.radarContactAcquired) {
        this.radarContactAcquired = true;
        if (this.onContactPingAcquired) {
          this.onContactPingAcquired();
        }
      }

      // Render Contact Blip & Ping Rings
      if (this.radarContactAcquired) {
        // Expanding contact sonar ripple
        const contactWave = ((this.radarSweepElapsed * 2) % 1) * 35;
        ctx.beginPath();
        ctx.arc(targetPos.x, targetPos.y, contactWave, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(244, 63, 94, ${(1 - contactWave / 35) * 0.8 * globalAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Contact diamond reticle
        const retSize = 14;
        ctx.save();
        ctx.translate(targetPos.x, targetPos.y);
        ctx.rotate(now * 0.001);
        ctx.strokeStyle = this.radarPingColor;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = this.radarPingColor;
        ctx.shadowBlur = 12;
        ctx.strokeRect(-retSize / 2, -retSize / 2, retSize, retSize);
        ctx.restore();

        // Center contact core
        ctx.beginPath();
        ctx.arc(targetPos.x, targetPos.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = this.radarPingColor;
        ctx.shadowColor = this.radarPingColor;
        ctx.shadowBlur = 14;
        ctx.fill();

        // Contact Telemetry Tag
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = this.radarPingColor;
        ctx.fillText('▲ ACTIVE PING ACQUIRED', targetPos.x + 14, targetPos.y - 6);
      }
    }

    // Secondary Hazards Phosphor Blips
    for (const h of this.hazards) {
      if (targetPos && h.x === targetPos.x && h.y === targetPos.y) continue;
      const hAngle = Math.atan2(h.y - originY, h.x - originX);
      const normHAngle = (hAngle + Math.PI * 2) % (Math.PI * 2);
      const normSweepAngle = (sweepAngle + Math.PI * 2) % (Math.PI * 2);
      const diff = (normSweepAngle - normHAngle + Math.PI * 2) % (Math.PI * 2);

      // If swept within last 90 degrees, show decaying phosphor blip
      if (diff < Math.PI * 0.5) {
        const blipAlpha = (1 - diff / (Math.PI * 0.5)) * 0.7 * globalAlpha;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 63, 94, ${blipAlpha})`;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 8;
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private renderStarship(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number,
    ship: ShipState,
    now: number
  ) {
    const shipBaseX = w / 2;
    const shipBaseY = h * 0.72;

    // Ship position incorporating steering offsets & micro-pitch inertia
    const shipX = shipBaseX + this.currentOffsetX;
    const microSway = Math.sin(now * 0.002) * 1.5;
    const shipY = shipBaseY + this.currentOffsetY + microSway;

    this.shipVisualX = shipX;
    this.shipVisualY = shipY;

    // 1. Emit Thruster Particles based on speed & maneuvering
    this.emitThrusterParticles(shipX, shipY, ship);

    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.rotate(this.shipBankAngle);

    // Dynamic bank scale compression to simulate 3D roll
    const bankScaleX = Math.cos(this.shipBankAngle * 0.8);
    ctx.scale(bankScaleX, 1);

    // 2. Deflector Shield Hexagonal Lattice & Impact Shockwaves
    if (ship.shields > 0 && this.displayProps.showShieldHexes) {
      this.renderShieldBubble(ctx, ship, now);
    }

    // 3. Thruster Exhaust Plumes (Dual Heavy Plasma Nacelles)
    this.renderThrusterPlumes(ctx, ship, now);

    // 4. Ship Main Airframe & Wings (NSV Vanguard-9)
    this.renderShipChassis(ctx, ship, now);

    // 5. Damage Visual Effects (Smoke, electrical short arcs, hull scorch)
    this.renderShipDamageEffects(ctx, ship, now);

    ctx.restore();
  }

  private emitThrusterParticles(shipX: number, shipY: number, ship: ShipState) {
    if (ship.speed <= 0) {
      // Idle micro-sparks occasionally
      if (Math.random() < 0.2) {
        this.particles.push({
          x: shipX + (Math.random() - 0.5) * 16,
          y: shipY + 28,
          vx: (Math.random() - 0.5) * 0.6,
          vy: Math.random() * 1.5 + 0.5,
          size: Math.random() * 1.5 + 0.8,
          color: '#38bdf8',
          alpha: 0.6,
          life: 0,
          maxLife: 18,
        });
      }
      return;
    }

    // High output engine stream
    const emitRate = Math.min(8, Math.floor(ship.speed * 1.6 + 1));
    const nozzleOffsets = [-15, 15]; // Twin engine cowlings

    for (let i = 0; i < emitRate; i++) {
      const nozzleX = nozzleOffsets[Math.floor(Math.random() * nozzleOffsets.length)];
      const spreadX = (Math.random() - 0.5) * 5;
      const speedMult = ship.speed * 2.6 + 2.5;

      const isWarp = ship.speed >= 4;
      const emberColor = isWarp
        ? Math.random() < 0.4
          ? '#e879f9'
          : '#a855f7'
        : Math.random() < 0.35
        ? '#ffffff'
        : '#38bdf8';

      this.particles.push({
        x: shipX + nozzleX + spreadX,
        y: shipY + 28,
        vx: (Math.random() - 0.5) * 1.8,
        vy: Math.random() * speedMult + 2,
        size: Math.random() * (ship.speed * 0.8 + 2.2) + 1.8,
        color: emberColor,
        alpha: 0.85,
        life: 0,
        maxLife: Math.random() * 18 + 14,
        glow: true,
      });
    }

    // RCS Jet puffs when banking
    if (Math.abs(this.targetBankAngle) > 0.08) {
      const rcsSide = this.targetBankAngle > 0 ? -28 : 28;
      this.particles.push({
        x: shipX + rcsSide,
        y: shipY - 5,
        vx: (this.targetBankAngle > 0 ? -1 : 1) * (Math.random() * 2 + 1.5),
        vy: (Math.random() - 0.5) * 1.2,
        size: Math.random() * 2 + 1,
        color: '#bae6fd',
        alpha: 0.7,
        life: 0,
        maxLife: 12,
      });
    }
  }

  private renderThrusterPlumes(
    ctx: CanvasRenderingContext2D,
    ship: ShipState,
    now: number
  ) {
    if (ship.speed === 0) return;

    const engineLength = 18 + ship.speed * 16;
    const isWarp = ship.speed >= 4;
    const pulse = Math.sin(this.engineGlowPhase) * 2;
    const nozzles = [-15, 15];

    for (const nx of nozzles) {
      ctx.save();
      ctx.translate(nx, 24);

      // Outer plasma exhaust envelope
      const envGrad = ctx.createLinearGradient(0, 0, 0, engineLength + pulse);
      if (isWarp) {
        envGrad.addColorStop(0, '#f472b6');
        envGrad.addColorStop(0.3, 'rgba(192, 132, 252, 0.7)');
        envGrad.addColorStop(1, 'rgba(147, 51, 234, 0)');
      } else {
        envGrad.addColorStop(0, '#ffffff');
        envGrad.addColorStop(0.25, '#38bdf8');
        envGrad.addColorStop(0.7, 'rgba(14, 165, 233, 0.4)');
        envGrad.addColorStop(1, 'rgba(3, 105, 161, 0)');
      }

      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, engineLength + pulse);
      ctx.closePath();
      ctx.fillStyle = envGrad;
      ctx.fill();

      // Shock Diamonds (Mach compression diamonds) inside plume
      const diamondsCount = Math.min(4, Math.floor(ship.speed));
      ctx.fillStyle = '#ffffff';
      for (let d = 1; d <= diamondsCount; d++) {
        const dy = d * (engineLength / (diamondsCount + 1));
        const dw = Math.max(1.5, 4.5 - d * 0.8);
        ctx.beginPath();
        ctx.moveTo(0, dy - 2);
        ctx.lineTo(dw, dy);
        ctx.lineTo(0, dy + 2);
        ctx.lineTo(-dw, dy);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderShipChassis(
    ctx: CanvasRenderingContext2D,
    ship: ShipState,
    now: number
  ) {
    // 1. Under-wing shadows and ambient reactor underglow
    const reactorGrad = ctx.createRadialGradient(0, 5, 2, 0, 5, 34);
    reactorGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    reactorGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = reactorGrad;
    ctx.beginPath();
    ctx.arc(0, 5, 34, 0, Math.PI * 2);
    ctx.fill();

    // 2. Primary Swept Wings (Titanium-carbon delta structure)
    ctx.fillStyle = '#090d16'; // Deep stealth composite
    ctx.strokeStyle = '#1e293b'; // Structural hairline
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, -38); // Nose cone
    ctx.lineTo(14, -8); // Forward strake transition
    ctx.lineTo(34, 16); // Starboard wingtip
    ctx.lineTo(26, 26); // Starboard trailing edge / flap
    ctx.lineTo(18, 22); // Starboard thruster mount
    ctx.lineTo(0, 26); // Rear centerline empennage
    ctx.lineTo(-18, 22); // Port thruster mount
    ctx.lineTo(-26, 26); // Port trailing edge
    ctx.lineTo(-34, 16); // Port wingtip
    ctx.lineTo(-14, -8); // Port forward strake
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Wing Leading-Edge Armor Plates (Refined dual-tone panels)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;

    // Starboard wing armor facet
    ctx.beginPath();
    ctx.moveTo(10, -5);
    ctx.lineTo(30, 14);
    ctx.lineTo(22, 17);
    ctx.lineTo(10, 8);
    ctx.closePath();
    ctx.fill();

    // Port wing armor facet
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.lineTo(-30, 14);
    ctx.lineTo(-22, 17);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();

    // 4. Central Fuselage Spine & Core Hull
    const hullGrad = ctx.createLinearGradient(-12, 0, 12, 0);
    hullGrad.addColorStop(0, '#111827');
    hullGrad.addColorStop(0.3, '#1e293b');
    hullGrad.addColorStop(0.5, '#334155');
    hullGrad.addColorStop(0.7, '#1e293b');
    hullGrad.addColorStop(1, '#111827');
    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, -36); // Needle nose
    ctx.lineTo(9, -12);
    ctx.lineTo(11, 14);
    ctx.lineTo(0, 20);
    ctx.lineTo(-11, 14);
    ctx.lineTo(-9, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Dorsal Energy Conduit Pulse Line running down the spine
    const conduitGlow = Math.sin(this.engineGlowPhase * 0.8) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(56, 189, 248, ${conduitGlow})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(0, 15);
    ctx.stroke();

    // 6. Cockpit Glass Canopy (Polarized nano-composite glass with specular sheen)
    const glassGrad = ctx.createLinearGradient(0, -26, 0, -8);
    glassGrad.addColorStop(0, '#38bdf8');
    glassGrad.addColorStop(0.4, '#0284c7');
    glassGrad.addColorStop(1, '#075985');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(5, -12);
    ctx.lineTo(4, -8);
    ctx.lineTo(-4, -8);
    ctx.lineTo(-5, -12);
    ctx.closePath();
    ctx.fill();

    // Specular Reflection glint across canopy
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-1, -24);
    ctx.lineTo(2, -18);
    ctx.lineTo(1, -17);
    ctx.lineTo(-2, -23);
    ctx.closePath();
    ctx.fill();

    // 7. Twin Heavy Propulsion Engine Cowlings & Nozzles
    const nozzles = [-15, 15];
    for (const nx of nozzles) {
      // Metallic nozzle ring
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.2;
      ctx.fillRect(nx - 4, 18, 8, 7);
      ctx.strokeRect(nx - 4, 18, 8, 7);

      // Glowing nozzle emitter throat
      ctx.fillStyle =
        ship.speed > 0
          ? ship.speed >= 4
            ? '#f43f5e'
            : '#38bdf8'
          : '#1e293b';
      ctx.fillRect(nx - 3, 23, 6, 2.5);
    }

    // 8. Aviation Standard Navigation Strobes
    // Starboard: Green (Right)
    const navBlink = Math.sin(now * 0.006) > 0;
    ctx.fillStyle = navBlink ? '#22c55e' : '#14532d';
    ctx.beginPath();
    ctx.arc(33, 16, 2, 0, Math.PI * 2);
    ctx.fill();
    if (navBlink) {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Port: Red (Left)
    ctx.fillStyle = navBlink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(-33, 16, 2, 0, Math.PI * 2);
    ctx.fill();
    if (navBlink) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // White Xenon Anti-collision Strobe (Flash every 1.5s)
    const xenonFlash = Math.sin(now * 0.004) > 0.85;
    if (xenonFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -35, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }

  private renderShieldBubble(
    ctx: CanvasRenderingContext2D,
    ship: ShipState,
    now: number
  ) {
    const shieldPct = Math.max(0, Math.min(100, ship.shields)) / 100;
    const baseAlpha = 0.12 + shieldPct * 0.35;
    const hitBonus = this.shieldHitTimer * 0.5;
    const alpha = Math.min(0.9, baseAlpha + hitBonus);

    const shieldRadius = 52;

    // Hexagonal deflector lattice
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);

    // Ellipsoidal gradient glow
    const grad = ctx.createRadialGradient(0, 0, shieldRadius * 0.4, 0, 0, shieldRadius);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    grad.addColorStop(0.8, `rgba(56, 189, 248, ${alpha * 0.4})`);
    grad.addColorStop(1, `rgba(186, 230, 253, ${alpha})`);
    ctx.fillStyle = grad;
    ctx.fill();

    // Shield rim perimeter
    ctx.strokeStyle = `rgba(186, 230, 253, ${alpha * 1.3})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw hex lattice facets along rim
    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.6})`;
    ctx.lineWidth = 1;
    const hexCount = 12;
    for (let h = 0; h < hexCount; h++) {
      const a = (h / hexCount) * Math.PI * 2 + now * 0.0004;
      const hx = Math.cos(a) * shieldRadius * 0.92;
      const hy = Math.sin(a) * shieldRadius * 0.92;
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const ha = (s / 6) * Math.PI * 2;
        const px = hx + Math.cos(ha) * 6;
        const py = hy + Math.sin(ha) * 6;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Impact shockwave ripple
    if (this.shieldHitTimer > 0) {
      const rippleRadius = (1 - this.shieldHitTimer) * 45;
      const rx = Math.cos(this.shieldRippleAngle) * 35;
      const ry = Math.sin(this.shieldRippleAngle) * 35;
      ctx.beginPath();
      ctx.arc(rx, ry, rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(248, 113, 113, ${this.shieldHitTimer})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderShipDamageEffects(
    ctx: CanvasRenderingContext2D,
    ship: ShipState,
    now: number
  ) {
    // 1. Scorch marks on wings when hull damaged
    if (ship.hull < 80) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.beginPath();
      ctx.arc(-16, 6, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Coolant smoke vapor when hull < 60
    if (ship.hull < 60) {
      if (Math.random() < 0.4) {
        this.particles.push({
          x: this.shipVisualX - 14,
          y: this.shipVisualY + 8,
          vx: (Math.random() - 0.5) * 1.5 - 1,
          vy: Math.random() * 2 + 1,
          size: Math.random() * 4 + 2,
          color: '#64748b',
          alpha: 0.5,
          life: 0,
          maxLife: 28,
        });
      }
    }

    // 3. Electrical arcs and fire short-circuits when hull < 35
    if (ship.hull < 35) {
      // Flashing yellow caution strobe on spine
      const alertFlash = Math.sin(now * 0.012) > 0;
      if (alertFlash) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 6;
        ctx.stroke();
      }

      // Spark leap
      if (Math.random() < 0.35) {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        let sx = 8;
        let sy = 5;
        ctx.moveTo(sx, sy);
        sx += (Math.random() - 0.5) * 14;
        sy += (Math.random() - 0.5) * 14;
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D, dt: number) {
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

      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private applySpectrumOverlay(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    now: number
  ) {
    const spectrum = this.displayProps.spectrum;

    if (spectrum === 'thermal') {
      // Amber/Infrared Thermal Sensor tint
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
      ctx.fillRect(-20, -20, w + 40, h + 40);

      // Thermal scan lines
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();
    } else if (spectrum === 'night') {
      // Night/EM Spectrum Phosphor Green
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(34, 197, 94, 0.14)';
      ctx.fillRect(-20, -20, w + 40, h + 40);

      // Night vision grain & phosphor lines
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.1)';
      ctx.lineWidth = 1.2;
      for (let y = 0; y < h; y += 6) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();
    } else if (spectrum === 'wireframe') {
      // Tactical Holographic Blueprint Overlay
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
      ctx.fillRect(-20, -20, w + 40, h + 40);

      // Precision coordinate reticles
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 8]);
      ctx.strokeRect(30, 30, w - 60, h - 60);
      ctx.restore();
    }
  }

  private renderTacticalOverlay(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    ship: ShipState,
    encounter: Encounter | null,
    now: number
  ) {
    ctx.save();

    // Flight vector trajectory line forward from the ship
    const sx = this.shipVisualX;
    const sy = this.shipVisualY;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.shipBankAngle);

    // Forward heading vector beam
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.lineTo(0, -180);
    ctx.stroke();

    // Target reticle pip at projected trajectory
    ctx.beginPath();
    ctx.arc(0, -140, 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.stroke();

    ctx.restore();

    // Corner HUD Telemetry Details
    ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.font = '10px "JetBrains Mono", monospace';

    // Compass Vector Heading
    const headingDeg = Math.round(((now * 0.005) % 360));
    ctx.fillText(`HEADING: ${String(headingDeg).padStart(3, '0')}° // PITCH: 0.0° // ROLL: ${(this.shipBankAngle * 57.3).toFixed(1)}°`, 16, 24);

    // Active Sensor Mode & Engine Thrust readout
    ctx.fillText(
      `SENSOR: [${this.displayProps.spectrum.toUpperCase()}] // CAM: [${this.displayProps.viewMode.toUpperCase()}] // THRUST: ${(ship.speed * 20)}%`,
      16,
      38
    );

    // Hazard lock or deep radar status
    if (encounter && encounter.active) {
      const dangerColor =
        encounter.dangerLevel === 'Extreme'
          ? '#ef4444'
          : encounter.dangerLevel === 'Hazardous'
          ? '#f97316'
          : '#38bdf8';
      ctx.fillStyle = dangerColor;
      ctx.fillText(
        `TACTICAL TARGET: ${encounter.title.toUpperCase()} [${Math.round(encounter.distanceRemaining)} KM]`,
        16,
        52
      );

      // Draw target tracking bracket around encounter center
      if (this.hazards.length > 0) {
        const primary = this.hazards[0];
        ctx.strokeStyle = dangerColor;
        ctx.lineWidth = 1.5;
        const bSize = primary.radius + 12;

        ctx.save();
        ctx.translate(primary.x, primary.y);
        // Corner brackets
        const bl = 8;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(-bSize, -bSize + bl);
        ctx.lineTo(-bSize, -bSize);
        ctx.lineTo(-bSize + bl, -bSize);
        // Top-right
        ctx.moveTo(bSize - bl, -bSize);
        ctx.lineTo(bSize, -bSize);
        ctx.lineTo(bSize, -bSize + bl);
        // Bottom-right
        ctx.moveTo(bSize, bSize - bl);
        ctx.lineTo(bSize, bSize);
        ctx.lineTo(bSize - bl, bSize);
        // Bottom-left
        ctx.moveTo(-bSize + bl, bSize);
        ctx.lineTo(-bSize, bSize);
        ctx.lineTo(-bSize, bSize - bl);
        ctx.stroke();

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = dangerColor;
        ctx.fillText(`LOCK: ${encounter.type.toUpperCase()}`, -bSize, -bSize - 5);
        ctx.restore();
      }
    } else {
      ctx.fillStyle = '#64748b';
      ctx.fillText(`SECTOR: ${ship.sector.toUpperCase()} // SCAN: NOMINAL`, 16, 52);
    }

    ctx.restore();
  }
}
