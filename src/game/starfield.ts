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
  z: number; // 0 to 1 depth
  size: number;
  speedMultiplier: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  twinkleSpeed: number;
  twinkleOffset: number;
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

  private initEnvironment() {
    const w = this.canvas.width || 800;
    const h = this.canvas.height || 600;

    // 1. Starfield layers
    this.stars = [];
    const starCount = 260;
    const spectralColors = [
      '#ffffff', // White main sequence
      '#c7d2fe', // Blue-white giant
      '#7dd3fc', // Cyan hypergiant
      '#fef08a', // Yellow dwarf
      '#fed7aa', // Amber orange
      '#fca5a5', // Red dwarf
    ];

    for (let i = 0; i < starCount; i++) {
      const z = Math.random();
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z,
        size: (1 - z * 0.6) * 1.8 + 0.5,
        speedMultiplier: (1 - z * 0.75) * 1.2 + 0.15,
        alpha: Math.random() * 0.5 + 0.4,
        baseAlpha: Math.random() * 0.5 + 0.4,
        color: spectralColors[Math.floor(Math.random() * spectralColors.length)],
        twinkleSpeed: Math.random() * 3 + 1,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    // 2. High-speed Cosmic Dust Motes
    this.cosmicDust = [];
    for (let i = 0; i < 40; i++) {
      this.cosmicDust.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: Math.random() * 1.8 + 1.2,
        size: Math.random() * 1.2 + 0.5,
        alpha: Math.random() * 0.4 + 0.15,
      });
    }

    // 3. Distant celestial body
    this.planet = {
      x: w * 0.78,
      y: h * 0.22,
      radius: Math.min(w, h) * 0.14,
      hue: 205, // Azure gas giant with rings
      rings: true,
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
    // Deep obsidian space backdrop with radial gradient
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 30, w * 0.5, h * 0.5, Math.max(w, h));
    bg.addColorStop(0, '#0a0e1c');
    bg.addColorStop(0.5, '#050710');
    bg.addColorStop(1, '#020307');
    ctx.fillStyle = bg;
    ctx.fillRect(-60, -60, w + 120, h + 120);

    // Multi-lobe procedural cosmic nebula clouds
    // Lobe A: Deep Cyan & Sapphire
    const nA = ctx.createRadialGradient(w * 0.28, h * 0.3, 10, w * 0.28, h * 0.3, w * 0.45);
    nA.addColorStop(0, 'rgba(14, 165, 233, 0.08)');
    nA.addColorStop(0.5, 'rgba(99, 102, 241, 0.04)');
    nA.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nA;
    ctx.fillRect(0, 0, w, h);

    // Lobe B: Ethereal Magenta & Cosmic Violet
    const nB = ctx.createRadialGradient(w * 0.72, h * 0.65, 10, w * 0.72, h * 0.65, w * 0.4);
    nB.addColorStop(0, 'rgba(217, 70, 239, 0.06)');
    nB.addColorStop(0.6, 'rgba(147, 51, 234, 0.02)');
    nB.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nB;
    ctx.fillRect(0, 0, w, h);

    // Render distant ringed gas giant
    if (this.planet) {
      const p = this.planet;
      // Parallax scroll with ship distance
      const planetY = ((p.y + ship.distance * 8) % (h + p.radius * 4)) - p.radius * 2;
      const planetX = p.x;

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
        ringGrad.addColorStop(0, 'rgba(186, 230, 253, 0.02)');
        ringGrad.addColorStop(0.3, 'rgba(186, 230, 253, 0.22)');
        ringGrad.addColorStop(0.6, 'rgba(125, 211, 252, 0.12)');
        ringGrad.addColorStop(1, 'rgba(186, 230, 253, 0.02)');
        ctx.strokeStyle = ringGrad;
        ctx.stroke();
        ctx.restore();
      }

      // Planet Sphere with spherical shadow terminator
      const pGrad = ctx.createRadialGradient(
        -p.radius * 0.35,
        -p.radius * 0.35,
        p.radius * 0.1,
        0,
        0,
        p.radius
      );
      pGrad.addColorStop(0, '#38bdf8');
      pGrad.addColorStop(0.4, '#0369a1');
      pGrad.addColorStop(0.8, '#082f49');
      pGrad.addColorStop(1, '#020617');

      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = pGrad;
      ctx.fill();

      // Atmospheric limb glow
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
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
        ringGradF.addColorStop(0, 'rgba(186, 230, 253, 0.02)');
        ringGradF.addColorStop(0.3, 'rgba(186, 230, 253, 0.35)');
        ringGradF.addColorStop(0.6, 'rgba(125, 211, 252, 0.18)');
        ringGradF.addColorStop(1, 'rgba(186, 230, 253, 0.02)');
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
    const baseSpeed = 24;
    const speedMultiplier = ship.speed === 0 ? 0.3 : ship.speed * 1.6;
    const velocity = baseSpeed * (1 + speedMultiplier * 2.8);

    // 1. Background parallax stars
    for (const star of this.stars) {
      star.y += velocity * star.speedMultiplier * dt;
      if (star.y > h + 10) {
        star.y = -10;
        star.x = Math.random() * w;
      }

      // Dynamic twinkle
      const twinkle = Math.sin(now * 0.001 * star.twinkleSpeed + star.twinkleOffset) * 0.25;
      const alpha = Math.max(0.15, Math.min(1, star.baseAlpha + twinkle));

      ctx.save();
      ctx.globalAlpha = alpha;

      // Warp stretch lines if high speed
      if (ship.speed >= 3) {
        const streakLen = Math.min(45, ship.speed * 6 * star.speedMultiplier);
        ctx.strokeStyle = star.color;
        ctx.lineWidth = star.size * 0.75;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x, star.y - streakLen);
        ctx.stroke();
      } else {
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Star corona glint for brighter stars
        if (star.size > 1.8) {
          ctx.strokeStyle = star.color;
          ctx.globalAlpha = alpha * 0.4;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(star.x - star.size * 2, star.y);
          ctx.lineTo(star.x + star.size * 2, star.y);
          ctx.moveTo(star.x, star.y - star.size * 2);
          ctx.lineTo(star.x, star.y + star.size * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 2. High-speed Cosmic Dust
    for (const dust of this.cosmicDust) {
      dust.y += velocity * dust.speed * 1.5 * dt;
      if (dust.y > h + 20) {
        dust.y = -20;
        dust.x = Math.random() * w;
      }

      ctx.save();
      ctx.globalAlpha = dust.alpha * (ship.speed > 0 ? 1 : 0.4);
      const dustLen = Math.max(2, ship.speed * 8 * dust.speed);
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = dust.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(dust.x, dust.y);
      ctx.lineTo(dust.x, dust.y - dustLen);
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
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;

    // Moving vertical & horizontal vector grid lines
    const gridSize = 48;
    const gridOffsetY = (now * 0.04 * (ship.speed + 1)) % gridSize;

    for (let x = 0; x < w; x += gridSize) {
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
