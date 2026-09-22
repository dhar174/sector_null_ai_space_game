import { Encounter, EncounterType } from '../types';

export const ENCOUNTER_TEMPLATES: Array<{
  type: EncounterType;
  title: string;
  description: string;
  dangerLevel: 'Low' | 'Moderate' | 'Hazardous' | 'Extreme';
  distance: number;
}> = [
  {
    type: 'asteroid_field',
    title: 'Dense Chondrite Asteroid Field',
    description: 'High-density cluster of tumbling iron-silicate asteroids. Deflector shields or evasive speed adjustments required to avoid collision.',
    dangerLevel: 'Hazardous',
    distance: 40,
  },
  {
    type: 'spatial_anomaly',
    title: 'Tachyon Singularity Rift',
    description: 'A swirling purple spacetime distortion emitting intense radiation. Dangerous to hull, but rich in exotic harvestable energy.',
    dangerLevel: 'Extreme',
    distance: 35,
  },
  {
    type: 'abandoned_vessel',
    title: 'Derelict Cargo Carrier USV-88',
    description: 'A silent vessel tumbling in dead orbit with hull breaches. Sensors detect residual power cells and scrap metal in cargo hold.',
    dangerLevel: 'Low',
    distance: 30,
  },
  {
    type: 'ion_storm',
    title: 'Electromagnetic Ion Storm',
    description: 'Violent charged plasma storm interfering with navigational computers and siphoning auxiliary reactor capacitor charge.',
    dangerLevel: 'Moderate',
    distance: 45,
  },
  {
    type: 'asteroid_field',
    title: 'Hyper-Velocity Meteor Swarm',
    description: 'Micro-meteors traveling at extreme velocity across our flight vector. Shields will take severe strain without engine maneuvering.',
    dangerLevel: 'Extreme',
    distance: 30,
  },
  {
    type: 'spatial_anomaly',
    title: 'Baryonic Nebula Cloud',
    description: 'A phosphorescent nebula rich in energized helium-3 particles. Potential jackpot for science officer solar collection.',
    dangerLevel: 'Low',
    distance: 25,
  },
  {
    type: 'alien_beacon',
    title: 'Subspace Xeno Beacon',
    description: 'An ancient obsidian prism emitting harmonic subspace pulses. Science officer insists on deep frequency analysis.',
    dangerLevel: 'Moderate',
    distance: 30,
  },
];

let encounterCounter = 1;

export function generateRandomEncounter(sectorLevel: number): Encounter {
  const template = ENCOUNTER_TEMPLATES[Math.floor(Math.random() * ENCOUNTER_TEMPLATES.length)];
  const distance = template.distance + Math.floor(Math.random() * 15);
  
  return {
    id: `enc-${Date.now()}-${encounterCounter++}`,
    title: template.title,
    type: template.type,
    description: template.description,
    dangerLevel: sectorLevel > 2 && template.dangerLevel === 'Moderate' ? 'Hazardous' : template.dangerLevel,
    active: true,
    distanceRemaining: distance,
    maxDistance: distance,
    resolved: false,
    scanned: false,
  };
}
