export type SpeakerType = 'Jax' | 'Elara' | 'Captain' | 'Ship AI';

export interface CommsMessage {
  id: string;
  speaker: SpeakerType;
  text: string;
  timestamp: string;
  sentiment?: 'critical' | 'warning' | 'success' | 'info' | 'crew_jax' | 'crew_elara';
}

export interface CrewAction {
  type: 
    | 'change_speed' 
    | 'change_energy' 
    | 'change_hull' 
    | 'change_shields' 
    | 'scan_anomaly' 
    | 'repair_engines'
    | 'evasive_burn';
  value: number;
  reason?: string;
}

export interface LLMCrewResponse {
  routedOfficer?: 'Jax' | 'Elara' | 'Both' | 'Ship AI';
  intent?: 'action' | 'query' | 'conversation';
  dialogue: Array<{
    speaker: 'Jax' | 'Elara' | 'Ship AI';
    text: string;
  }>;
  actions: CrewAction[];
  analysis?: string;
}

export type EncounterType = 
  | 'asteroid_field' 
  | 'spatial_anomaly' 
  | 'abandoned_vessel' 
  | 'ion_storm' 
  | 'alien_beacon';

export interface Encounter {
  id: string;
  title: string;
  type: EncounterType;
  description: string;
  dangerLevel: 'Low' | 'Moderate' | 'Hazardous' | 'Extreme';
  active: boolean;
  distanceRemaining: number;
  maxDistance: number;
  resolved: boolean;
  scanned: boolean;
  salvaged?: boolean;
}

export interface ShipState {
  hull: number; // 0 to 100
  energy: number; // 0 to 100
  speed: number; // 0 to 5
  shields: number; // 0 to 100
  distance: number; // light-years or km
  sector: string;
  sectorLevel: number;
  isGameOver: boolean;
  gameOverReason?: string;
  gameWon?: boolean;
  inHyperspace?: boolean;
}

export interface CrewStatus {
  jaxStress: number; // 0-100
  jaxStatus: 'Nominal' | 'Stressed' | 'Panicking' | 'Focused';
  elaraStress: number; // 0-100
  elaraCuriosity: number; // 0-100
  elaraStatus: 'Analytical' | 'Intrigued' | 'Fascinated' | 'Alarmed';
}

export interface SettingsState {
  provider: 'gemini' | 'openai' | 'simulation';
  customGeminiKey: string;
  customOpenAiKey: string;
  model: string;
  soundEnabled: boolean;
}
